import { useState, useRef, useEffect, useCallback } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Lightbulb, MessageSquare, Target, HandshakeIcon, Search, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  text: string;
  type: "objection" | "value" | "close" | "discovery" | "rapport";
}

interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: Date;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  objection: { label: "Rebuttal", icon: <MessageSquare className="h-3 w-3" />, color: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  value: { label: "Value", icon: <Target className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  close: { label: "Close", icon: <HandshakeIcon className="h-3 w-3" />, color: "bg-green-500/10 text-green-700 border-green-500/20" },
  discovery: { label: "Ask", icon: <Search className="h-3 w-3" />, color: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
  rapport: { label: "Rapport", icon: <Heart className="h-3 w-3" />, color: "bg-pink-500/10 text-pink-700 border-pink-500/20" },
};

export function SalesCoachMode() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [partialText, setPartialText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const fullTranscriptRef = useRef("");
  const { toast } = useToast();

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setPartialText(data.text || "");
    },
    onCommittedTranscript: (data) => {
      if (!data.text?.trim()) return;
      const entry: TranscriptEntry = {
        id: crypto.randomUUID(),
        text: data.text.trim(),
        timestamp: new Date(),
      };
      setTranscriptEntries((prev) => [...prev, entry]);
      setPartialText("");

      // Update rolling transcript and trigger AI analysis
      fullTranscriptRef.current += (fullTranscriptRef.current ? " " : "") + entry.text;
      // Keep rolling context to ~2000 chars
      if (fullTranscriptRef.current.length > 2000) {
        fullTranscriptRef.current = fullTranscriptRef.current.slice(-2000);
      }
      analyzeSegment(fullTranscriptRef.current, entry.text);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptEntries, partialText]);

  // Auto-scroll suggestions
  useEffect(() => {
    if (suggestionsRef.current) {
      suggestionsRef.current.scrollTop = suggestionsRef.current.scrollHeight;
    }
  }, [suggestions]);

  const analyzeSegment = useCallback(async (transcript: string, latestSegment: string) => {
    setIsAnalyzing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ transcript, latestSegment }),
        }
      );

      if (response.status === 429) {
        toast({ title: "Rate limited", description: "Please wait a moment before continuing.", variant: "destructive" });
        return;
      }
      if (response.status === 402) {
        toast({ title: "Usage limit", description: "AI usage limit reached.", variant: "destructive" });
        return;
      }

      if (!response.ok) return;

      const data = await response.json();
      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Sales coach analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const handleStart = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get scribe token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        toast({ title: "Auth required", description: "Please sign in to use Sales Coach.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get transcription token");
      const { token } = await response.json();
      if (!token) throw new Error("No token received");

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to start Sales Coach:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Could not start listening. Check mic permissions.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, toast]);

  const handleStop = useCallback(() => {
    scribe.disconnect();
    setIsConnected(false);
    setPartialText("");
  }, [scribe]);

  return (
    <div className="flex flex-col h-full">
      {/* Transcript Panel */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-3 py-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Transcript</span>
            {isConnected && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-500 font-medium">Listening</span>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-2" ref={transcriptRef}>
          {transcriptEntries.length === 0 && !partialText && !isConnected && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
              <Mic className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">Ready to Coach</p>
              <p className="text-xs mt-1">Start listening to get real-time sales suggestions during your conversation.</p>
            </div>
          )}
          {transcriptEntries.length === 0 && !partialText && isConnected && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 mb-2 animate-spin opacity-50" />
              <p className="text-xs">Waiting for speech...</p>
            </div>
          )}
          <div className="space-y-1.5">
            {transcriptEntries.map((entry) => (
              <div key={entry.id} className="text-sm leading-relaxed text-foreground">
                <span className="text-muted-foreground text-xs mr-1.5">
                  {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {entry.text}
              </div>
            ))}
            {partialText && (
              <div className="text-sm leading-relaxed text-muted-foreground italic">
                {partialText}...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* AI Suggestions Panel */}
      <div className="border-t border-border/50 flex-shrink-0" style={{ maxHeight: "45%" }}>
        <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suggestions</span>
          </div>
          {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        <ScrollArea className="px-3 py-2" ref={suggestionsRef} style={{ maxHeight: "120px" }}>
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              {isConnected ? "Suggestions will appear as the conversation progresses..." : "Start listening to receive AI coaching"}
            </p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s, i) => {
                const config = typeConfig[s.type] || typeConfig.rapport;
                return (
                  <div
                    key={i}
                    className="rounded-lg border p-2.5 bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${config.color}`}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </div>
                    <p className="text-sm leading-snug text-foreground">"{s.text}"</p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Controls */}
      <div className="border-t border-primary/10 p-3 flex-shrink-0">
        {!isConnected ? (
          <Button
            onClick={handleStart}
            disabled={isConnecting}
            className="w-full"
            size="sm"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Listening
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            variant="destructive"
            className="w-full"
            size="sm"
          >
            <MicOff className="h-4 w-4 mr-2" />
            Stop Listening
          </Button>
        )}
      </div>
    </div>
  );
}

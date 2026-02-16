import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Download, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

interface Message {
  role: "user" | "assistant";
  content: string;
  pdfData?: string;
  fileName?: string;
}

const DAILY_LIMIT = 50;

export function PocketAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your CT1 Pocket Agent assistant. I'm here to help you with trades, business, sales training and development, project management, and estimating. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // Prevent double transcription
    if (isTranscribing) {
      console.log('Already transcribing, skipping duplicate call');
      return;
    }
    
    setIsTranscribing(true);
    let hasProcessed = false; // Guard against multiple onloadend calls
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use voice input.",
          variant: "destructive"
        });
        setIsTranscribing(false);
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        // Guard against multiple calls
        if (hasProcessed) {
          console.log('Already processed this audio, skipping');
          return;
        }
        hasProcessed = true;
        
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          console.log('Sending audio for transcription, length:', base64Audio?.length);
          
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ audio: base64Audio }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to transcribe audio");
          }

          const data = await response.json();
          console.log('Transcription result:', data.text);
          
          if (data.text) {
            // Replace input entirely instead of appending to prevent doubling
            setInput(data.text);
          }
        } catch (error) {
          console.error("Transcription error:", error);
          toast({
            title: "Transcription Error",
            description: "Failed to transcribe audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
      setIsTranscribing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Get auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use Pocket Agent.",
        variant: "destructive"
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pocketbot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (response.status === 429) {
        const errorData = await response.json();
        setIsLoading(false);
        
        // Show upgrade link for free users
        const content = errorData.upgrade_required 
          ? errorData.error
          : errorData.error || "You've reached your daily limit. Please try again tomorrow!";
        
        setMessages([...newMessages, {
          role: "assistant",
          content
        }]);
        
        if (errorData.upgrade_required) {
          toast({
            title: "Upgrade Required",
            description: "Get unlimited prompts and full responses with a CT1 Pocket Agent subscription!",
            action: (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => window.location.href = '/bot-signup'}
              >
                Upgrade Now
              </Button>
            ),
          });
        }
        return;
      }

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error("AI usage limit reached. Please contact support.");
        }
        throw new Error("Failed to get response from AI");
      }

      // Check if response is JSON (PDF/task response) or streaming
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const jsonResponse = await response.json();
        
        // Handle PDF response
        if (jsonResponse.type === "pdf") {
          setMessages([...newMessages, {
            role: "assistant",
            content: jsonResponse.content,
            pdfData: jsonResponse.pdfData,
            fileName: jsonResponse.fileName
          }]);
          setIsLoading(false);
          return;
        }
        
        // Handle task added response
        if (jsonResponse.type === "task_added" || jsonResponse.type === "task_error") {
          setMessages([...newMessages, {
            role: "assistant",
            content: jsonResponse.content
          }]);
          setIsLoading(false);
          return;
        }
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;

      // Add empty assistant message that will be updated
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      // Remove the empty assistant message on error
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 p-4 md:p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-2 md:p-3 rounded-2xl border-2 border-primary/30">
                <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  CT1 Pocket Agent
                </h2>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium hidden sm:block">
                Your AI-powered assistant for trades, business, sales training, project management, and estimating
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary"
              className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
            >
              {DAILY_LIMIT} Daily Limit
            </Badge>
            <Button 
              size="sm" 
              variant="secondary" 
              className="rounded-full"
              onClick={() => window.location.href = '/bot-signup'}
            >
              Sign up today
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 m-4 md:m-6 border-2 border-primary/20 shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-card/95 to-card backdrop-blur-sm">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
              <Bot className="relative h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">CT1 Pocket Agent</CardTitle>
              <CardDescription>Your AI business consultant</CardDescription>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 md:gap-3 ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                } animate-in fade-in slide-in-from-bottom-2`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                    <img src={ct1Logo} alt="CT1" className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3 md:p-4 max-w-[85%] shadow-lg ${
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-muted/50 to-muted border border-border"
                      : "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border border-primary/50"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                    {message.content}
                  </p>
                  {message.pdfData && message.fileName && (
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = message.pdfData!;
                        link.download = message.fileName!;
                        link.click();
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center border border-primary/40">
                    <span className="text-primary-foreground font-bold text-xs md:text-sm">You</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2 md:gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                  <img src={ct1Logo} alt="CT1" className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="bg-gradient-to-br from-muted/50 to-muted border border-border rounded-2xl p-3 md:p-4 shadow-md">
                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-primary/10 p-4 bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur-sm">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your contracting business..."
              disabled={isLoading || isTranscribing}
              className="flex-1 text-base py-6 rounded-xl border-primary/20 focus:border-primary/40"
            />
            <Button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isTranscribing}
              size="lg"
              variant={isRecording ? "destructive" : "outline"}
              className={`px-4 rounded-xl ${isRecording ? 'animate-pulse' : ''}`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isTranscribing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim() || isTranscribing}
              size="lg"
              className="px-6 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

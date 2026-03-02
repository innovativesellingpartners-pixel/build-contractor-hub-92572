import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Play, FileText, Clock, User, Search, PhoneIncoming, ChevronRight, Volume2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import forgeLogoIcon from "@/assets/forgeailogo2.png";

interface MergedCallRecord {
  id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  status: string;
  outcome: string | null;
  ai_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  recording_sid: string | null;
  recording_status: string | null;
  recording_duration: number | null;
  duration: number | null;
  created_at: string;
  customer_info: any;
  caller_name: string | null;
  conversation_history: any;
  source: 'calls' | 'call_sessions';
}

export function ForgeCallCenter({ onBack }: { onBack: () => void }) {
  const [calls, setCalls] = useState<MergedCallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<MergedCallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from both tables in parallel
      const [callsRes, sessionsRes] = await Promise.all([
        supabase
          .from("calls")
          .select("*")
          .eq("contractor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("call_sessions")
          .select("*")
          .eq("contractor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      // Merge: build a map by call_sid, preferring whichever has more data
      const mergedMap = new Map<string, MergedCallRecord>();

      // Process call_sessions first (usually has recording data)
      for (const s of (sessionsRes.data || [])) {
        mergedMap.set(s.call_sid, {
          id: s.id,
          call_sid: s.call_sid,
          from_number: s.from_number,
          to_number: s.to_number,
          status: s.status,
          outcome: s.outcome,
          ai_summary: s.ai_summary,
          transcript: null, // call_sessions doesn't have transcript field directly
          recording_url: s.recording_url,
          recording_sid: s.recording_sid,
          recording_status: s.recording_status,
          recording_duration: s.recording_duration,
          duration: s.recording_duration,
          created_at: s.created_at,
          customer_info: null,
          caller_name: s.caller_name,
          conversation_history: s.conversation_history,
          source: 'call_sessions',
        });
      }

      // Overlay calls table data (has transcript, customer_info, ai_summary)
      for (const c of (callsRes.data || [])) {
        const existing = mergedMap.get(c.call_sid);
        if (existing) {
          // Merge: prefer non-null values from calls table
          if (c.transcript) existing.transcript = c.transcript;
          if (c.ai_summary) existing.ai_summary = c.ai_summary;
          if (c.recording_url && !existing.recording_url) existing.recording_url = c.recording_url;
          if (c.recording_sid && !existing.recording_sid) existing.recording_sid = c.recording_sid;
          if (c.customer_info) existing.customer_info = c.customer_info;
          if (c.outcome && !existing.outcome) existing.outcome = c.outcome;
          if (c.duration && !existing.duration) existing.duration = c.duration;
        } else {
          mergedMap.set(c.call_sid, {
            id: c.id,
            call_sid: c.call_sid,
            from_number: c.from_number,
            to_number: c.to_number,
            status: c.call_status,
            outcome: c.outcome,
            ai_summary: c.ai_summary,
            transcript: c.transcript,
            recording_url: c.recording_url,
            recording_sid: c.recording_sid,
            recording_status: null,
            recording_duration: c.duration,
            duration: c.duration,
            created_at: c.created_at,
            customer_info: c.customer_info,
            caller_name: null,
            conversation_history: null,
            source: 'calls',
          });
        }
      }

      // Sort by created_at descending
      const merged = Array.from(mergedMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCalls(merged);
    } catch (err: any) {
      console.error("Error loading calls:", err);
      setError("Failed to load calls. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime for live updates
  useEffect(() => {
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel('forge-call-center-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `contractor_id=eq.${user.id}` }, () => loadCalls())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions', filter: `contractor_id=eq.${user.id}` }, () => loadCalls())
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case "booked":
      case "appointment_booked":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 text-[11px] font-medium">Booked</Badge>;
      case "lead_captured":
      case "message_taken":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-200 text-[11px] font-medium">Lead</Badge>;
      case "voicemail":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-200 text-[11px] font-medium">Voicemail</Badge>;
      case "missed":
      case "no-answer":
        return <Badge className="bg-red-500/15 text-red-600 border-red-200 text-[11px] font-medium">Missed</Badge>;
      default:
        return <Badge variant="secondary" className="text-[11px] font-medium">{outcome || "Handled"}</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return "N/A";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getRecordingAudioSrc = (call: MergedCallRecord) => {
    if (!call.recording_url) return null;
    // If it's a Twilio recording URL, proxy it
    if (call.recording_url.includes('twilio.com') || call.recording_url.includes('api.twilio')) {
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-recording-proxy?url=${encodeURIComponent(call.recording_url)}`;
    }
    // Direct URL (Forge-hosted or other)
    return call.recording_url;
  };

  const renderConversationHistory = (history: any) => {
    if (!history) return null;
    const messages = Array.isArray(history) ? history : [];
    if (messages.length === 0) return null;

    return (
      <div className="space-y-2">
        {messages.map((msg: any, idx: number) => (
          <div
            key={idx}
            className={`text-sm p-3 rounded-xl max-w-[85%] ${
              msg.role === 'assistant' || msg.role === 'ai'
                ? 'bg-orange-50 dark:bg-orange-950/30 text-foreground ml-0 mr-auto'
                : 'bg-muted/60 text-foreground ml-auto mr-0'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
              {msg.role === 'assistant' || msg.role === 'ai' ? 'Forge AI' : 'Caller'}
            </p>
            <p className="leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const filteredCalls = calls.filter(c =>
    !search ||
    c.from_number.includes(search) ||
    c.ai_summary?.toLowerCase().includes(search.toLowerCase()) ||
    c.caller_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.transcript?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Detail View ───
  if (selectedCall) {
    const audioSrc = getRecordingAudioSrc(selectedCall);
    const hasTranscript = !!(selectedCall.transcript || (selectedCall.conversation_history && Array.isArray(selectedCall.conversation_history) && selectedCall.conversation_history.length > 0));
    const hasRecording = !!audioSrc;

    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCall(null)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-slate-900 border border-white/90 flex items-center justify-center shrink-0"><img src={forgeLogoIcon} alt="Forge AI" className="h-5 w-5 object-contain" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight">Call Details</h2>
            <p className="text-xs text-muted-foreground">
              {selectedCall.caller_name || selectedCall.from_number} · {format(new Date(selectedCall.created_at), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          {getOutcomeBadge(selectedCall.outcome)}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "From", value: selectedCall.caller_name || selectedCall.from_number },
            { label: "Date", value: format(new Date(selectedCall.created_at), "MMM d, yyyy") },
            { label: "Duration", value: formatDuration(selectedCall.duration) },
            { label: "Status", value: selectedCall.status },
          ].map((item) => (
            <div key={item.label} className="bg-muted/40 rounded-xl p-3.5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
              <p className="text-sm font-semibold mt-0.5 capitalize">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Feature indicators */}
        <div className="flex gap-2 flex-wrap">
          {hasRecording && (
            <Badge variant="outline" className="gap-1 text-xs"><Volume2 className="h-3 w-3" /> Audio Available</Badge>
          )}
          {hasTranscript && (
            <Badge variant="outline" className="gap-1 text-xs"><FileText className="h-3 w-3" /> Transcript Available</Badge>
          )}
          {selectedCall.ai_summary && (
            <Badge variant="outline" className="gap-1 text-xs">✦ AI Summary</Badge>
          )}
        </div>

        {/* AI Summary */}
        {selectedCall.ai_summary && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-2">AI Summary</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{selectedCall.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Audio Playback */}
        {hasRecording && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-orange-500" /> Call Recording
              </p>
              <WaveformPlayer src={audioSrc!} />
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {selectedCall.transcript && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" /> Transcript
              </p>
              <div className="bg-muted/40 rounded-xl p-4 text-sm max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {selectedCall.transcript}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation History (chat-style) */}
        {selectedCall.conversation_history && Array.isArray(selectedCall.conversation_history) && selectedCall.conversation_history.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" /> Conversation
              </p>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {renderConversationHistory(selectedCall.conversation_history)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Info */}
        {selectedCall.customer_info && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" /> Customer Info
              </p>
              <div className="bg-muted/40 rounded-xl p-4">
                {typeof selectedCall.customer_info === 'object' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedCall.customer_info).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-xs font-mono">{JSON.stringify(selectedCall.customer_info, null, 2)}</pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No data fallback */}
        {!hasRecording && !hasTranscript && !selectedCall.ai_summary && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No recording, transcript, or summary available for this call yet.</p>
              <p className="text-xs mt-1">Data will appear here once Forge finishes processing.</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-slate-900 border border-white/90 flex items-center justify-center shrink-0"><img src={forgeLogoIcon} alt="Forge AI" className="h-5 w-5 object-contain" /></div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Call Center</h2>
          <p className="text-xs text-muted-foreground">Recordings, transcripts & booking status</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadCalls} className="ml-auto shrink-0">Retry</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-orange-500" />
          Loading calls...
        </div>
      ) : calls.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <PhoneIncoming className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">No calls yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Calls handled by Forge AI will appear here with full transcripts and recordings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone, name, or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-1">
            {filteredCalls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="w-full text-left group"
              >
                <Card className="border hover:border-orange-300/50 hover:shadow-sm transition-all duration-150">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{call.from_number}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(call.created_at), "MMM d, h:mm a")}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </button>
            ))}
            {filteredCalls.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No matching calls</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

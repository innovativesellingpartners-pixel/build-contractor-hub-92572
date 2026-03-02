import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Play, FileText, Clock, User, Search, PhoneIncoming } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import forgeLogoIcon from "@/assets/forgeailogo2.png";

interface CallRecord {
  id: string;
  from_number: string;
  call_status: string;
  outcome: string | null;
  ai_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration: number | null;
  created_at: string;
  customer_info: any;
}

export function ForgeCallCenter({ onBack }: { onBack: () => void }) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("calls")
      .select("*")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setCalls((data as CallRecord[]) || []);
    setLoading(false);
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case "booked":
      case "appointment_booked":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 text-[11px] font-medium">Booked</Badge>;
      case "lead_captured":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-200 text-[11px] font-medium">Lead</Badge>;
      case "voicemail":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-200 text-[11px] font-medium">Voicemail</Badge>;
      default:
        return <Badge variant="secondary" className="text-[11px] font-medium">{outcome || "Unknown"}</Badge>;
    }
  };

  const filteredCalls = calls.filter(c =>
    !search || c.from_number.includes(search) || c.ai_summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <img src={forgeLogoIcon} alt="Forge AI" className="h-8 w-8 object-contain" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Call Center</h2>
          <p className="text-xs text-muted-foreground">Recordings, transcripts & booking status</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone number or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Call List */}
            <div className="lg:col-span-1 space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredCalls.map((call) => (
                <button
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className="w-full text-left"
                >
                  <Card className={`border cursor-pointer transition-all duration-150 ${
                    selectedCall?.id === call.id
                      ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/5 shadow-sm"
                      : "hover:border-border/80 hover:shadow-sm"
                  }`}>
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold">{call.from_number}</span>
                        {getOutcomeBadge(call.outcome)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {format(new Date(call.created_at), "MMM d, h:mm a")}
                        {call.duration != null && (
                          <span className="text-muted-foreground/70">• {Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                        )}
                      </div>
                      {call.ai_summary && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">{call.ai_summary}</p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              ))}
              {filteredCalls.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No matching calls</p>
              )}
            </div>

            {/* Call Detail */}
            <div className="lg:col-span-2">
              {selectedCall ? (
                <Card className="shadow-sm">
                  <CardHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">Call Details</CardTitle>
                      {getOutcomeBadge(selectedCall.outcome)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "From", value: selectedCall.from_number },
                        { label: "Date", value: format(new Date(selectedCall.created_at), "MMM d, yyyy") },
                        { label: "Duration", value: selectedCall.duration != null ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : "N/A" },
                        { label: "Status", value: selectedCall.call_status },
                      ].map((item) => (
                        <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{item.label}</p>
                          <p className="text-sm font-semibold mt-0.5 capitalize">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedCall.ai_summary && (
                      <div>
                        <p className="text-sm font-semibold mb-2">AI Summary</p>
                        <div className="bg-muted/40 rounded-xl p-4 text-sm leading-relaxed">{selectedCall.ai_summary}</div>
                      </div>
                    )}

                    {selectedCall.transcript && (
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-muted-foreground" /> Transcript
                        </p>
                        <div className="bg-muted/40 rounded-xl p-4 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {selectedCall.transcript}
                        </div>
                      </div>
                    )}

                    {selectedCall.recording_url && (
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Play className="h-4 w-4 text-muted-foreground" /> Recording
                        </p>
                        <audio controls className="w-full" src={selectedCall.recording_url} />
                      </div>
                    )}

                    {selectedCall.customer_info && (
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <User className="h-4 w-4 text-muted-foreground" /> Customer Info
                        </p>
                        <div className="bg-muted/40 rounded-xl p-4">
                          <pre className="text-xs font-mono">{JSON.stringify(selectedCall.customer_info, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-20 text-center text-muted-foreground">
                    <Phone className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Select a call to view details</p>
                    <p className="text-xs mt-1">Click any call from the list on the left</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

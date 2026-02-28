import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Play, FileText, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
        return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">Booked</Badge>;
      case "lead_captured":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">Lead</Badge>;
      case "voicemail":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">Voicemail</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{outcome || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Call Center</h2>
          <p className="text-sm text-muted-foreground">View recordings, transcripts, and booking status</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading calls...</div>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No calls yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Calls handled by Forge AI will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Call List */}
          <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="w-full text-left"
              >
                <Card className={`border cursor-pointer hover:border-orange-300 transition-colors ${selectedCall?.id === call.id ? "border-orange-500 bg-orange-50/50" : ""}`}>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{call.from_number}</span>
                      {getOutcomeBadge(call.outcome)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(call.created_at), "MMM d, h:mm a")}
                      {call.duration && (
                        <span>• {Math.round(call.duration / 60)}m {call.duration % 60}s</span>
                      )}
                    </div>
                    {call.ai_summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{call.ai_summary}</p>
                    )}
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {/* Call Detail */}
          <div className="lg:col-span-2">
            {selectedCall ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Call Details</CardTitle>
                    {getOutcomeBadge(selectedCall.outcome)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">From</p>
                      <p className="font-medium">{selectedCall.from_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(selectedCall.created_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {selectedCall.duration ? `${Math.round(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{selectedCall.call_status}</p>
                    </div>
                  </div>

                  {selectedCall.ai_summary && (
                    <div>
                      <p className="text-sm font-medium mb-1">AI Summary</p>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">{selectedCall.ai_summary}</div>
                    </div>
                  )}

                  {selectedCall.transcript && (
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Transcript
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {selectedCall.transcript}
                      </div>
                    </div>
                  )}

                  {selectedCall.recording_url && (
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Play className="h-3.5 w-3.5" /> Recording
                      </p>
                      <audio controls className="w-full" src={selectedCall.recording_url} />
                    </div>
                  )}

                  {selectedCall.customer_info && (
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> Customer Info
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <pre className="text-xs">{JSON.stringify(selectedCall.customer_info, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Select a call to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, Users, TrendingUp, ArrowRight, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ForgeCallCenter } from "./forge/ForgeCallCenter";
import { ForgeSettings } from "./forge/ForgeSettings";

type ForgeView = "dashboard" | "call-center" | "settings";

export function VoiceAI() {
  const [view, setView] = useState<ForgeView>("dashboard");
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState({
    callsToday: 0,
    appointmentsBooked: 0,
    leadsCaptured: 0,
    bookingRate: 0,
  });

  useEffect(() => {
    checkForgeStatus();
    loadStats();
  }, []);

  const checkForgeStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from("contractor_users")
      .select("contractor_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membership) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("voice_ai_enabled")
        .eq("id", membership.contractor_id)
        .maybeSingle();

      setIsActive(contractor?.voice_ai_enabled ?? false);
    }

    // Fallback: check contractor_ai_profiles
    const { data: profile } = await supabase
      .from("contractor_ai_profiles")
      .select("ai_enabled")
      .eq("contractor_id", user.id)
      .maybeSingle();

    if (profile?.ai_enabled) setIsActive(true);
  };

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: calls } = await supabase
      .from("calls")
      .select("id, outcome, ai_handled")
      .eq("contractor_id", user.id)
      .gte("created_at", todayStart.toISOString());

    if (calls) {
      const booked = calls.filter(c => c.outcome === "booked" || c.outcome === "appointment_booked").length;
      const leads = calls.filter(c => c.outcome === "lead_captured" || c.outcome === "booked").length;
      setStats({
        callsToday: calls.length,
        appointmentsBooked: booked,
        leadsCaptured: leads,
        bookingRate: calls.length > 0 ? Math.round((booked / calls.length) * 100) : 0,
      });
    }
  };

  if (view === "call-center") {
    return <ForgeCallCenter onBack={() => setView("dashboard")} />;
  }

  if (view === "settings") {
    return <ForgeSettings onBack={() => setView("dashboard")} />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome to Forge AI
            </h2>
            <p className="text-muted-foreground text-sm">
              Your intelligent voice AI intake & booking platform
            </p>
          </div>
        </div>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={`text-xs px-3 py-1 ${
            isActive
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isActive ? "bg-green-500" : "bg-muted-foreground"}`} />
          {isActive ? "Voice AI Active" : "Voice AI Inactive"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Phone className="h-5 w-5 text-orange-500" />}
          value={stats.callsToday}
          label="Calls Today"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          value={stats.appointmentsBooked}
          label="Appointments Booked"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-orange-500" />}
          value={stats.leadsCaptured}
          label="Leads Captured"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          value={`${stats.bookingRate}%`}
          label="Booking Rate"
        />
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setView("call-center")}
          className="text-left group"
        >
          <Card className="h-full border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Call Center</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View recordings, transcripts, and booking status
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => setView("settings")}
          className="text-left group"
        >
          <Card className="h-full border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Voice AI Settings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure hours, booking rules, and integrations
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <Card className="border">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          {icon}
          <span className="text-xs text-muted-foreground">—</span>
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

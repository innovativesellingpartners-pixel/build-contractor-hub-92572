import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, Users, TrendingUp, ArrowRight, Settings, LayoutDashboard, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ForgeCallCenter } from "./forge/ForgeCallCenter";
import { ForgeSettings } from "./forge/ForgeSettings";
import forgeLogoIcon from "@/assets/forgeailogo2.png";

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

    // Get all call sessions (same source as Call Center)
    const { data: allSessions } = await supabase
      .from("call_sessions")
      .select("id, outcome, action_taken, created_at")
      .eq("contractor_id", user.id);

    // Get today's sessions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = allSessions?.filter(
      (s) => new Date(s.created_at) >= todayStart
    ) || [];

    // Count booked meetings from calendar_events
    const { count: bookedCount } = await supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id);

    const totalCalls = allSessions?.length || 0;
    const booked = bookedCount || 0;
    const leads = allSessions?.filter(
      (s) => s.outcome === "lead_captured" || s.outcome === "message_taken" || s.action_taken === "take_message"
    ).length || 0;

    setStats({
      callsToday: totalCalls,
      appointmentsBooked: booked,
      leadsCaptured: leads,
      bookingRate: totalCalls > 0 ? Math.round((booked / totalCalls) * 100) : 0,
    });
  };

  if (view === "call-center") {
    return <ForgeCallCenter onBack={() => setView("dashboard")} />;
  }

  if (view === "settings") {
    return <ForgeSettings onBack={() => setView("dashboard")} />;
  }

  const tabs = [
    { key: "dashboard" as ForgeView, label: "Dashboard", icon: LayoutDashboard },
    { key: "call-center" as ForgeView, label: "Call Center", icon: PhoneCall },
    { key: "settings" as ForgeView, label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Branded Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={forgeLogoIcon} alt="Forge AI" className="h-12 w-12 object-contain drop-shadow-lg ring-2 ring-white rounded-full" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Forge<span className="text-orange-400">AI</span>
              </h1>
              <p className="text-slate-400 text-sm">Intelligent voice AI intake & booking</p>
            </div>
          </div>

          <Badge
            className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 ${
              isActive
                ? 'bg-green-500/20 text-green-300'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div className="relative flex items-center gap-1 mt-5 border-t border-slate-700/50 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === tab.key
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Phone, value: stats.callsToday, label: "Total Calls", color: "text-orange-500", bg: "bg-orange-500/10" },
          { icon: Calendar, value: stats.appointmentsBooked, label: "Booked", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: Users, value: stats.leadsCaptured, label: "Leads", color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: TrendingUp, value: `${stats.bookingRate}%`, label: "Booking Rate", color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${stat.bg} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => setView("call-center")} className="text-left group">
          <Card className="h-full border hover:border-orange-300/50 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                <PhoneCall className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold">Call Center</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Recordings, transcripts & booking status</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setView("settings")} className="text-left group">
          <Card className="h-full border hover:border-orange-300/50 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0 group-hover:bg-slate-500/20 transition-colors">
                <Settings className="h-6 w-6 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold">Voice AI Settings</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Hours, booking rules & integrations</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}

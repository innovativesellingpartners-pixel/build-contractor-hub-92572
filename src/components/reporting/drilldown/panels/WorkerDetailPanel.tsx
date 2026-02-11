/**
 * WorkerDetailPanel — Shows team member / worker details in drill-down.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, Clock, DollarSign } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    id?: string;
    name?: string;
    role?: string;
    rate?: number;
    totalHours?: number;
    totalEarnings?: number;
    skills_trades?: string[];
  };
}

export function WorkerDetailPanel({ data }: Props) {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();

  // Fetch assigned jobs
  const { data: assignments } = useQuery({
    queryKey: ["drilldown-worker-jobs", data.id],
    queryFn: async () => {
      if (!data.id) return [];
      const { data: asgn } = await supabase
        .from("crew_assignments")
        .select("id, job_id, assigned_date, jobs(id, name, job_status, budget_amount)")
        .eq("crew_member_id", data.id)
        .order("assigned_date", { ascending: false })
        .limit(10);
      return asgn || [];
    },
    enabled: !!data.id,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
          {(data.name || "?")[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{data.name || "Team Member"}</h3>
          {data.role && <Badge variant="outline" className="text-xs mt-0.5">{data.role}</Badge>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        {data.rate && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="text-base font-bold tabular-nums">{fmt(data.rate)}/hr</p>
          </div>
        )}
        {data.totalHours !== undefined && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-base font-bold tabular-nums">{data.totalHours}h</p>
          </div>
        )}
        {data.totalEarnings !== undefined && (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            <p className="text-base font-bold tabular-nums text-green-600">{fmt(data.totalEarnings)}</p>
          </div>
        )}
      </div>

      {data.skills_trades && data.skills_trades.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Skills & Trades</h4>
          <div className="flex flex-wrap gap-1">
            {data.skills_trades.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Assigned Jobs */}
      {assignments && assignments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> Assigned Jobs
          </h4>
          <div className="space-y-1.5">
            {assignments.map((a: any) => {
              const job = a.jobs;
              if (!job) return null;
              return (
                <Button
                  key={a.id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                  onClick={() => openPanel({
                    type: "job",
                    title: job.name || "Job",
                    data: job,
                  })}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Briefcase className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{job.name}</span>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">{job.job_status}</Badge>
                  </div>
                  <span className="font-medium tabular-nums ml-2">{fmt(Number(job.budget_amount || 0))}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

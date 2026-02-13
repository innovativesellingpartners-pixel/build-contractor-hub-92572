import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Briefcase, Users, FileText, Search, Target } from "lucide-react";

function DroppableTarget({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 rounded-lg border-2 border-dashed transition-all duration-200",
        isOver
          ? "border-primary bg-primary/5 scale-[1.01] shadow-md"
          : "border-muted-foreground/20 hover:border-muted-foreground/40",
        className
      )}
    >
      {children}
      {isOver && (
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary animate-pulse">
          <Target className="h-3 w-3" />
          Drop here to assign
        </div>
      )}
    </div>
  );
}

export function DropTargetPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [search, setSearch] = useState("");

  const { data: jobs, error: jobsError, isLoading: jobsLoading } = useQuery({
    queryKey: ["drop-target-jobs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, job_number, job_status, contract_value, client_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Failed to fetch jobs for expense assignment:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: customers, error: customersError, isLoading: customersLoading } = useQuery({
    queryKey: ["drop-target-customers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, customer_number, email, phone")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Failed to fetch customers for expense assignment:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: estimates, error: estimatesError, isLoading: estimatesLoading } = useQuery({
    queryKey: ["drop-target-estimates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("estimates")
        .select("id, title, estimate_number, client_name, total_amount, status")
        .eq("user_id", user.id)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Failed to fetch estimates for expense assignment:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

  const filterItems = (items: any[], keys: string[]) => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter((item) =>
      keys.some((k) => (item[k] || "").toString().toLowerCase().includes(term))
    );
  };

  const filteredJobs = filterItems(jobs || [], ["name", "job_number", "client_name"]);
  const filteredCustomers = filterItems(customers || [], ["name", "customer_number", "email"]);
  const filteredEstimates = filterItems(estimates || [], ["title", "estimate_number", "client_name"]);

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    in_progress: "bg-blue-500/10 text-blue-600",
    completed: "bg-muted text-muted-foreground",
    pending: "bg-yellow-500/10 text-yellow-600",
    sent: "bg-blue-500/10 text-blue-600",
    signed: "bg-green-500/10 text-green-600",
    draft: "bg-muted text-muted-foreground",
  };

  return (
    <>
      <div className="p-4 border-b shrink-0 space-y-3">
        <h3 className="font-semibold text-sm">Drop Targets</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, customers, estimates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="jobs" className="text-xs gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              Jobs ({filteredJobs.length})
            </TabsTrigger>
            <TabsTrigger value="customers" className="text-xs gap-1">
              <Users className="h-3.5 w-3.5" />
              Customers ({filteredCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="estimates" className="text-xs gap-1">
              <FileText className="h-3.5 w-3.5" />
              Estimates ({filteredEstimates.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {tab === "jobs" && jobsLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">Loading jobs...</p>
          )}
          {tab === "jobs" && jobsError && (
            <p className="text-xs text-destructive text-center py-4">Failed to load jobs. Please try again.</p>
          )}
          {tab === "jobs" && !jobsLoading && !jobsError && filteredJobs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No jobs found. Create a job first.</p>
          )}
          {tab === "jobs" &&
            filteredJobs.map((job: any) => (
              <DroppableTarget key={job.id} id={`job-${job.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{job.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {job.job_number}{job.client_name && ` · ${job.client_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.job_status && (
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[job.job_status])}>
                        {job.job_status}
                      </Badge>
                    )}
                    {job.contract_value > 0 && (
                      <span className="text-xs font-medium tabular-nums">{fmt(job.contract_value)}</span>
                    )}
                  </div>
                </div>
              </DroppableTarget>
            ))}

          {tab === "customers" && customersLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">Loading customers...</p>
          )}
          {tab === "customers" && customersError && (
            <p className="text-xs text-destructive text-center py-4">Failed to load customers. Please try again.</p>
          )}
          {tab === "customers" && !customersLoading && !customersError && filteredCustomers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No customers found.</p>
          )}
          {tab === "customers" &&
            filteredCustomers.map((cust: any) => (
              <DroppableTarget key={cust.id} id={`customer-${cust.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{cust.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cust.customer_number}{cust.email && ` · ${cust.email}`}
                    </p>
                  </div>
                </div>
              </DroppableTarget>
            ))}

          {tab === "estimates" && estimatesLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">Loading estimates...</p>
          )}
          {tab === "estimates" && estimatesError && (
            <p className="text-xs text-destructive text-center py-4">Failed to load estimates. Please try again.</p>
          )}
          {tab === "estimates" && !estimatesLoading && !estimatesError && filteredEstimates.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No estimates found.</p>
          )}
          {tab === "estimates" &&
            filteredEstimates.map((est: any) => (
              <DroppableTarget key={est.id} id={`estimate-${est.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{est.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {est.estimate_number}{est.client_name && ` · ${est.client_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {est.status && (
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[est.status])}>
                        {est.status}
                      </Badge>
                    )}
                    {est.total_amount > 0 && (
                      <span className="text-xs font-medium tabular-nums">{fmt(est.total_amount)}</span>
                    )}
                  </div>
                </div>
              </DroppableTarget>
            ))}
        </div>
      </ScrollArea>
    </>
  );
}

/**
 * EstimateDetailPanel — Shows estimate details in the drill-down panel.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, User, Briefcase, DollarSign, ExternalLink, Calendar } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    id?: string;
    title?: string;
    status?: string;
    total_amount?: number;
    created_at?: string;
    client_name?: string;
    customer_id?: string;
    job_id?: string;
  };
}

export function EstimateDetailPanel({ data }: Props) {
  const { openPanel } = useDrillDown();

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    accepted: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    sold: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    voided: "bg-muted text-muted-foreground",
  };

  const { data: customer } = useQuery({
    queryKey: ["drilldown-est-customer", data.customer_id],
    queryFn: async () => {
      if (!data.customer_id) return null;
      const { data: c } = await supabase.from("customers").select("id, name, email, phone, lifetime_value").eq("id", data.customer_id).single();
      return c;
    },
    enabled: !!data.customer_id,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{data.title || "Estimate"}</h3>
          </div>
          {data.created_at && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(data.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <Badge className={statusColor[data.status || ""] || ""}>{data.status || "Draft"}</Badge>
      </div>

      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Total Amount</p>
        <p className="text-3xl font-bold tabular-nums">{fmt(Number(data.total_amount || 0))}</p>
      </div>

      <Separator />

      {(customer || data.client_name) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <User className="h-4 w-4" /> Customer
          </h4>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
            onClick={() => openPanel({
              type: "customer",
              title: customer?.name || data.client_name || "Customer",
              data: customer || { name: data.client_name, id: data.customer_id },
            })}
          >
            <User className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">{customer?.name || data.client_name}</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </div>
      )}

      {data.job_id && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> Related Job
          </h4>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
            onClick={() => openPanel({
              type: "job",
              title: "Job Details",
              data: { id: data.job_id },
            })}
          >
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            <span>View Related Job</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}

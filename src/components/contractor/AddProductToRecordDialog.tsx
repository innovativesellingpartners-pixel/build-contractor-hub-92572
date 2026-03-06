import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductResult } from "./ChatProductCard";

interface AddProductToRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResult;
  quantity: number;
}

interface JobOption {
  id: string;
  name: string;
  job_number?: string;
}

interface EstimateOption {
  id: string;
  title: string;
  estimate_number?: string;
  status: string;
}

export function AddProductToRecordDialog({
  open,
  onOpenChange,
  product,
  quantity,
}: AddProductToRecordDialogProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [estimates, setEstimates] = useState<EstimateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("jobs")
        .select("id, name, job_number")
        .eq("user_id", user.id)
        .in("status", ["scheduled", "in_progress", "on_hold"])
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("estimates")
        .select("id, title, estimate_number, status")
        .eq("user_id", user.id)
        .in("status", ["draft", "sent", "pending"])
        .order("created_at", { ascending: false })
        .limit(50),
    ]).then(([jobRes, estRes]) => {
      setJobs((jobRes.data as JobOption[]) || []);
      setEstimates((estRes.data as EstimateOption[]) || []);
      setLoading(false);
    });
  }, [open, user]);

  const buildLineItem = () => {
    const desc = [product.brand, product.title, product.size_text]
      .filter(Boolean)
      .join(" — ");
    const unitPrice = product.price ?? 0;
    return {
      id: crypto.randomUUID(),
      item_description: desc,
      description: desc,
      category: "Materials",
      quantity,
      unit: product.unit_of_measure || "ea",
      unitPrice,
      unit_cost: unitPrice,
      totalPrice: quantity * unitPrice,
      line_total: quantity * unitPrice,
      included: true,
    };
  };

  const addToEstimate = async (est: EstimateOption) => {
    setAdding(est.id);
    try {
      const { data, error } = await supabase
        .from("estimates")
        .select("line_items, total_amount, subtotal, tax_rate, tax_amount")
        .eq("id", est.id)
        .single();
      if (error) throw error;

      const existing = (Array.isArray(data.line_items) ? data.line_items : []) as any[];
      const newItem = buildLineItem();
      const updated = [...existing, newItem];
      const subtotal = updated.reduce((s, i) => s + (i.totalPrice ?? i.line_total ?? 0), 0);
      const taxRate = data.tax_rate ?? 0;
      const taxAmount = subtotal * (taxRate / 100);

      const { error: updateErr } = await supabase
        .from("estimates")
        .update({
          line_items: updated as any,
          subtotal,
          tax_amount: taxAmount,
          total_amount: subtotal + taxAmount,
        })
        .eq("id", est.id);
      if (updateErr) throw updateErr;

      toast.success(`Added ${quantity}× to ${est.estimate_number || est.title}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add line item");
    } finally {
      setAdding(null);
    }
  };

  const addToJob = async (job: JobOption) => {
    setAdding(job.id);
    try {
      // Insert as a material record on the job
      const unitPrice = product.price ?? 0;
      const { error } = await supabase.from("materials").insert({
        job_id: job.id,
        user_id: user!.id,
        name: [product.brand, product.title].filter(Boolean).join(" — "),
        description: product.size_text || null,
        quantity,
        unit_cost: unitPrice,
        total_cost: quantity * unitPrice,
        category: product.category || "Materials",
        supplier: product.retailer || null,
      });
      if (error) throw error;

      toast.success(`Added ${quantity}× to ${job.job_number || job.name}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add material");
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Add to Job or Estimate</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground truncate">
          {quantity}× {product.title}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {/* Estimates */}
              {estimates.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Estimates
                  </p>
                  {estimates.map((est) => (
                    <Button
                      key={est.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      disabled={adding !== null}
                      onClick={() => addToEstimate(est)}
                    >
                      {adding === est.id ? (
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1.5 text-primary" />
                      )}
                      <span className="truncate">{est.estimate_number || est.title}</span>
                      <Badge variant="secondary" className="ml-auto text-[9px]">
                        {est.status}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {jobs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Jobs
                  </p>
                  {jobs.map((job) => (
                    <Button
                      key={job.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      disabled={adding !== null}
                      onClick={() => addToJob(job)}
                    >
                      {adding === job.id ? (
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <Briefcase className="h-3 w-3 mr-1.5 text-primary" />
                      )}
                      <span className="truncate">
                        {job.job_number ? `${job.job_number} — ${job.name}` : job.name}
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {estimates.length === 0 && jobs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No open jobs or draft estimates found.
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

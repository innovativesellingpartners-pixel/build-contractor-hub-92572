/**
 * ExpenseDetailPanel — Shows expense or payment details in drill-down.
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDrillDown } from "../DrillDownProvider";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, Tag, FileText, Briefcase, ExternalLink } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: any;
  type: "expense" | "payment";
}

export function ExpenseDetailPanel({ data, type }: Props) {
  const { openPanel } = useDrillDown();

  if (type === "payment") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Payment</h3>
        </div>

        <div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-3xl font-bold tabular-nums text-green-600">{fmt(Number(data.amount || 0))}</p>
        </div>

        <div className="space-y-2 text-sm">
          {data.payment_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date</span>
              <span className="font-medium">{new Date(data.payment_date).toLocaleDateString()}</span>
            </div>
          )}
          {data.payment_method && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <Badge variant="outline">{data.payment_method}</Badge>
            </div>
          )}
          {data.status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{data.status}</Badge>
            </div>
          )}
        </div>

        {data.job_id && (
          <>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
              onClick={() => openPanel({ type: "job", title: "Job Details", data: { id: data.job_id } })}
            >
              <Briefcase className="h-4 w-4 mr-2 text-primary" />
              <span>View Related Job</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
          </>
        )}
      </div>
    );
  }

  // Expense
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold">Expense</h3>
      </div>

      <div className="text-center p-6 bg-red-50 dark:bg-red-950/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Amount</p>
        <p className="text-3xl font-bold tabular-nums text-red-600">{fmt(Number(data.amount || 0))}</p>
      </div>

      <div className="space-y-2 text-sm">
        {data.date && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date</span>
            <span className="font-medium">{new Date(data.date).toLocaleDateString()}</span>
          </div>
        )}
        {data.category && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Category</span>
            <Badge variant="outline">{data.category}</Badge>
          </div>
        )}
        {data.description && (
          <div>
            <span className="text-muted-foreground block mb-1">Description</span>
            <p className="text-sm">{data.description}</p>
          </div>
        )}
        {data.notes && (
          <div>
            <span className="text-muted-foreground block mb-1">Notes</span>
            <p className="text-sm">{data.notes}</p>
          </div>
        )}
      </div>

      {data.job_id && (
        <>
          <Separator />
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
            onClick={() => openPanel({ type: "job", title: "Job Details", data: { id: data.job_id } })}
          >
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            <span>View Related Job</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </>
      )}

      {data.receipt_url && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={data.receipt_url} target="_blank" rel="noopener noreferrer">
            <FileText className="h-3.5 w-3.5 mr-1" /> View Receipt
          </a>
        </Button>
      )}
    </div>
  );
}

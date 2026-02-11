/**
 * QBRecordDetailPanel — Detail panel for QuickBooks-sourced records.
 * Handles invoices, expenses, payments, customers, and vendors from QB data shapes.
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText, User, Store, DollarSign, Calendar, CreditCard,
  Mail, Phone, ExternalLink, Receipt
} from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

type QBRecordType = "qb-invoice" | "qb-expense" | "qb-payment" | "qb-customer" | "qb-vendor";

interface Props {
  data: any;
  recordType: QBRecordType;
}

function QBInvoiceDetail({ data }: { data: any }) {
  const total = parseFloat(data.TotalAmt || "0");
  const balance = parseFloat(data.Balance || "0");
  const paid = total - balance;
  const isOverdue = data.DueDate && new Date(data.DueDate) < new Date() && balance > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Invoice #{data.DocNumber || "—"}</h3>
        </div>
        <Badge variant={balance === 0 ? "default" : isOverdue ? "destructive" : "secondary"}>
          {balance === 0 ? "Paid" : isOverdue ? "Overdue" : "Open"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="text-lg font-bold tabular-nums">{fmt(total)}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-bold tabular-nums text-green-600">{fmt(paid)}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={`text-lg font-bold tabular-nums ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(balance)}</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Customer</span>
          <span className="font-medium">{data.CustomerRef?.name || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date</span>
          <span className="font-medium">{fmtDate(data.TxnDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Due Date</span>
          <span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>{fmtDate(data.DueDate)}</span>
        </div>
      </div>

      {data.Line && data.Line.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Line Items</h4>
            {data.Line.filter((l: any) => l.DetailType !== "SubTotalLineDetail").map((line: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="truncate mr-2">{line.Description || line.SalesItemLineDetail?.ItemRef?.name || "Item"}</span>
                <span className="font-medium tabular-nums flex-shrink-0">{fmt(parseFloat(line.Amount || "0"))}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Badge variant="outline" className="text-[10px]">Synced Record</Badge>
    </div>
  );
}

function QBExpenseDetail({ data }: { data: any }) {
  const total = parseFloat(data.TotalAmt || "0");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-destructive" />
        <h3 className="text-lg font-semibold">Expense</h3>
      </div>

      <div className="text-center p-6 bg-red-50 dark:bg-red-950/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Amount</p>
        <p className="text-3xl font-bold tabular-nums text-destructive">{fmt(total)}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Vendor</span>
          <span className="font-medium">{data.EntityRef?.name || "Unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date</span>
          <span className="font-medium">{fmtDate(data.TxnDate)}</span>
        </div>
        {data.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account</span>
            <span className="font-medium">{data.Line[0].AccountBasedExpenseLineDetail.AccountRef.name}</span>
          </div>
        )}
        {data.PrivateNote && (
          <div>
            <span className="text-muted-foreground block mb-1">Memo</span>
            <p className="text-sm">{data.PrivateNote}</p>
          </div>
        )}
      </div>

      <Badge variant="outline" className="text-[10px]">Synced Record</Badge>
    </div>
  );
}

function QBPaymentDetail({ data }: { data: any }) {
  const total = parseFloat(data.TotalAmt || "0");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Payment Received</h3>
      </div>

      <div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-lg">
        <p className="text-sm text-muted-foreground">Amount</p>
        <p className="text-3xl font-bold tabular-nums text-green-600">{fmt(total)}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Customer</span>
          <span className="font-medium">{data.CustomerRef?.name || "Unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date</span>
          <span className="font-medium">{fmtDate(data.TxnDate)}</span>
        </div>
        {data.PaymentMethodRef?.name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Method</span>
            <Badge variant="outline">{data.PaymentMethodRef.name}</Badge>
          </div>
        )}
      </div>

      <Badge variant="outline" className="text-[10px]">Synced Record</Badge>
    </div>
  );
}

function QBCustomerDetail({ data }: { data: any }) {
  const balance = parseFloat(data.Balance || "0");

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
          {(data.DisplayName || "?")[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{data.DisplayName || "Customer"}</h3>
          {data.CompanyName && <p className="text-sm text-muted-foreground">{data.CompanyName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        {data.PrimaryEmailAddr?.Address && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${data.PrimaryEmailAddr.Address}`} className="text-primary hover:underline">{data.PrimaryEmailAddr.Address}</a>
          </div>
        )}
        {data.PrimaryPhone?.FreeFormNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.PrimaryPhone.FreeFormNumber}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={`text-base font-bold tabular-nums ${balance > 0 ? "text-red-600" : ""}`}>{fmt(balance)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant={data.Active !== false ? "default" : "secondary"} className="mt-1">
            {data.Active !== false ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {data.BillAddr && (
        <div className="text-sm">
          <p className="text-muted-foreground mb-1">Address</p>
          <p>{[data.BillAddr.Line1, data.BillAddr.City, data.BillAddr.CountrySubDivisionCode, data.BillAddr.PostalCode].filter(Boolean).join(", ")}</p>
        </div>
      )}

      <Badge variant="outline" className="text-[10px]">Synced Record</Badge>
    </div>
  );
}

function QBVendorDetail({ data }: { data: any }) {
  const balance = parseFloat(data.Balance || "0");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{data.DisplayName || "Vendor"}</h3>
      </div>

      <div className="space-y-2">
        {data.PrimaryEmailAddr?.Address && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${data.PrimaryEmailAddr.Address}`} className="text-primary hover:underline">{data.PrimaryEmailAddr.Address}</a>
          </div>
        )}
        {data.PrimaryPhone?.FreeFormNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.PrimaryPhone.FreeFormNumber}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Balance Owed</p>
          <p className={`text-base font-bold tabular-nums ${balance > 0 ? "text-red-600" : ""}`}>{fmt(balance)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant={data.Active !== false ? "default" : "secondary"} className="mt-1">
            {data.Active !== false ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <Badge variant="outline" className="text-[10px]">Synced Record</Badge>
    </div>
  );
}

export function QBRecordDetailPanel({ data, recordType }: Props) {
  switch (recordType) {
    case "qb-invoice": return <QBInvoiceDetail data={data} />;
    case "qb-expense": return <QBExpenseDetail data={data} />;
    case "qb-payment": return <QBPaymentDetail data={data} />;
    case "qb-customer": return <QBCustomerDetail data={data} />;
    case "qb-vendor": return <QBVendorDetail data={data} />;
    default: return null;
  }
}

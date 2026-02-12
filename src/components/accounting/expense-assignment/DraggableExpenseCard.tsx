import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Banknote, CreditCard, Building2, Receipt } from "lucide-react";
import type { FinancialItem } from "./ExpenseAssignmentDialog";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v);

const sourceConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  native: { label: "myCT1", color: "bg-primary/10 text-primary", icon: <Banknote className="h-3 w-3" /> },
  plaid: { label: "Bank", color: "bg-blue-500/10 text-blue-600", icon: <Building2 className="h-3 w-3" /> },
  "qb-expense": { label: "QB Expense", color: "bg-orange-500/10 text-orange-600", icon: <Receipt className="h-3 w-3" /> },
  "qb-payment": { label: "QB Payment", color: "bg-green-500/10 text-green-600", icon: <CreditCard className="h-3 w-3" /> },
};

interface Props {
  item: FinancialItem;
  isOverlay?: boolean;
}

export function DraggableExpenseCard({ item, isOverlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const config = sourceConfig[item.source] || sourceConfig.native;

  return (
    <div
      ref={!isOverlay ? setNodeRef : undefined}
      style={!isOverlay ? style : undefined}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-40 scale-95",
        isOverlay && "shadow-xl ring-2 ring-primary/30 rotate-2 scale-105",
        !isDragging && !isOverlay && "hover:bg-muted/50"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-sm truncate">{item.description}</p>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", config.color)}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
          {item.category && <span>· {item.category}</span>}
          {item.job_id && <Badge variant="secondary" className="text-[10px] px-1 py-0">Assigned</Badge>}
        </div>
      </div>
      <p className={cn(
        "font-semibold text-sm tabular-nums shrink-0",
        item.source === "qb-payment" ? "text-green-600" : "text-destructive"
      )}>
        {fmt(item.amount)}
      </p>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DraggableExpenseCard } from "./DraggableExpenseCard";
import type { FinancialItem } from "./ExpenseAssignmentDialog";
import { Search, Package } from "lucide-react";

interface Props {
  items: FinancialItem[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (v: string) => void;
  hasQB: boolean;
}

export function DraggableExpenseList({
  items,
  searchTerm,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  hasQB,
}: Props) {
  const unassigned = items.filter((i) => !i.job_id);
  const assigned = items.filter((i) => !!i.job_id);

  return (
    <>
      <div className="p-4 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Financial Items</h3>
          <Badge variant="outline" className="text-xs">
            {unassigned.length} unassigned · {assigned.length} assigned
          </Badge>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-[60]">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="native">myCT1</SelectItem>
              <SelectItem value="plaid">Bank</SelectItem>
              {hasQB && <SelectItem value="qb-expense">QB Expenses</SelectItem>}
              {hasQB && <SelectItem value="qb-payment">QB Payments</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">No items found</p>
              <p className="text-xs">Try adjusting your search or filter</p>
            </div>
          ) : (
            items.map((item) => (
              <DraggableExpenseCard key={item.id} item={item} />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

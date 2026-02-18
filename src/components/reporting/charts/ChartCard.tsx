/**
 * ChartCard — Unified wrapper for every chart/visualization in reporting.
 * Provides consistent title, subtitle, loading skeleton, empty state, error state with retry.
 */

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCcw, AlertTriangle } from "lucide-react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  source?: string;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
  skeletonHeight?: number;
  icon?: ReactNode;
  headerActions?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  source,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available for the selected period.",
  error = null,
  onRetry,
  className = "",
  skeletonHeight = 260,
  icon,
  headerActions,
}: ChartCardProps) {
  if (isLoading) {
    return (
      <Card className={`border-border/60 ${className}`}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          {subtitle && <Skeleton className="h-3 w-56 mt-1" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full rounded-lg" style={{ height: skeletonHeight }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const msg = typeof error === "string" ? error : error.message;
    return (
      <Card className={`border-destructive/30 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3 max-w-md">{msg || "Something went wrong loading this chart."}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className={`border-dashed border-border/50 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/60 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {headerActions}
        </div>
      </CardHeader>
      <CardContent className="min-h-[120px] overflow-hidden">
        {children}
        {source && (
          <p className="text-[10px] text-muted-foreground mt-2 text-right">Source: {source}</p>
        )}
      </CardContent>
    </Card>
  );
}

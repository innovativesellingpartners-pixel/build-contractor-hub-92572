/**
 * DrillDownProvider — Context for managing drill-down navigation state.
 * Tracks breadcrumb trail, active detail panel, and drill-down history.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type DrillDownLevel = {
  id: string;
  label: string;
  type: "dashboard" | "report" | "category" | "subcategory" | "transaction" | "detail" | "customer" | "job" | "vendor" | "worker";
  data?: any;
};

export type DetailPanelConfig = {
  type: "invoice" | "customer" | "job" | "expense" | "payment" | "vendor" | "worker" | "category-breakdown" | "ar-aging" | "estimate" | "qb-record" | null;
  data: any;
  title?: string;
};

interface DrillDownContextType {
  breadcrumbs: DrillDownLevel[];
  activePanel: DetailPanelConfig;
  pushLevel: (level: DrillDownLevel) => void;
  popToLevel: (index: number) => void;
  resetBreadcrumbs: () => void;
  openPanel: (config: DetailPanelConfig) => void;
  closePanel: () => void;
  navigateToReport: (reportId: string) => void;
  activeReportOverride: string | null;
}

const DrillDownContext = createContext<DrillDownContextType | null>(null);

export function DrillDownProvider({ children, onNavigateToReport }: { children: ReactNode; onNavigateToReport?: (reportId: string) => void }) {
  const [breadcrumbs, setBreadcrumbs] = useState<DrillDownLevel[]>([
    { id: "reports", label: "Reports", type: "dashboard" },
  ]);
  const [activePanel, setActivePanel] = useState<DetailPanelConfig>({ type: null, data: null });
  const [activeReportOverride, setActiveReportOverride] = useState<string | null>(null);

  const pushLevel = useCallback((level: DrillDownLevel) => {
    setBreadcrumbs(prev => [...prev, level]);
  }, []);

  const popToLevel = useCallback((index: number) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setActivePanel({ type: null, data: null });
  }, []);

  const resetBreadcrumbs = useCallback(() => {
    setBreadcrumbs([{ id: "reports", label: "Reports", type: "dashboard" }]);
    setActivePanel({ type: null, data: null });
    setActiveReportOverride(null);
  }, []);

  const openPanel = useCallback((config: DetailPanelConfig) => {
    setActivePanel(config);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel({ type: null, data: null });
  }, []);

  const navigateToReport = useCallback((reportId: string) => {
    setActiveReportOverride(null);
    onNavigateToReport?.(reportId);
  }, [onNavigateToReport]);

  return (
    <DrillDownContext.Provider value={{
      breadcrumbs,
      activePanel,
      pushLevel,
      popToLevel,
      resetBreadcrumbs,
      openPanel,
      closePanel,
      navigateToReport,
      activeReportOverride,
    }}>
      {children}
    </DrillDownContext.Provider>
  );
}

export function useDrillDown() {
  const ctx = useContext(DrillDownContext);
  if (!ctx) throw new Error("useDrillDown must be used within DrillDownProvider");
  return ctx;
}

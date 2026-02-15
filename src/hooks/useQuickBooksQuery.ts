import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Generic hook to query the QuickBooks API via the quickbooks-api edge function proxy.
 * Pass an endpoint string like "query?query=SELECT * FROM Invoice" or "reports/ProfitAndLoss?..."
 */
export function useQuickBooksQuery<T = any>(
  key: string,
  endpoint: string,
  options?: { enabled?: boolean; transform?: (data: any) => T }
) {
  const { user } = useAuth();
  const enabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery<T>({
    queryKey: ["qb", key, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("quickbooks-api", {
        body: { endpoint },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return options?.transform ? options.transform(data) : data;
    },
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}

// --- Specific QB entity hooks ---

export function useQBProfitAndLoss(dateRange: { start: string; end: string }, enabled = true) {
  const endpoint = `reports/ProfitAndLoss?start_date=${dateRange.start}&end_date=${dateRange.end}&minorversion=73`;
  return useQuickBooksQuery("pnl", endpoint, {
    enabled,
    transform: (data: any) => {
      const report = data;
      const rows = report?.Rows?.Row || [];
      const header = report?.Header || {};
      return { header, rows, raw: report };
    },
  });
}

export function useQBBalanceSheet(asOfDate: string, enabled = true) {
  const endpoint = `reports/BalanceSheet?start_date=${asOfDate}&end_date=${asOfDate}&minorversion=73`;
  return useQuickBooksQuery("balance-sheet", endpoint, {
    enabled,
    transform: (data: any) => {
      const report = data;
      const rows = report?.Rows?.Row || [];
      const header = report?.Header || {};
      return { header, rows, raw: report };
    },
  });
}

export function useQBCustomers(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Customer MAXRESULTS 200")}&minorversion=73`;
  return useQuickBooksQuery("customers", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Customer || [],
  });
}

export function useQBVendors(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Vendor MAXRESULTS 200")}&minorversion=73`;
  return useQuickBooksQuery("vendors", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Vendor || [],
  });
}

export function useQBPayments(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Payment ORDERBY TxnDate DESC MAXRESULTS 100")}&minorversion=73`;
  return useQuickBooksQuery("payments", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Payment || [],
  });
}

export function useQBExpenses(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Purchase ORDERBY TxnDate DESC MAXRESULTS 100")}&minorversion=73`;
  return useQuickBooksQuery("expenses", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Purchase || [],
  });
}

export function useQBBills(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Bill ORDERBY DueDate DESC MAXRESULTS 100")}&minorversion=73`;
  return useQuickBooksQuery("bills", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Bill || [],
  });
}

export function useQBAccounts(enabled = true) {
  const endpoint = `query?query=${encodeURIComponent("SELECT * FROM Account MAXRESULTS 200")}&minorversion=73`;
  return useQuickBooksQuery("accounts", endpoint, {
    enabled,
    transform: (data: any) => data?.QueryResponse?.Account || [],
  });
}

export function useQBAgingReport(type: "AgedReceivableDetail" | "AgedPayableDetail", enabled = true) {
  const endpoint = `reports/${type}?minorversion=73`;
  return useQuickBooksQuery(`aging-${type}`, endpoint, {
    enabled,
    transform: (data: any) => {
      const rows = data?.Rows?.Row || [];
      const header = data?.Header || {};
      return { header, rows, raw: data };
    },
  });
}

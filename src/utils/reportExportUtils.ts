/**
 * reportExportUtils — Helpers for exporting report data (including QB data) to CSV.
 */

export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export unified job data (native + QB) to CSV.
 */
export function exportJobsWithQBData(
  jobs: Array<{
    name: string;
    job_number?: string;
    budget?: number;
    cost?: number;
    profit?: number;
    margin?: number;
    status?: string;
    qbExpenses?: number;
    qbPayments?: number;
  }>
) {
  const headers = [
    'Job Number', 'Job Name', 'Status', 'Budget', 'Native Costs',
    'QB Expenses', 'QB Payments', 'Total Cost', 'Profit', 'Margin %',
  ];
  const rows = jobs.map(j => [
    j.job_number || '',
    j.name || '',
    j.status || '',
    String(j.budget || 0),
    String((j.cost || 0) - (j.qbExpenses || 0)),
    String(j.qbExpenses || 0),
    String(j.qbPayments || 0),
    String(j.cost || 0),
    String(j.profit || 0),
    `${(j.margin || 0).toFixed(1)}%`,
  ]);
  downloadCSV('jobs-financial-report', headers, rows);
}

/**
 * Export QB transactions to CSV.
 */
export function exportQBTransactions(
  transactions: Array<{
    date: string;
    type: string;
    reference: string;
    memo: string;
    amount: number;
    matchedJob?: string;
  }>
) {
  const headers = ['Date', 'Type', 'Reference', 'Memo', 'Amount', 'Matched Job'];
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.reference,
    t.memo,
    String(t.amount),
    t.matchedJob || 'Unmatched',
  ]);
  downloadCSV('qb-transactions', headers, rows);
}

/**
 * Export budget vs actual data to CSV.
 */
export function exportBudgetReport(
  lines: Array<{
    description: string;
    category: string;
    budgeted_amount: number;
    actual_amount: number;
    variance_amount: number;
    variance_percent: number;
  }>
) {
  const headers = ['Description', 'Category', 'Budgeted', 'Actual', 'Variance ($)', 'Variance (%)'];
  const rows = lines.map(l => [
    l.description,
    l.category,
    String(l.budgeted_amount),
    String(l.actual_amount),
    String(l.variance_amount),
    `${l.variance_percent.toFixed(1)}%`,
  ]);
  downloadCSV('budget-vs-actual', headers, rows);
}

/**
 * Export P&L report rows to CSV.
 */
export function exportPnLReport(rows: any[], header?: any) {
  const headers = ['Account', 'Amount'];
  const csvRows: string[][] = [];

  function flattenRows(items: any[], prefix = '') {
    (items || []).forEach((row: any) => {
      if (row.Summary?.ColData) {
        const label = row.Summary.ColData[0]?.value || '';
        const value = row.Summary.ColData[1]?.value || '0';
        csvRows.push([prefix + label, value]);
      }
      if (row.Rows?.Row) {
        const groupName = row.Header?.ColData?.[0]?.value || '';
        if (groupName) csvRows.push([prefix + groupName, '']);
        flattenRows(row.Rows.Row, prefix + '  ');
      }
      if (row.ColData && !row.Summary) {
        csvRows.push([prefix + (row.ColData[0]?.value || ''), row.ColData[1]?.value || '0']);
      }
    });
  }

  flattenRows(rows);
  const title = header?.ReportName || 'Financial Report';
  downloadCSV(title.toLowerCase().replace(/\s+/g, '-'), headers, csvRows);
}

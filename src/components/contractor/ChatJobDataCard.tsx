import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Briefcase, Plus, ChevronDown, ChevronUp } from "lucide-react";


export interface ExtractedJobData {
  line_items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: string;
  }>;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  project_name?: string;
  project_description?: string;
  project_address?: string;
  notes?: string;
}

interface ChatJobDataCardProps {
  data: ExtractedJobData;
  onActionComplete?: (msg: string) => void;
}

export function ChatJobDataCard({ data, onActionComplete }: ChatJobDataCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [showAddTo, setShowAddTo] = useState(false);
  const [addToType, setAddToType] = useState<'estimate' | 'job' | null>(null);
  const [recentItems, setRecentItems] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [expanded, setExpanded] = useState(true);

  const grandTotal = data.line_items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const formatLineItems = (items: ExtractedJobData['line_items']) =>
    items.map((item, i) => ({
      id: crypto.randomUUID(),
      item_code: `ITEM-${String(i + 1).padStart(3, '0')}`,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      category: item.category,
    }));

  const handleCreateEstimate = async () => {
    if (!user?.id) return;
    setLoading('estimate');
    try {
      const lineItems = formatLineItems(data.line_items);
      const { data: est, error } = await supabase
        .from('estimates')
        .insert({
          user_id: user.id,
          title: data.project_name || 'New Estimate from Chat',
          description: data.project_description || '',
          client_name: data.customer_name || null,
          client_email: data.customer_email || null,
          client_phone: data.customer_phone || null,
          client_address: data.customer_address || null,
          project_name: data.project_name || null,
          project_address: data.project_address || null,
          line_items: lineItems as any,
          subtotal: grandTotal,
          total_amount: grandTotal,
          status: 'draft',
        })
        .select('id, estimate_number')
        .single();

      if (error) throw error;
      toast({ title: "Estimate Created", description: `${est.estimate_number} created successfully` });
      onActionComplete?.(`✅ Estimate **${est.estimate_number}** created from chat data. You can find it in your Estimates list.`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleCreateJob = async () => {
    if (!user?.id) return;
    setLoading('job');
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          name: data.project_name || 'New Job from Chat',
          description: data.project_description || '',
          address: data.project_address || data.customer_address || '',
          contract_value: grandTotal,
          job_status: 'scheduled' as const,
        } as any)
        .select('id, job_number')
        .single();

      if (error) throw error;

      // Also create a linked estimate with line items
      const lineItems = formatLineItems(data.line_items);
      await supabase.from('estimates').insert({
        user_id: user.id,
        job_id: job.id,
        title: data.project_name || 'Job Estimate',
        client_name: data.customer_name || null,
        client_email: data.customer_email || null,
        line_items: lineItems as any,
        subtotal: grandTotal,
        total_amount: grandTotal,
        status: 'draft',
      });

      toast({ title: "Job Created", description: `${job.job_number} created with linked estimate` });
      onActionComplete?.(`✅ Job **${job.job_number}** created with estimate from chat data. You can find it in your Jobs list.`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleShowAddTo = async (type: 'estimate' | 'job') => {
    setAddToType(type);
    setShowAddTo(true);
    setLoading('fetch');
    try {
      if (type === 'estimate') {
        const { data: items } = await supabase
          .from('estimates')
          .select('id, estimate_number, title')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setRecentItems((items || []).map(i => ({ id: i.id, label: `${i.estimate_number} — ${i.title}` })));
      } else {
        const { data: items } = await supabase
          .from('jobs')
          .select('id, job_number, name')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setRecentItems((items || []).map(i => ({ id: i.id, label: `${i.job_number} — ${i.name}` })));
      }
    } catch { /* ignore */ } finally {
      setLoading(null);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedId || !addToType) return;
    setLoading('add');
    try {
      const newItems = formatLineItems(data.line_items);

      if (addToType === 'estimate') {
        const { data: existing } = await supabase
          .from('estimates')
          .select('line_items, subtotal, total_amount')
          .eq('id', selectedId)
          .single();

        const existingItems = Array.isArray(existing?.line_items) ? existing.line_items : [];
        const merged = [...existingItems, ...newItems];
        const newSubtotal = (existing?.subtotal || 0) + grandTotal;

        await supabase
          .from('estimates')
          .update({
            line_items: merged as any,
            subtotal: newSubtotal,
            total_amount: newSubtotal,
          })
          .eq('id', selectedId);

        toast({ title: "Line Items Added", description: `${data.line_items.length} items added to estimate` });
        onActionComplete?.(`✅ Added ${data.line_items.length} line items to existing estimate.`);
      } else {
        // For jobs, find linked estimate or create one
        const { data: linkedEst } = await supabase
          .from('estimates')
          .select('id, line_items, subtotal, total_amount')
          .eq('job_id', selectedId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (linkedEst) {
          const existingItems = Array.isArray(linkedEst.line_items) ? linkedEst.line_items : [];
          const merged = [...existingItems, ...newItems];
          const newSubtotal = (linkedEst.subtotal || 0) + grandTotal;
          await supabase
            .from('estimates')
            .update({ line_items: merged as any, subtotal: newSubtotal, total_amount: newSubtotal })
            .eq('id', linkedEst.id);
        } else {
          await supabase.from('estimates').insert({
            user_id: user!.id,
            job_id: selectedId,
            title: 'Estimate from Chat',
            line_items: newItems as any,
            subtotal: grandTotal,
            total_amount: grandTotal,
            status: 'draft',
          });
        }

        toast({ title: "Line Items Added", description: `${data.line_items.length} items added to job` });
        onActionComplete?.(`✅ Added ${data.line_items.length} line items to existing job.`);
      }
      setShowAddTo(false);
      setSelectedId("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card p-2 space-y-2 text-xs overflow-hidden w-full box-border">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-sm text-foreground">📋 Extracted Job Data</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          {/* Customer / Project info */}
          {(data.customer_name || data.project_name) && (
            <div className="grid grid-cols-2 gap-1 text-muted-foreground">
              {data.customer_name && <span>👤 {data.customer_name}</span>}
              {data.customer_phone && <span>📱 {data.customer_phone}</span>}
              {data.customer_email && <span className="col-span-2">✉️ {data.customer_email}</span>}
              {data.project_name && <span className="col-span-2">🏗️ {data.project_name}</span>}
              {(data.project_address || data.customer_address) && (
                <span className="col-span-2">📍 {data.project_address || data.customer_address}</span>
              )}
            </div>
          )}

          {/* Line Items */}
          <div className="border rounded border-border overflow-x-auto">
            <table className="w-full text-[11px] table-fixed">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-1 font-medium truncate">Item</th>
                  <th className="text-right p-1 font-medium w-10">Qty</th>
                  <th className="text-right p-1 font-medium w-14">Price</th>
                  <th className="text-right p-1 font-medium w-14">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.line_items.map((item, idx) => (
                  <tr key={idx} className="border-t border-border/50">
                    <td className="p-1 truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="text-right p-1 whitespace-nowrap">{item.quantity}</td>
                    <td className="text-right p-1 whitespace-nowrap">${item.unit_price.toFixed(0)}</td>
                    <td className="text-right p-1 font-medium whitespace-nowrap">${(item.quantity * item.unit_price).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30">
                <tr className="border-t border-border">
                  <td colSpan={3} className="p-1 text-right font-semibold">Total:</td>
                  <td className="p-1 text-right font-bold text-primary whitespace-nowrap">${grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {data.notes && (
            <p className="text-muted-foreground italic">📝 {data.notes}</p>
          )}

          {/* Action Buttons */}
          {!showAddTo ? (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  className="h-7 text-[10px] px-1.5 min-w-0 gap-1"
                  onClick={handleCreateEstimate}
                  disabled={!!loading}
                >
                  {loading === 'estimate' ? <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" /> : <FileText className="h-3 w-3 flex-shrink-0" />}
                  <span className="truncate">Estimate</span>
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[10px] px-1.5 min-w-0 gap-1"
                  onClick={handleCreateJob}
                  disabled={!!loading}
                >
                  {loading === 'job' ? <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" /> : <Briefcase className="h-3 w-3 flex-shrink-0" />}
                  <span className="truncate">Job</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-1.5 min-w-0 gap-1"
                  onClick={() => handleShowAddTo('estimate')}
                  disabled={!!loading}
                >
                  <Plus className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">+ Estimate</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-1.5 min-w-0 gap-1"
                  onClick={() => handleShowAddTo('job')}
                  disabled={!!loading}
                >
                  <Plus className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">+ Job</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground font-medium">
                Select {addToType === 'estimate' ? 'an estimate' : 'a job'}:
              </p>
              {loading === 'fetch' ? (
                <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                <>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={`Choose ${addToType}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {recentItems.map(item => (
                        <SelectItem key={item.id} value={item.id} className="text-xs">
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={handleAddToExisting}
                      disabled={!selectedId || loading === 'add'}
                    >
                      {loading === 'add' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Add Items
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => { setShowAddTo(false); setSelectedId(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

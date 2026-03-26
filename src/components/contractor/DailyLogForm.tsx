import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Camera, Save, Lock, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DailyLogInput, MaterialItem } from '@/hooks/useDailyLogs';

interface DailyLogFormProps {
  jobId: string;
  jobName: string;
  crewMembers?: string[];
  onSave: (log: DailyLogInput) => Promise<any>;
  onCancel: () => void;
}

export function DailyLogForm({ jobId, jobName, crewMembers = [], onSave, onCancel }: DailyLogFormProps) {
  const { profile } = useAuth();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather: '',
    work_completed: '',
    hours_worked: '',
    issues_delays: '',
    client_visible: false,
    signed_by: profile?.contact_name || '',
  });

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const addMaterial = useCallback(() => setMaterials(m => [...m, { item: '', quantity: 0, unit: 'ea' }]), []);
  const removeMaterial = useCallback((idx: number) => setMaterials(m => m.filter((_, i) => i !== idx)), []);
  const updateMaterial = useCallback((idx: number, field: keyof MaterialItem, value: string | number) => {
    setMaterials(m => m.map((mat, i) => i === idx ? { ...mat, [field]: value } : mat));
  }, []);

  const toggleCrew = useCallback((name: string) => {
    setSelectedCrew(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `daily-logs/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('job-photos').upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path);
        newPhotos.push(urlData.publicUrl);
      }
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (err: any) {
      console.error('Photo upload error:', err);
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const removePhoto = useCallback((idx: number) => setPhotos(p => p.filter((_, i) => i !== idx)), []);

  const getSignatureDataUrl = (): string | undefined => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      return sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    }
    return undefined;
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!form.work_completed.trim()) return;
    setSaving(true);
    try {
      const logData: DailyLogInput = {
        log_date: form.log_date,
        weather: form.weather || undefined,
        work_completed: form.work_completed,
        hours_worked: form.hours_worked ? parseFloat(form.hours_worked) : undefined,
        materials_used: materials.length > 0 ? JSON.stringify(materials) : undefined,
        crew_on_site: selectedCrew.length > 0 ? selectedCrew : undefined,
        issues_delays: form.issues_delays || undefined,
        photos: photos.length > 0 ? photos : undefined,
        client_visible: form.client_visible,
        signed_by: form.signed_by || undefined,
        signature_url: getSignatureDataUrl(),
        status,
      };
      await onSave(logData);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Job: {jobName}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>

        {/* Date & Weather */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Weather</Label>
            <Input placeholder="Sunny, 72°F" value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))} className="h-9" />
          </div>
        </div>

        {/* Work Performed */}
        <div>
          <Label className="text-xs">Work Performed *</Label>
          <Textarea
            placeholder="Describe work completed today..."
            rows={4}
            value={form.work_completed}
            onChange={e => setForm(f => ({ ...f, work_completed: e.target.value }))}
          />
        </div>

        {/* Hours */}
        <div className="w-1/2">
          <Label className="text-xs">Hours Worked</Label>
          <Input type="number" step="0.5" placeholder="0" value={form.hours_worked} onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))} className="h-9" />
        </div>

        {/* Materials */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Materials Used</Label>
            <Button size="sm" variant="outline" onClick={addMaterial} className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Add</Button>
          </div>
          {materials.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_60px_28px] gap-1.5 mb-1.5">
              <Input placeholder="Item" value={m.item} onChange={e => updateMaterial(i, 'item', e.target.value)} className="h-8 text-sm" />
              <Input type="number" placeholder="Qty" value={m.quantity || ''} onChange={e => updateMaterial(i, 'quantity', parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
              <Input placeholder="Unit" value={m.unit} onChange={e => updateMaterial(i, 'unit', e.target.value)} className="h-8 text-sm" />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeMaterial(i)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>

        {/* Crew On Site */}
        {crewMembers.length > 0 && (
          <div>
            <Label className="text-xs mb-1.5 block">Crew On Site</Label>
            <div className="flex flex-wrap gap-2">
              {crewMembers.map(name => (
                <label key={name} className="flex items-center gap-1.5 text-sm cursor-pointer bg-muted/30 rounded px-2 py-1">
                  <Checkbox checked={selectedCrew.includes(name)} onCheckedChange={() => toggleCrew(name)} />
                  {name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        <div>
          <Label className="text-xs mb-1.5 block">Photos</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5"><X className="h-3 w-3 text-white" /></button>
              </div>
            ))}
            <button
              onClick={() => photoInputRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors"
              disabled={uploading}
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoUpload} />
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </div>

        {/* Issues / Delays */}
        <div>
          <Label className="text-xs">Issues / Delays</Label>
          <Textarea placeholder="Any issues or delays encountered..." rows={2} value={form.issues_delays} onChange={e => setForm(f => ({ ...f, issues_delays: e.target.value }))} />
        </div>

        {/* Client Visible Toggle */}
        <div className="flex items-center gap-2">
          <Switch checked={form.client_visible} onCheckedChange={v => setForm(f => ({ ...f, client_visible: v }))} />
          <Label className="text-sm">Visible to client</Label>
        </div>

        {/* Signature */}
        <div>
          <Label className="text-xs mb-1.5 block">Digital Signature</Label>
          <div className="border border-border rounded-md overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{ className: 'w-full', style: { width: '100%', height: 120 } }}
              penColor="#1e293b"
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <Input placeholder="Signed by" value={form.signed_by} onChange={e => setForm(f => ({ ...f, signed_by: e.target.value }))} className="h-7 text-xs w-48" />
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => sigCanvas.current?.clear()}>Clear</Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => handleSave('draft')} disabled={saving || !form.work_completed.trim()}>
            <Save className="h-4 w-4 mr-1" />Save Draft
          </Button>
          <Button className="flex-1" onClick={() => handleSave('submitted')} disabled={saving || !form.work_completed.trim()}>
            <Lock className="h-4 w-4 mr-1" />Submit & Lock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

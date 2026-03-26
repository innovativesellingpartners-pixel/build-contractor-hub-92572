import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Clock, Cloud, Camera, FileSignature, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { DailyLog, MaterialItem } from '@/hooks/useDailyLogs';
import { format } from 'date-fns';

interface DailyLogListProps {
  logs: DailyLog[];
  onDelete?: (id: string) => void;
}

export function DailyLogList({ logs, onDelete }: DailyLogListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (dateFrom && log.log_date < dateFrom) return false;
      if (dateTo && log.log_date > dateTo) return false;
      return true;
    });
  }, [logs, dateFrom, dateTo]);

  const parseMaterials = (raw?: string): MaterialItem[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-medium">No daily logs yet</p>
        <p className="text-sm mt-1">Add your first daily log to start tracking progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Date Filters */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" />
        </div>
        {(dateFrom || dateTo) && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}</p>

      {filteredLogs.map(log => {
        const isExpanded = expandedId === log.id;
        const materials = parseMaterials(log.materials_used);
        const photos = log.photos ?? [];
        const crewOnSite = log.crew_on_site ?? [];
        const isLocked = log.status === 'submitted';

        return (
          <Card key={log.id} className={`transition-colors ${isLocked ? 'border-primary/20' : 'border-border'}`}>
            {/* Summary row */}
            <button
              className="w-full text-left p-3 flex items-center gap-3"
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {format(new Date(log.log_date), 'EEEE, MMM d')}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {log.work_completed?.slice(0, 80)}{(log.work_completed?.length ?? 0) > 80 ? '…' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {log.hours_worked && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Clock className="h-3 w-3" />{log.hours_worked}h</span>
                )}
                {photos.length > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Camera className="h-3 w-3" />{photos.length}</span>
                )}
                {log.signature_url && <FileSignature className="h-3.5 w-3.5 text-emerald-500" />}
                {log.client_visible ? <Eye className="h-3.5 w-3.5 text-blue-400" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />}
                <Badge variant="outline" className={`text-[10px] px-1.5 ${isLocked ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}>
                  {isLocked ? 'Locked' : 'Draft'}
                </Badge>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <CardContent className="pt-0 pb-4 px-3 space-y-3 border-t">
                {/* Weather & Hours */}
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  {log.weather && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Cloud className="h-3.5 w-3.5" />{log.weather}
                    </div>
                  )}
                  {log.hours_worked && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />{log.hours_worked} hours
                    </div>
                  )}
                </div>

                {/* Work Performed */}
                {log.work_completed && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">Work Performed</p>
                    <p className="text-sm whitespace-pre-wrap">{log.work_completed}</p>
                  </div>
                )}

                {/* Materials */}
                {materials.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Materials</p>
                    <div className="space-y-0.5">
                      {materials.map((m, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{m.item} — {m.quantity} {m.unit}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crew */}
                {crewOnSite.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Crew On Site</p>
                    <div className="flex flex-wrap gap-1">
                      {crewOnSite.map((name, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues */}
                {log.issues_delays && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />Issues / Delays
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{log.issues_delays}</p>
                  </div>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Photos</p>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-md overflow-hidden border hover:border-primary/50 transition-colors">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature */}
                {log.signature_url && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Signature{log.signed_by ? ` — ${log.signed_by}` : ''}</p>
                    <img src={log.signature_url} alt="Signature" className="h-12 bg-white rounded border p-1" />
                  </div>
                )}

                {/* Actions */}
                {!isLocked && onDelete && (
                  <div className="flex justify-end pt-1">
                    <Button size="sm" variant="ghost" className="text-destructive h-7 text-xs" onClick={() => onDelete(log.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

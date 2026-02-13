import { useMemo } from 'react';
import { Task } from '@/hooks/useTasks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, startOfWeek, addDays, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobScheduleViewProps {
  tasks: Task[];
  crewMembers?: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground border-muted',
  in_progress: 'bg-blue-500/20 text-blue-700 border-blue-400',
  completed: 'bg-green-500/20 text-green-700 border-green-400',
  blocked: 'bg-red-500/20 text-red-700 border-red-400',
};

const statusBarColors: Record<string, string> = {
  not_started: 'bg-muted-foreground/30',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  blocked: 'bg-red-500',
};

export default function JobScheduleView({ tasks, crewMembers }: JobScheduleViewProps) {
  const scheduledTasks = useMemo(
    () => tasks.filter(t => t.scheduled_start && t.scheduled_end),
    [tasks]
  );

  const { weekStart, weeks, totalDays } = useMemo(() => {
    if (scheduledTasks.length === 0) return { weekStart: new Date(), weeks: [], totalDays: 0 };

    const dates = scheduledTasks.flatMap(t => [
      parseISO(t.scheduled_start!),
      parseISO(t.scheduled_end!),
    ]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const ws = startOfWeek(minDate, { weekStartsOn: 1 });
    const total = differenceInDays(maxDate, ws) + 7; // add buffer
    const numWeeks = Math.ceil(total / 7);

    const weeksList = Array.from({ length: numWeeks }, (_, i) => addDays(ws, i * 7));
    return { weekStart: ws, weeks: weeksList, totalDays: total };
  }, [scheduledTasks]);

  const getCrewName = (id?: string) => {
    if (!id || !crewMembers) return null;
    return crewMembers.find(m => m.id === id)?.name || null;
  };

  if (scheduledTasks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-sm text-muted-foreground">
          <p className="font-medium mb-1">No scheduled tasks</p>
          <p className="text-xs">Add start and end dates to your tasks to see them on the timeline.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 overflow-hidden">
      <h3 className="text-sm font-semibold mb-3">Schedule Timeline</h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <div style={{ minWidth: `${Math.max(totalDays * 32, 400)}px` }}>
          {/* Week headers */}
          <div className="flex border-b border-border mb-2">
            <div className="w-36 shrink-0" />
            {weeks.map((week, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground font-medium px-1"
                style={{ width: `${(7 / totalDays) * 100}%`, minWidth: '80px' }}
              >
                {format(week, 'MMM d')}
              </div>
            ))}
          </div>

          {/* Task bars */}
          <div className="space-y-1.5">
            {scheduledTasks.map(task => {
              const start = parseISO(task.scheduled_start!);
              const end = parseISO(task.scheduled_end!);
              const leftPct = (differenceInDays(start, weekStart) / totalDays) * 100;
              const widthPct = Math.max((differenceInDays(end, start) + 1) / totalDays * 100, 3);
              const crewName = getCrewName(task.assigned_crew_member_id);

              return (
                <div key={task.id} className="flex items-center h-8">
                  <div className="w-36 shrink-0 pr-2">
                    <p className="text-xs font-medium truncate">{task.description}</p>
                  </div>
                  <div className="flex-1 relative h-full">
                    <div
                      className={cn(
                        'absolute top-0.5 h-7 rounded-md border flex items-center px-2 gap-1',
                        statusColors[task.status]
                      )}
                      style={{ left: `${Math.max(leftPct, 0)}%`, width: `${widthPct}%`, minWidth: '40px' }}
                      title={`${task.description}: ${format(start, 'MMM d')} – ${format(end, 'MMM d')}`}
                    >
                      <div className={cn('w-2 h-2 rounded-full shrink-0', statusBarColors[task.status])} />
                      {crewName && <span className="text-[10px] truncate">{crewName}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
        {Object.entries(statusBarColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', color)} />
            <span className="text-[10px] text-muted-foreground capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

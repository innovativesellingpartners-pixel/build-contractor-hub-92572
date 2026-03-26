import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { useJobCostAlerts, JobCostAlert } from '@/hooks/useJobCostAlerts';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationBellProps {
  onAlertClick?: (jobId: string) => void;
}

export function NotificationBell({ onAlertClick }: NotificationBellProps) {
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useJobCostAlerts();
  const [open, setOpen] = useState(false);

  const handleAlertClick = (alert: JobCostAlert) => {
    if (!alert.is_read) markAsRead(alert.id);
    onAlertClick?.(alert.job_id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="text-xs hidden sm:inline">Alerts</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Job Cost Alerts</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllAsRead()}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No alerts yet
            </div>
          ) : (
            <div className="divide-y">
              {alerts.slice(0, 20).map((alert) => (
                <button
                  key={alert.id}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${!alert.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex gap-2">
                    {!alert.is_read && <div className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1.5" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!alert.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

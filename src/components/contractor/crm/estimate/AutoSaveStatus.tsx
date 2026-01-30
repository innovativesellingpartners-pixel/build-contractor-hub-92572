import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { AutoSaveStatus as AutoSaveStatusType } from '@/hooks/useEstimateAutoSave';
import { cn } from '@/lib/utils';

interface AutoSaveStatusProps {
  status: AutoSaveStatusType;
  lastSavedAt: Date | null;
}

export function AutoSaveStatus({ status, lastSavedAt }: AutoSaveStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          text: 'Saving...',
          className: 'text-muted-foreground',
        };
      case 'saved':
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          text: lastSavedAt ? `Saved ${formatTime(lastSavedAt)}` : 'Saved',
          className: 'text-green-600 dark:text-green-500',
        };
      case 'offline':
        return {
          icon: <CloudOff className="h-3.5 w-3.5" />,
          text: 'Offline. Saved on this device',
          className: 'text-amber-600 dark:text-amber-500',
        };
      case 'error':
        return {
          icon: <CloudOff className="h-3.5 w-3.5" />,
          text: 'Save failed',
          className: 'text-destructive',
        };
      default:
        return {
          icon: <Cloud className="h-3.5 w-3.5" />,
          text: 'Auto-save enabled',
          className: 'text-muted-foreground',
        };
    }
  };

  const { icon, text, className } = getStatusDisplay();

  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', className)}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 10) {
    return 'just now';
  } else if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, Send, Eye, XCircle, AlertTriangle, Ban, FileText } from 'lucide-react';

export type EstimateStatus = 
  | 'draft' 
  | 'pending' 
  | 'sent' 
  | 'viewed' 
  | 'signed' 
  | 'accepted' 
  | 'rejected' 
  | 'declined' 
  | 'expired' 
  | 'voided' 
  | 'sold' 
  | 'lost' 
  | 'cancelled';

interface EstimateStatusBadgeProps {
  status: EstimateStatus | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    icon: FileText,
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    icon: Clock,
  },
  sent: {
    label: 'Sent',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: Send,
  },
  viewed: {
    label: 'Viewed',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: Eye,
  },
  signed: {
    label: 'Signed',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-400',
    icon: CheckCircle,
  },
  accepted: {
    label: 'Accepted',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-400',
    icon: CheckCircle,
  },
  sold: {
    label: 'Sold',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-400',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-400',
    icon: XCircle,
  },
  declined: {
    label: 'Declined',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-400',
    icon: XCircle,
  },
  lost: {
    label: 'Lost',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-300',
    icon: XCircle,
  },
  expired: {
    label: 'Expired',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-400',
    icon: AlertTriangle,
  },
  voided: {
    label: 'Voided',
    bgColor: 'bg-slate-200',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-400',
    icon: Ban,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-300',
    icon: Ban,
  },
};

export function EstimateStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}: EstimateStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {config.label}
    </Badge>
  );
}

export function getEstimateStatusLabel(status: string): string {
  return STATUS_CONFIG[status]?.label || status;
}

export function getEstimateStatusColor(status: string): string {
  return STATUS_CONFIG[status]?.textColor || 'text-slate-600';
}

'use client';

import { cn } from '@/lib/utils';
import { BotStatus } from '@/types/api';
import { Circle } from 'lucide-react';

interface BotStatusBadgeProps {
  status: BotStatus;
  className?: string;
}

const statusConfig: Record<
  BotStatus,
  { label: string; color: string; bgColor: string; animate?: boolean }
> = {
  RUNNING: {
    label: 'Running',
    color: 'text-success',
    bgColor: 'bg-success/20',
  },
  STOPPED: {
    label: 'Stopped',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  STARTING: {
    label: 'Starting',
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    animate: true,
  },
  STOPPING: {
    label: 'Stopping',
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    animate: true,
  },
  RESTARTING: {
    label: 'Restarting',
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    animate: true,
  },
  ERROR: {
    label: 'Error',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
  },
};

export function BotStatusBadge({ status, className }: BotStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Circle
        className={cn('h-2 w-2 fill-current', config.animate && 'animate-pulse')}
      />
      {config.label}
    </span>
  );
}

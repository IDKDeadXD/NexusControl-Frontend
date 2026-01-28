'use client';

import Link from 'next/link';
import { Bot as BotIcon, Clock, Cpu, MemoryStick, Play, Square, RotateCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BotStatusBadge } from './BotStatusBadge';
import { Bot } from '@/types/api';
import { formatRelativeTime } from '@/lib/utils';
import { useBotControls, useBotStatus } from '@/hooks/useBots';
import { useToast } from '@/hooks/useToast';

interface BotCardProps {
  bot: Bot;
}

function UsageBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full transition-all duration-300 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function BotCard({ bot }: BotCardProps) {
  const { toast } = useToast();
  const { start, stop, restart } = useBotControls(bot.id);
  const { data: status } = useBotStatus(bot.id);

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await start.mutateAsync();
      toast({ title: 'Bot starting', description: `${bot.name} is starting up...` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to start bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await stop.mutateAsync();
      toast({ title: 'Bot stopping', description: `${bot.name} is stopping...` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to stop bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleRestart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await restart.mutateAsync();
      toast({ title: 'Bot restarting', description: `${bot.name} is restarting...` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to restart bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const isLoading =
    start.isPending || stop.isPending || restart.isPending;
  const isRunning = bot.status === 'RUNNING';
  const isStopped = bot.status === 'STOPPED';
  const isTransitioning =
    bot.status === 'STARTING' ||
    bot.status === 'STOPPING' ||
    bot.status === 'RESTARTING';

  // Get resource usage from status
  const cpuUsage = status?.stats?.cpuUsage ?? 0;
  const memoryUsage = status?.stats?.memoryUsage ?? 0;
  const memoryLimit = status?.stats?.memoryLimit ?? bot.memoryLimit;
  const cpuLimit = bot.cpuLimit * 100; // Convert to percentage

  // Determine colors based on usage
  const getCpuColor = (usage: number) => {
    if (usage > 80) return 'bg-red-500';
    if (usage > 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getMemoryColor = (usage: number, limit: number) => {
    const percent = limit > 0 ? (usage / limit) * 100 : 0;
    if (percent > 80) return 'bg-red-500';
    if (percent > 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <Link href={`/dashboard/bots/${bot.id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 transition-colors group-hover:bg-primary/30">
                <BotIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{bot.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {bot.description || 'No description'}
                </p>
              </div>
            </div>
            <BotStatusBadge status={bot.status} />
          </div>

          {/* Resource Usage - Only show when running */}
          {isRunning && status?.stats && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Cpu className="h-3 w-3" />
                    CPU
                  </span>
                  <span className="font-medium">
                    {cpuUsage.toFixed(1)}%
                    <span className="text-muted-foreground">/{cpuLimit}%</span>
                  </span>
                </div>
                <UsageBar value={cpuUsage} max={cpuLimit} color={getCpuColor(cpuUsage)} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MemoryStick className="h-3 w-3" />
                    RAM
                  </span>
                  <span className="font-medium">
                    {memoryUsage.toFixed(0)}
                    <span className="text-muted-foreground">/{memoryLimit} MB</span>
                  </span>
                </div>
                <UsageBar value={memoryUsage} max={memoryLimit} color={getMemoryColor(memoryUsage, memoryLimit)} />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {bot.lastStartedAt
                ? formatRelativeTime(bot.lastStartedAt)
                : 'Never started'}
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
              {bot.runtime === 'NODEJS' ? 'Node.js' : 'Python'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex items-center gap-2">
            {isStopped && (
              <Button
                size="sm"
                variant="success"
                onClick={handleStart}
                disabled={isLoading}
                className="gap-1.5"
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
            )}
            {isRunning && (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStop}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestart}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RotateCw className="h-4 w-4" />
                  Restart
                </Button>
              </>
            )}
            {isTransitioning && (
              <Button size="sm" variant="outline" disabled>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {bot.status === 'STARTING'
                  ? 'Starting...'
                  : bot.status === 'STOPPING'
                  ? 'Stopping...'
                  : 'Restarting...'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

'use client';

import { Activity, Bot, Clock, Cpu, MemoryStick, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBots, useOverviewAnalytics, useSystemStats } from '@/hooks/useBots';

function ProgressBar({
  value,
  max,
  color = 'primary',
}: {
  value: number;
  max: number;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500',
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full transition-all duration-500 ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: bots, isLoading: botsLoading } = useBots();
  const { data: analytics, isLoading: analyticsLoading } = useOverviewAnalytics();
  const { data: systemStats, isLoading: systemLoading } = useSystemStats();

  const isLoading = botsLoading || analyticsLoading || systemLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const cpuUsage = systemStats?.resources.cpuUsage || 0;
  const memUsedGB = systemStats?.resources.memoryUsage
    ? systemStats.resources.memoryUsage / 1024
    : 0;
  const memTotalGB = systemStats?.resources.memoryTotal || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Monitor your bot performance and system resources
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bots</p>
                <p className="text-2xl font-bold">{analytics?.totalBots || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{analytics?.runningBots || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">{analytics?.errorBots || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Uptime</p>
                <p className="text-2xl font-bold">
                  {analytics?.totalUptime?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Cpu className="h-4 w-4 text-primary" />
              Total CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold">{cpuUsage.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">
                across all bots
              </span>
            </div>
            <ProgressBar
              value={cpuUsage}
              max={100}
              color={
                cpuUsage > 80
                  ? 'destructive'
                  : cpuUsage > 50
                    ? 'warning'
                    : 'success'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <MemoryStick className="h-4 w-4 text-primary" />
              Total Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold">{memUsedGB.toFixed(2)} GB</span>
              <span className="text-sm text-muted-foreground">
                of {memTotalGB.toFixed(1)} GB system memory
              </span>
            </div>
            <ProgressBar
              value={memUsedGB}
              max={memTotalGB}
              color={
                memUsedGB / memTotalGB > 0.8
                  ? 'destructive'
                  : memUsedGB / memTotalGB > 0.5
                    ? 'warning'
                    : 'success'
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Bot List with Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {bots && bots.length > 0 ? (
            <div className="space-y-4">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        bot.status === 'RUNNING'
                          ? 'bg-emerald-500'
                          : bot.status === 'ERROR'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{bot.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {bot.runtime === 'NODEJS' ? 'Node.js' : 'Python'} | {bot.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">CPU Limit</p>
                      <p className="font-medium">{(bot.cpuLimit * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Memory Limit</p>
                      <p className="font-medium">{bot.memoryLimit} MB</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No bots configured</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

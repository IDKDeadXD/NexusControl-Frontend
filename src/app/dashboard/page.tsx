'use client';

import Link from 'next/link';
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  Plus,
  Server,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBots, useOverviewAnalytics, useSystemStats } from '@/hooks/useBots';
import { BotCard } from '@/components/bots/BotCard';

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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const bgColors = {
    primary: 'bg-primary/20',
    success: 'bg-emerald-500/20',
    warning: 'bg-amber-500/20',
    muted: 'bg-muted',
  };
  const iconColors = {
    primary: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    muted: 'text-muted-foreground',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColors[color]}`}
          >
            <Icon className={`h-6 w-6 ${iconColors[color]}`} />
          </div>
        </div>
        {trend && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className={`h-full ${
                trend === 'up'
                  ? 'bg-emerald-500'
                  : trend === 'down'
                    ? 'bg-red-500'
                    : 'bg-muted'
              }`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: bots, isLoading: botsLoading } = useBots();
  const { data: analytics, isLoading: analyticsLoading } = useOverviewAnalytics();
  const { data: systemStats, isLoading: systemLoading } = useSystemStats();

  const isLoading = botsLoading || analyticsLoading || systemLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const cpuUsagePercent = systemStats?.resources.cpuUsage || 0;
  const memUsedGB = systemStats?.resources.memoryUsage
    ? systemStats.resources.memoryUsage / 1024
    : 0;
  const memTotalGB = systemStats?.resources.memoryTotal || 0;
  const memUsagePercent = memTotalGB > 0 ? (memUsedGB / memTotalGB) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor and manage your Discord bots
          </p>
        </div>
        <Link href="/dashboard/bots/new">
          <Button className="gap-2 shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" />
            New Bot
          </Button>
        </Link>
      </div>

      {/* System Status Banner */}
      <Card
        className={`border-l-4 ${
          systemStats?.docker.connected
            ? 'border-l-emerald-500 bg-emerald-500/5'
            : 'border-l-red-500 bg-red-500/5'
        }`}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {systemStats?.docker.connected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {systemStats?.docker.connected
                  ? 'Docker Connected'
                  : 'Docker Disconnected'}
              </p>
              <p className="text-sm text-muted-foreground">
                {systemStats?.docker.connected
                  ? `Version ${systemStats.docker.version} | ${systemStats.docker.containers.running} containers running`
                  : 'Unable to connect to Docker daemon'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Images</p>
              <p className="font-semibold">{systemStats?.docker.images || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Containers</p>
              <p className="font-semibold">
                {systemStats?.docker.containers.total || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bots"
          value={analytics?.totalBots || 0}
          subtitle="Registered bots"
          icon={Bot}
          color="primary"
        />
        <StatCard
          title="Running"
          value={analytics?.runningBots || 0}
          subtitle="Active now"
          icon={Activity}
          color="success"
          trend={analytics?.runningBots ? 'up' : 'neutral'}
        />
        <StatCard
          title="Stopped"
          value={analytics?.stoppedBots || 0}
          subtitle="Inactive"
          icon={Server}
          color="muted"
        />
        <StatCard
          title="Avg. Uptime"
          value={`${analytics?.totalUptime?.toFixed(1) || 0}%`}
          subtitle="Last 24 hours"
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Resource Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Cpu className="h-4 w-4 text-primary" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">
                {cpuUsagePercent.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                Managed containers
              </span>
            </div>
            <ProgressBar
              value={cpuUsagePercent}
              max={100}
              color={
                cpuUsagePercent > 80
                  ? 'destructive'
                  : cpuUsagePercent > 50
                    ? 'warning'
                    : 'success'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <MemoryStick className="h-4 w-4 text-primary" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">
                {memUsedGB.toFixed(2)} GB
              </span>
              <span className="text-sm text-muted-foreground">
                of {memTotalGB.toFixed(1)} GB
              </span>
            </div>
            <ProgressBar
              value={memUsagePercent}
              max={100}
              color={
                memUsagePercent > 80
                  ? 'destructive'
                  : memUsagePercent > 50
                    ? 'warning'
                    : 'success'
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Containers Running</p>
              <p className="text-xl font-bold">
                {systemStats?.docker.containers.running || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <HardDrive className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Docker Images</p>
              <p className="text-xl font-bold">
                {systemStats?.docker.images || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bots in Error</p>
              <p className="text-xl font-bold">{analytics?.errorBots || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bots List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Bots</h2>
          <Link href="/dashboard/bots">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>

        {bots && bots.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.slice(0, 6).map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No bots yet</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Get started by adding your first Discord bot
              </p>
              <Link href="/dashboard/bots/new">
                <Button className="mt-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Bot
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

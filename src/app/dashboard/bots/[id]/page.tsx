'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Clock,
  Cpu,
  HardDrive,
  Loader2,
  Play,
  RotateCw,
  Settings,
  Square,
  Terminal,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BotStatusBadge } from '@/components/bots/BotStatusBadge';
import { LogViewer } from '@/components/bots/LogViewer';
import { EnvVarEditor } from '@/components/bots/EnvVarEditor';
import { ResourceChart } from '@/components/analytics/ResourceChart';
import { FileManager } from '@/components/FileManager';
import {
  useBot,
  useBotStatus,
  useBotAnalytics,
  useBotControls,
  useDeleteBot,
} from '@/hooks/useBots';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime } from '@/lib/utils';

export default function BotDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const { data: bot, isLoading: botLoading } = useBot(id);
  const { data: status } = useBotStatus(id);
  const { data: analytics } = useBotAnalytics(id);
  const { start, stop, restart } = useBotControls(id);
  const deleteBot = useDeleteBot();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStart = async () => {
    try {
      await start.mutateAsync();
      toast({ title: 'Bot starting', description: 'Your bot is starting up...' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to start bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleStop = async () => {
    try {
      await stop.mutateAsync();
      toast({ title: 'Bot stopping', description: 'Your bot is stopping...' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to stop bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleRestart = async () => {
    try {
      await restart.mutateAsync();
      toast({ title: 'Bot restarting', description: 'Your bot is restarting...' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to restart bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBot.mutateAsync(id);
      toast({ title: 'Bot deleted', description: 'Your bot has been deleted' });
      router.push('/dashboard/bots');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete bot',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  if (botLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Bot className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Bot not found</h2>
        <Link href="/dashboard/bots">
          <Button className="mt-4">Back to Bots</Button>
        </Link>
      </div>
    );
  }

  const isRunning = bot.status === 'RUNNING';
  const isStopped = bot.status === 'STOPPED';
  const isTransitioning =
    bot.status === 'STARTING' ||
    bot.status === 'STOPPING' ||
    bot.status === 'RESTARTING';
  const isControlLoading =
    start.isPending || stop.isPending || restart.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bots">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{bot.name}</h1>
                <BotStatusBadge status={bot.status} />
              </div>
              <p className="mt-1 text-muted-foreground">
                {bot.description || 'No description'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStopped && (
            <Button
              variant="success"
              onClick={handleStart}
              disabled={isControlLoading}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}
          {isRunning && (
            <>
              <Button
                variant="outline"
                onClick={handleRestart}
                disabled={isControlLoading}
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Restart
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={isControlLoading}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}
          {isTransitioning && (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {bot.status}...
            </Button>
          )}
          <Link href={`/dashboard/bots/${id}/settings`}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Started</p>
                <p className="font-medium">
                  {bot.lastStartedAt
                    ? formatRelativeTime(bot.lastStartedAt)
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">CPU Usage</p>
                <p className="font-medium">
                  {status?.stats?.cpuUsage?.toFixed(1) ?? '0'}% / {bot.cpuLimit} cores
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Memory</p>
                <p className="font-medium">
                  {status?.stats?.memoryUsage?.toFixed(0) ?? '0'} / {bot.memoryLimit} MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Runtime</p>
                <p className="font-medium">
                  {bot.runtime === 'NODEJS' ? 'Node.js 20' : 'Python 3.11'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Entry File</p>
                <p className="font-medium truncate">{bot.entryFile}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="console" className="space-y-4">
        <TabsList>
          <TabsTrigger value="console" className="gap-2">
            <Terminal className="h-4 w-4" />
            Console
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="env" className="gap-2">
            <Settings className="h-4 w-4" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Cpu className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="console" className="h-[500px]">
          <LogViewer botId={id} />
        </TabsContent>

        <TabsContent value="files">
          <FileManager botId={id} />
        </TabsContent>

        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <EnvVarEditor botId={id} />
              <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-300">
                  <strong>Tip:</strong> Add your Discord bot token here as{' '}
                  <code className="rounded bg-blue-500/20 px-1">DISCORD_TOKEN</code>.
                  Environment variables are encrypted and injected when the bot starts.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <>
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="text-2xl font-bold">
                        {analytics.uptime.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-muted-foreground">Avg CPU</p>
                      <p className="text-2xl font-bold">
                        {analytics.averageCpu.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-muted-foreground">Avg Memory</p>
                      <p className="text-2xl font-bold">
                        {analytics.averageMemory.toFixed(0)} MB
                      </p>
                    </div>
                  </div>
                  <ResourceChart analytics={analytics} />
                </>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Instance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instance Info */}
              <div className="rounded-lg bg-white/5 p-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Instance Name</p>
                    <p className="font-medium">{bot.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Container Name</p>
                    <p className="font-medium font-mono text-sm">{bot.containerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory Limit</p>
                    <p className="font-medium">{bot.memoryLimit} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Limit</p>
                    <p className="font-medium">{bot.cpuLimit} cores</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entry File</p>
                    <p className="font-medium">{bot.entryFile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auto Restart</p>
                    <p className="font-medium">{bot.autoRestart ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                {bot.startCommand && (
                  <div>
                    <p className="text-sm text-muted-foreground">Custom Start Command</p>
                    <p className="font-medium font-mono text-sm">{bot.startCommand}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Link href={`/dashboard/bots/${id}/settings`}>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Settings
                  </Button>
                </Link>
              </div>

              {/* Danger Zone */}
              <div className="rounded-lg border border-destructive/50 p-4">
                <h3 className="font-medium text-destructive">Danger Zone</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently delete this instance and all its data
                </p>
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="mt-4 gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Instance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Instance</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete "{bot.name}"? This action
                        cannot be undone and will remove all data including
                        files, logs, and environment variables.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteBot.isPending}
                      >
                        {deleteBot.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

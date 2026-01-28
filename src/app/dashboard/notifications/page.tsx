'use client';

import { Bell, BellOff, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-muted-foreground">
          Configure how you receive notifications about your bots
        </p>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-l-4 border-l-amber-500 bg-amber-500/5">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium">Feature In Development</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Email and push notifications are coming soon. For now, you can use
              Discord webhooks to receive notifications.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base">Discord Webhooks</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via Discord
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Coming soon
                </p>
              </div>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Coming soon
                </p>
              </div>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Events Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { event: 'Bot Started', description: 'When a bot starts running' },
            { event: 'Bot Stopped', description: 'When a bot is stopped' },
            { event: 'Bot Crashed', description: 'When a bot crashes unexpectedly' },
            { event: 'Bot Error', description: 'When a bot encounters an error' },
            { event: 'High CPU Usage', description: 'When CPU usage exceeds 80%' },
            { event: 'High Memory Usage', description: 'When memory usage exceeds 80%' },
          ].map((item) => (
            <div
              key={item.event}
              className="flex items-center justify-between rounded-lg bg-white/5 p-4"
            >
              <div>
                <p className="font-medium">{item.event}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked={item.event.includes('Crash') || item.event.includes('Error')} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

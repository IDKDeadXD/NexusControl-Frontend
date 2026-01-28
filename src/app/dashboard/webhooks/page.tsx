'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  ExternalLink,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  Webhook,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api, apiRequest } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useBots } from '@/hooks/useBots';

interface WebhookEvent {
  id: string;
  event: string;
}

interface WebhookData {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  events: WebhookEvent[];
  botIds: string[];
  createdAt: string;
}

interface EventType {
  value: string;
  label: string;
  description: string;
}

const EVENT_COLORS: Record<string, string> = {
  BOT_STARTED: 'bg-emerald-500/20 text-emerald-400',
  BOT_STOPPED: 'bg-gray-500/20 text-gray-400',
  BOT_CRASHED: 'bg-red-500/20 text-red-400',
  BOT_ERROR: 'bg-amber-500/20 text-amber-400',
  BOT_RESTARTED: 'bg-blue-500/20 text-blue-400',
  BOT_CREATED: 'bg-purple-500/20 text-purple-400',
  BOT_DELETED: 'bg-pink-500/20 text-pink-400',
};

function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiRequest<WebhookData[]>('get', '/api/webhooks'),
  });
}

function useEventTypes() {
  return useQuery({
    queryKey: ['webhook-event-types'],
    queryFn: () => apiRequest<EventType[]>('get', '/api/webhooks/events/types'),
  });
}

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: webhooks, isLoading } = useWebhooks();
  const { data: eventTypes } = useEventTypes();
  const { data: bots } = useBots();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    botIds: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/api/webhooks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook created successfully' });
      setIsCreateOpen(false);
      setFormData({ name: '', url: '', events: [], botIds: [] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to create webhook' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook deleted' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/api/webhooks/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/webhooks/${id}/test`),
    onSuccess: () => {
      toast({ title: 'Test notification sent' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to send test notification' });
    },
  });

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleCreate = () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Please fill in all required fields',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="mt-1 text-muted-foreground">
            Configure Discord webhooks for bot event notifications
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="My Discord Webhook"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://discord.com/api/webhooks/..."
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Supports Discord webhooks and generic HTTP endpoints
                </p>
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes?.map((event) => (
                    <button
                      key={event.value}
                      type="button"
                      onClick={() => toggleEvent(event.value)}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors ${
                        formData.events.includes(event.value)
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          formData.events.includes(event.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/10'
                        }`}
                      >
                        {formData.events.includes(event.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span>{event.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Discord Webhook Notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Receive instant notifications when your bots start, stop, crash, or
              encounter errors. Perfect for monitoring your bots without keeping
              the dashboard open.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      {webhooks && webhooks.length > 0 ? (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        webhook.enabled ? 'bg-primary/20' : 'bg-muted'
                      }`}
                    >
                      <Webhook
                        className={`h-6 w-6 ${
                          webhook.enabled ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{webhook.name}</h3>
                        {!webhook.enabled && (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        {webhook.url.substring(0, 50)}...
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {webhook.events.map((event) => (
                          <span
                            key={event.id}
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              EVENT_COLORS[event.event] || 'bg-white/10'
                            }`}
                          >
                            {event.event.replace('BOT_', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(enabled) =>
                        toggleMutation.mutate({ id: webhook.id, enabled })
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testMutation.mutate(webhook.id)}
                      disabled={testMutation.isPending || !webhook.enabled}
                    >
                      <Send className="mr-1.5 h-3 w-3" />
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Webhook className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No webhooks configured</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Add a Discord webhook to receive notifications about your bots
            </p>
            <Button
              className="mt-6 gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Your First Webhook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

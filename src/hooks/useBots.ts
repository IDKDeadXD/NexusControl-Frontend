'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiRequest } from '@/lib/api';
import {
  Bot,
  BotDetail,
  BotStatusInfo,
  BotAnalytics,
  OverviewAnalytics,
  CreateBotInput,
  UpdateBotInput,
  EnvVar,
  SystemStats,
} from '@/types/api';

// Fetch all bots
export function useBots() {
  return useQuery({
    queryKey: ['bots'],
    queryFn: () => apiRequest<Bot[]>('get', '/api/bots'),
  });
}

// Fetch single bot
export function useBot(id: string) {
  return useQuery({
    queryKey: ['bot', id],
    queryFn: () => apiRequest<BotDetail>('get', `/api/bots/${id}`),
    enabled: !!id,
  });
}

// Fetch bot status
export function useBotStatus(id: string) {
  return useQuery({
    queryKey: ['bot-status', id],
    queryFn: () => apiRequest<BotStatusInfo>('get', `/api/bots/${id}/status`),
    enabled: !!id,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

// Fetch bot logs
export function useBotLogs(id: string, tail: number = 100) {
  return useQuery({
    queryKey: ['bot-logs', id, tail],
    queryFn: () => apiRequest<string[]>('get', `/api/bots/${id}/logs?tail=${tail}`),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

// Fetch bot analytics
export function useBotAnalytics(id: string, hours: number = 24) {
  return useQuery({
    queryKey: ['bot-analytics', id, hours],
    queryFn: () =>
      apiRequest<BotAnalytics>('get', `/api/analytics/bots/${id}?hours=${hours}`),
    enabled: !!id,
  });
}

// Fetch overview analytics
export function useOverviewAnalytics() {
  return useQuery({
    queryKey: ['overview-analytics'],
    queryFn: () => apiRequest<OverviewAnalytics>('get', '/api/analytics/overview'),
  });
}

// Fetch system stats (Docker health, resource usage)
export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: () => apiRequest<SystemStats>('get', '/api/analytics/system'),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

// Fetch env vars
export function useEnvVars(botId: string) {
  return useQuery({
    queryKey: ['env-vars', botId],
    queryFn: () => apiRequest<EnvVar[]>('get', `/api/bots/${botId}/env`),
    enabled: !!botId,
  });
}

// Create bot mutation
export function useCreateBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBotInput) =>
      apiRequest<Bot>('post', '/api/bots', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['overview-analytics'] });
    },
  });
}

// Update bot mutation
export function useUpdateBot(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBotInput) =>
      apiRequest<Bot>('patch', `/api/bots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', id] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
}

// Delete bot mutation
export function useDeleteBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/bots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['overview-analytics'] });
    },
  });
}

// Bot control mutations
export function useBotControls(id: string) {
  const queryClient = useQueryClient();

  const invalidateBotQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['bot', id] });
    queryClient.invalidateQueries({ queryKey: ['bot-status', id] });
    queryClient.invalidateQueries({ queryKey: ['bots'] });
    queryClient.invalidateQueries({ queryKey: ['overview-analytics'] });
  };

  const start = useMutation({
    mutationFn: () => api.post(`/api/bots/${id}/start`),
    onSuccess: invalidateBotQueries,
  });

  const stop = useMutation({
    mutationFn: () => api.post(`/api/bots/${id}/stop`),
    onSuccess: invalidateBotQueries,
  });

  const restart = useMutation({
    mutationFn: () => api.post(`/api/bots/${id}/restart`),
    onSuccess: invalidateBotQueries,
  });

  return { start, stop, restart };
}

// Env var mutations
export function useAddEnvVar(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { key: string; value: string }) =>
      apiRequest<EnvVar>('post', `/api/bots/${botId}/env`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['env-vars', botId] });
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
    },
  });
}

export function useUpdateEnvVar(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.patch(`/api/bots/${botId}/env/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['env-vars', botId] });
    },
  });
}

export function useDeleteEnvVar(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => api.delete(`/api/bots/${botId}/env/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['env-vars', botId] });
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
    },
  });
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  accessToken: string;
  requiresPasswordChange: boolean;
  user: {
    id: string;
    username: string;
  };
}

export interface AdminInfo {
  id: string;
  username: string;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export type BotStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'ERROR'
  | 'RESTARTING';

export type BotRuntime = 'NODEJS' | 'PYTHON';

export interface Bot {
  id: string;
  name: string;
  description: string | null;
  containerName: string;
  status: BotStatus;
  runtime: BotRuntime;
  autoRestart: boolean;
  memoryLimit: number; // MB
  cpuLimit: number; // CPU cores
  createdAt: string;
  lastStartedAt: string | null;
  lastStoppedAt: string | null;
}

export interface BotDetail extends Bot {
  entryFile: string;
  startCommand: string | null;
  codeDirectory: string;
  envVars: { id: string; key: string }[];
}

export interface BotStatusInfo {
  status: BotStatus;
  containerStatus: string | null;
  stats: {
    cpuUsage: number;
    memoryUsage: number;
    memoryLimit: number;
  } | null;
  lastStartedAt: string | null;
  lastStoppedAt: string | null;
}

export interface EnvVar {
  id: string;
  key: string;
}

export interface BotAnalytics {
  botId: string;
  uptime: number;
  totalRuntime: number;
  statusHistory: {
    timestamp: string;
    status: BotStatus;
    cpuUsage: number | null;
    memoryUsage: number | null;
  }[];
  averageCpu: number;
  averageMemory: number;
}

export interface OverviewAnalytics {
  totalBots: number;
  runningBots: number;
  stoppedBots: number;
  errorBots: number;
  totalUptime: number;
  recentActivity: {
    botId: string;
    botName: string;
    status: BotStatus;
    timestamp: string;
  }[];
}

export interface CreateBotInput {
  name: string;
  description?: string;
  runtime: BotRuntime;
  entryFile?: string;
  startCommand?: string;
  autoRestart?: boolean;
  memoryLimit?: number; // MB (default 512)
  cpuLimit?: number; // CPU cores (default 1.0)
}

export interface UpdateBotInput {
  name?: string;
  description?: string | null;
  runtime?: BotRuntime;
  entryFile?: string;
  startCommand?: string | null;
  autoRestart?: boolean;
  memoryLimit?: number;
  cpuLimit?: number;
}

// File Manager Types
export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export interface FileStats {
  totalSize: number;
  totalSizeMB: number;
}

export interface SystemStats {
  docker: {
    connected: boolean;
    version?: string;
    containers: {
      total: number;
      running: number;
      paused: number;
      stopped: number;
    };
    images: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    memoryTotal: number;
    memoryFree: number;
  };
}

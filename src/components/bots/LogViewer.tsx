'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Pause, Play, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { subscribeToLogs, subscribeToStatus } from '@/lib/socket';
import { cn } from '@/lib/utils';

interface LogViewerProps {
  botId: string;
  initialLogs?: string[];
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'system' | 'daemon';
}

const DAEMON_PREFIX = '[Dead Studios Daemon]:';

function parseLogLevel(message: string): 'info' | 'warn' | 'error' | 'debug' | 'daemon' {
  // Check if it's a daemon message
  if (message.startsWith(DAEMON_PREFIX)) {
    return 'daemon';
  }
  const lower = message.toLowerCase();
  if (lower.includes('error') || lower.includes('err')) return 'error';
  if (lower.includes('warn') || lower.includes('warning')) return 'warn';
  if (lower.includes('debug')) return 'debug';
  return 'info';
}

export function LogViewer({ botId, initialLogs = [] }: LogViewerProps) {
  // Don't use initial logs - only show current session logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [botStatus, setBotStatus] = useState<string>('unknown');
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to bot status changes
  useEffect(() => {
    const unsubscribe = subscribeToStatus((data) => {
      if (data.botId === botId) {
        setBotStatus(data.status);

        // Clear logs when bot stops
        if (data.status === 'STOPPED') {
          setLogs([]);
        }

        // Show stopping message
        if (data.status === 'STOPPING') {
          setLogs((prev) => [...prev, {
            id: `system-${Date.now()}`,
            message: 'container@deadstudios~ Server marked as offline...',
            timestamp: data.timestamp,
            level: 'system',
          }]);
        }

        // Add system message when bot starts
        if (data.status === 'STARTING') {
          setLogs([{
            id: `system-${Date.now()}`,
            message: 'container@deadstudios~ Server marked as starting...',
            timestamp: data.timestamp,
            level: 'system',
          }]);
        }

        // Add system message when bot is running
        if (data.status === 'RUNNING') {
          setLogs((prev) => [...prev, {
            id: `system-${Date.now()}`,
            message: 'container@deadstudios~ Server marked as running...',
            timestamp: data.timestamp,
            level: 'system',
          }]);
        }
      }
    });

    return unsubscribe;
  }, [botId]);

  // Subscribe to logs
  useEffect(() => {
    if (isPaused) return;

    const unsubscribe = subscribeToLogs(botId, (data) => {
      setLogs((prev) => {
        const newLog: LogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          message: data.log,
          timestamp: data.timestamp,
          level: parseLogLevel(data.log),
        };
        // Keep last 1000 logs
        const updated = [...prev, newLog].slice(-1000);
        return updated;
      });
    });

    return unsubscribe;
  }, [botId, isPaused]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const content = logs.map((log) => `[${log.timestamp}] ${log.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-${botId}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-white/10 bg-black/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPaused ? 'default' : 'outline'}
            onClick={() => setIsPaused(!isPaused)}
            className="gap-1.5"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {logs.length} lines
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={downloadLogs}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={clearLogs}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Log Content */}
      <ScrollArea className="flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-auto p-4 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <p>No logs available</p>
              <p className="text-xs mt-1">Start the bot to see console output</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn('log-line py-0.5', {
                  'text-red-400': log.level === 'error',
                  'text-yellow-400': log.level === 'warn',
                  'text-gray-500': log.level === 'debug',
                  'text-gray-200': log.level === 'info',
                  'text-cyan-400 italic': log.level === 'system',
                  'text-blue-400': log.level === 'daemon',
                })}
              >
                <span className="whitespace-pre-wrap break-all">
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-4 right-4 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-lg"
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserX,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { format, formatDistanceToNow } from 'date-fns';

interface SecurityStats {
  failedLogins: {
    last24h: number;
    last7d: number;
  };
  suspiciousActivity: {
    last24h: number;
  };
  successfulLogins: {
    last24h: number;
  };
  activeSessions: number;
  totalAuditLogs: number;
  recentFailedLogins: Array<{
    ip: string;
    username: string;
    timestamp: string;
    userAgent: string;
  }>;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  username: string | null;
  ip: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  details: Record<string, unknown> | null;
  success: boolean;
  timestamp: string;
}

interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
}

interface SuspiciousIP {
  ip: string;
  attempts: number;
}

export default function SecurityPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, sessionsRes, ipsRes] = await Promise.all([
        api.get('/api/security/stats'),
        api.get('/api/security/audit-logs', {
          params: {
            limit: 20,
            offset: logsPage * 20,
            action: actionFilter !== 'all' ? actionFilter : undefined,
          },
        }),
        api.get('/api/security/sessions'),
        api.get('/api/security/suspicious-ips'),
      ]);

      setStats(statsRes.data);
      setAuditLogs(logsRes.data.logs);
      setLogsTotal(logsRes.data.total);
      setSessions(sessionsRes.data);
      setSuspiciousIPs(ipsRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load security data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [actionFilter, logsPage]);

  const revokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/api/security/sessions/${sessionId}`);
      toast({ title: 'Session revoked', description: 'The session has been terminated.' });
      fetchSecurityData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive',
      });
    }
  };

  const revokeAllSessions = async () => {
    try {
      await api.post('/api/security/sessions/revoke-all');
      toast({
        title: 'All sessions revoked',
        description: 'All other sessions have been terminated.',
      });
      fetchSecurityData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke sessions',
        variant: 'destructive',
      });
    }
  };

  const cleanupOldLogs = async () => {
    try {
      const res = await api.post('/api/security/audit-logs/cleanup', { days: 30 });
      toast({
        title: 'Cleanup complete',
        description: `Deleted ${res.data.deleted} old audit logs.`,
      });
      fetchSecurityData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cleanup logs',
        variant: 'destructive',
      });
    }
  };

  const getActionBadge = (action: string, success: boolean) => {
    if (!success) {
      return <Badge variant="destructive">{action}</Badge>;
    }

    if (action.includes('FAILED') || action === 'SUSPICIOUS_ACTIVITY') {
      return <Badge variant="destructive">{action}</Badge>;
    }

    if (action.includes('SUCCESS') || action.includes('CREATED')) {
      return <Badge className="bg-green-500/20 text-green-400">{action}</Badge>;
    }

    if (action.includes('DELETED') || action.includes('STOPPED')) {
      return <Badge variant="secondary">{action}</Badge>;
    }

    return <Badge variant="outline">{action}</Badge>;
  };

  const getSecurityLevel = () => {
    if (!stats) return 'unknown';
    const { failedLogins, suspiciousActivity } = stats;

    if (suspiciousActivity.last24h > 0 || failedLogins.last24h > 10) {
      return 'high';
    }
    if (failedLogins.last24h > 3) {
      return 'medium';
    }
    return 'low';
  };

  const securityLevel = getSecurityLevel();

  if (loading && !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">
            Monitor security events, manage sessions, and review audit logs
          </p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Security Status Banner */}
      <Card
        className={`border-2 ${
          securityLevel === 'high'
            ? 'border-red-500/50 bg-red-500/10'
            : securityLevel === 'medium'
            ? 'border-yellow-500/50 bg-yellow-500/10'
            : 'border-green-500/50 bg-green-500/10'
        }`}
      >
        <CardContent className="flex items-center gap-4 p-6">
          {securityLevel === 'high' ? (
            <ShieldAlert className="h-12 w-12 text-red-500" />
          ) : securityLevel === 'medium' ? (
            <Shield className="h-12 w-12 text-yellow-500" />
          ) : (
            <ShieldCheck className="h-12 w-12 text-green-500" />
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {securityLevel === 'high'
                ? 'Security Alert'
                : securityLevel === 'medium'
                ? 'Security Notice'
                : 'All Clear'}
            </h2>
            <p className="text-muted-foreground">
              {securityLevel === 'high'
                ? 'Suspicious activity detected. Review the logs below.'
                : securityLevel === 'medium'
                ? 'Some failed login attempts detected. Monitor closely.'
                : 'No security concerns in the last 24 hours.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedLogins.last24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedLogins.last7d || 0} in the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful Logins (24h)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successfulLogins.last24h || 0}</div>
            <p className="text-xs text-muted-foreground">Authenticated sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.suspiciousActivity.last24h || 0}</div>
            <p className="text-xs text-muted-foreground">Blocked requests (24h)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Suspicious IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Suspicious IPs
            </CardTitle>
            <CardDescription>IPs with failed login attempts in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {suspiciousIPs.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No suspicious IPs detected
              </p>
            ) : (
              <div className="space-y-2">
                {suspiciousIPs.map((ip) => (
                  <div
                    key={ip.ip}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <code className="text-sm">{ip.ip}</code>
                    <Badge variant="destructive">{ip.attempts} attempts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Manage active login sessions</CardDescription>
              </div>
              {sessions.length > 1 && (
                <Button variant="destructive" size="sm" onClick={revokeAllSessions}>
                  Revoke All Others
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No active sessions</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {index === 0 ? 'Current Session' : 'Session'}
                        </span>
                        {index === 0 && (
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true })}
                      </p>
                    </div>
                    {index !== 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Failed Logins */}
      {stats?.recentFailedLogins && stats.recentFailedLogins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Recent Failed Login Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentFailedLogins.map((login, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(login.timestamp), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <code>{login.username || 'unknown'}</code>
                    </TableCell>
                    <TableCell>
                      <code>{login.ip}</code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {login.userAgent || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Complete activity log ({logsTotal} total entries)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
                  <SelectItem value="BOT_CREATED">Bot Created</SelectItem>
                  <SelectItem value="BOT_DELETED">Bot Deleted</SelectItem>
                  <SelectItem value="BOT_STARTED">Bot Started</SelectItem>
                  <SelectItem value="BOT_STOPPED">Bot Stopped</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">Suspicious Activity</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={cleanupOldLogs}>
                <Trash2 className="mr-2 h-4 w-4" />
                Cleanup Old Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action, log.success)}</TableCell>
                  <TableCell>
                    <code className="text-sm">{log.username || '-'}</code>
                  </TableCell>
                  <TableCell>
                    {log.resourceName ? (
                      <span className="text-sm">
                        {log.resourceType}: {log.resourceName}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{log.ip || '-'}</code>
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {logsTotal > 20 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {logsPage * 20 + 1} - {Math.min((logsPage + 1) * 20, logsTotal)} of{' '}
                {logsTotal}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPage === 0}
                  onClick={() => setLogsPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(logsPage + 1) * 20 >= logsTotal}
                  onClick={() => setLogsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

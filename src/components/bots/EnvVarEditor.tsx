'use client';

import { useState, useCallback, useRef } from 'react';
import { Eye, EyeOff, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEnvVars, useAddEnvVar, useUpdateEnvVar, useDeleteEnvVar } from '@/hooks/useBots';
import { useToast } from '@/hooks/useToast';
import { EnvVar } from '@/types/api';

interface EnvVarEditorProps {
  botId: string;
}

// Parse .env file content into key-value pairs
function parseEnvFile(content: string): { key: string; value: string }[] {
  const lines = content.split('\n');
  const vars: { key: string; value: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.substring(0, equalsIndex).trim();
    let value = trimmed.substring(equalsIndex + 1).trim();

    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) {
      vars.push({ key: key.toUpperCase(), value });
    }
  }

  return vars;
}

export function EnvVarEditor({ botId }: EnvVarEditorProps) {
  const { toast } = useToast();
  const { data: envVars, isLoading } = useEnvVars(botId);
  const addEnvVar = useAddEnvVar(botId);
  const updateEnvVar = useUpdateEnvVar(botId);
  const deleteEnvVar = useDeleteEnvVar(botId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVar | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const dragCounter = useRef(0);

  const handleAdd = async () => {
    if (!newKey.trim()) {
      toast({
        variant: 'destructive',
        title: 'Key is required',
      });
      return;
    }

    try {
      await addEnvVar.mutateAsync({ key: newKey.toUpperCase(), value: newValue });
      toast({ title: 'Environment variable added' });
      setIsAddDialogOpen(false);
      setNewKey('');
      setNewValue('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add variable',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingVar) return;

    try {
      await updateEnvVar.mutateAsync({ key: editingVar.key, value: newValue });
      toast({ title: 'Environment variable updated' });
      setIsEditDialogOpen(false);
      setEditingVar(null);
      setNewValue('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update variable',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteEnvVar.mutateAsync(key);
      toast({ title: 'Environment variable deleted' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete variable',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  const openEditDialog = (envVar: EnvVar) => {
    setEditingVar(envVar);
    setNewValue('');
    setIsEditDialogOpen(true);
  };

  // Import multiple env vars from .env file
  const importEnvVars = useCallback(async (vars: { key: string; value: string }[]) => {
    setIsImporting(true);
    let added = 0;
    let updated = 0;
    let failed = 0;

    for (const { key, value } of vars) {
      try {
        const existing = envVars?.find((v) => v.key === key);
        if (existing) {
          await updateEnvVar.mutateAsync({ key, value });
          updated++;
        } else {
          await addEnvVar.mutateAsync({ key, value });
          added++;
        }
      } catch {
        failed++;
      }
    }

    setIsImporting(false);

    const parts = [];
    if (added > 0) parts.push(`${added} added`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (failed > 0) parts.push(`${failed} failed`);

    toast({
      title: 'Import complete',
      description: parts.join(', '),
      variant: failed > 0 ? 'destructive' : 'default',
    });
  }, [envVars, addEnvVar, updateEnvVar, toast]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's a .env file or similar
      if (file.name.startsWith('.env') || file.name.endsWith('.env')) {
        const content = await file.text();
        const vars = parseEnvFile(content);
        if (vars.length > 0) {
          await importEnvVars(vars);
        } else {
          toast({
            variant: 'destructive',
            title: 'No variables found',
            description: 'The file does not contain any valid environment variables.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please drop a .env file.',
        });
      }
    }
  }, [importEnvVars, toast]);

  if (isLoading || isImporting) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        {isImporting && <span className="ml-2 text-sm text-muted-foreground">Importing variables...</span>}
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 relative rounded-lg transition-all ${
        isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-primary/20 backdrop-blur-sm">
          <Upload className="h-12 w-12 text-primary animate-bounce" />
          <p className="mt-4 text-lg font-medium text-primary">Drop .env file here</p>
          <p className="text-sm text-muted-foreground">Variables will be imported automatically</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Environment Variables</h3>
          <p className="text-sm text-muted-foreground">
            Configure environment variables for your bot
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Variable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Environment Variable</DialogTitle>
              <DialogDescription>
                Add a new environment variable to your bot
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-key">Key</Label>
                <Input
                  id="new-key"
                  placeholder="MY_VARIABLE"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  Must be uppercase with underscores only
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-value">Value</Label>
                <div className="relative">
                  <Input
                    id="new-value"
                    type={showValue ? 'text' : 'password'}
                    placeholder="Enter value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showValue ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={addEnvVar.isPending}>
                {addEnvVar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Variables List */}
      <div className="space-y-2">
        {envVars && envVars.length > 0 ? (
          envVars.map((envVar) => (
            <div
              key={envVar.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
            >
              <div>
                <code className="text-sm font-medium">{envVar.key}</code>
                <p className="text-xs text-muted-foreground">
                  {envVar.key === 'DISCORD_TOKEN' ? 'Bot token (auto-managed)' : 'Encrypted'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(envVar)}
                >
                  Edit
                </Button>
                {envVar.key !== 'DISCORD_TOKEN' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(envVar.key)}
                    disabled={deleteEnvVar.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg bg-white/5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No environment variables configured
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Environment Variable</DialogTitle>
            <DialogDescription>
              Update the value for <code>{editingVar?.key}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">New Value</Label>
              <div className="relative">
                <Input
                  id="edit-value"
                  type={showValue ? 'text' : 'password'}
                  placeholder="Enter new value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showValue ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateEnvVar.isPending}>
              {updateEnvVar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

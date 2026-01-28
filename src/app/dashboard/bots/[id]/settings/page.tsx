'use client';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Bot, Cpu, HardDrive, Loader2, Save, Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBot, useUpdateBot } from '@/hooks/useBots';
import { useToast } from '@/hooks/useToast';
import { UpdateBotInput, BotRuntime } from '@/types/api';

const updateBotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  runtime: z.enum(['NODEJS', 'PYTHON']),
  entryFile: z.string().min(1, 'Entry file is required'),
  startCommand: z.string().optional().nullable(),
  autoRestart: z.boolean(),
  memoryLimit: z.number().min(64).max(8192),
  cpuLimit: z.number().min(0.1).max(8),
});

type UpdateBotForm = z.infer<typeof updateBotSchema>;

export default function BotSettingsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const { data: bot, isLoading } = useBot(id);
  const updateBot = useUpdateBot(id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateBotForm>({
    resolver: zodResolver(updateBotSchema),
    values: bot
      ? {
          name: bot.name,
          description: bot.description,
          runtime: bot.runtime,
          entryFile: bot.entryFile,
          startCommand: bot.startCommand,
          autoRestart: bot.autoRestart,
          memoryLimit: bot.memoryLimit,
          cpuLimit: bot.cpuLimit,
        }
      : undefined,
  });

  const runtime = watch('runtime');
  const memoryLimit = watch('memoryLimit') ?? 512;
  const cpuLimit = watch('cpuLimit') ?? 1;

  const onSubmit = async (data: UpdateBotForm) => {
    try {
      const input: UpdateBotInput = {
        name: data.name,
        description: data.description,
        runtime: data.runtime as BotRuntime,
        entryFile: data.entryFile,
        startCommand: data.startCommand || null,
        autoRestart: data.autoRestart,
        memoryLimit: data.memoryLimit,
        cpuLimit: data.cpuLimit,
      };

      await updateBot.mutateAsync(input);

      toast({
        title: 'Settings saved',
        description: 'Your instance settings have been updated.',
      });

      router.push(`/dashboard/bots/${id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to save settings',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  if (isLoading) {
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
        <h2 className="mt-4 text-xl font-semibold">Instance not found</h2>
        <Link href="/dashboard/bots">
          <Button className="mt-4">Back to Instances</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/bots/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Instance Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure settings for {bot.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update your instance name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Instance Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="A brief description of what your bot does"
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resource Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Resource Limits
            </CardTitle>
            <CardDescription>
              Configure how much resources this instance can use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Memory Limit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Memory Limit</Label>
                <span className="text-sm font-medium text-primary">
                  {memoryLimit} MB
                </span>
              </div>
              <Slider
                value={[memoryLimit]}
                onValueChange={([value]) => setValue('memoryLimit', value, { shouldDirty: true })}
                min={64}
                max={8192}
                step={64}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>64 MB</span>
                <span>8192 MB</span>
              </div>
            </div>

            {/* CPU Limit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU Cores
                </Label>
                <span className="text-sm font-medium text-primary">
                  {cpuLimit.toFixed(1)} cores
                </span>
              </div>
              <Slider
                value={[cpuLimit * 10]}
                onValueChange={([value]) => setValue('cpuLimit', value / 10, { shouldDirty: true })}
                min={1}
                max={80}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1 cores</span>
                <span>8.0 cores</span>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-300">
                <strong>Note:</strong> Resource limit changes will take effect on next container restart.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Runtime Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Runtime Configuration
            </CardTitle>
            <CardDescription>
              Configure how your bot will be executed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Runtime</Label>
                <Select
                  value={runtime}
                  onValueChange={(value) =>
                    setValue('runtime', value as 'NODEJS' | 'PYTHON', {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NODEJS">Node.js 20</SelectItem>
                    <SelectItem value="PYTHON">Python 3.11</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryFile">Entry File</Label>
                <Input id="entryFile" {...register('entryFile')} />
                {errors.entryFile && (
                  <p className="text-sm text-destructive">
                    {errors.entryFile.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startCommand">
                Custom Start Command (optional)
              </Label>
              <Input
                id="startCommand"
                placeholder={
                  runtime === 'NODEJS'
                    ? 'e.g., npm start or node src/index.js'
                    : 'e.g., python -m bot or python3 main.py'
                }
                {...register('startCommand')}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default command based on runtime and entry file
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
              <div>
                <Label>Auto Restart</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically restart the bot if it crashes
                </p>
              </div>
              <Switch
                checked={watch('autoRestart')}
                onCheckedChange={(checked) =>
                  setValue('autoRestart', checked, { shouldDirty: true })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href={`/dashboard/bots/${id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={!isDirty || updateBot.isPending}
          >
            {updateBot.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

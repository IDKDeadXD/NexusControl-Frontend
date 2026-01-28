'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Bot, Cpu, HardDrive, Loader2, Terminal } from 'lucide-react';
import Link from 'next/link';
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
import { useToast } from '@/hooks/useToast';
import { useCreateBot } from '@/hooks/useBots';
import { CreateBotInput, BotRuntime } from '@/types/api';

const createBotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  runtime: z.enum(['NODEJS', 'PYTHON']),
  entryFile: z.string().min(1, 'Entry file is required'),
  startCommand: z.string().optional(),
  autoRestart: z.boolean(),
  memoryLimit: z.number().min(64).max(8192),
  cpuLimit: z.number().min(0.1).max(8),
});

type CreateBotForm = z.infer<typeof createBotSchema>;

export default function NewBotPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createBot = useCreateBot();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBotForm>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      runtime: 'NODEJS',
      entryFile: 'index.js',
      autoRestart: false,
      memoryLimit: 512,
      cpuLimit: 1,
    },
  });

  const runtime = watch('runtime');
  const memoryLimit = watch('memoryLimit');
  const cpuLimit = watch('cpuLimit');

  const onSubmit = async (data: CreateBotForm) => {
    try {
      const input: CreateBotInput = {
        name: data.name,
        description: data.description,
        runtime: data.runtime as BotRuntime,
        entryFile: data.entryFile,
        startCommand: data.startCommand || undefined,
        autoRestart: data.autoRestart,
        memoryLimit: data.memoryLimit,
        cpuLimit: data.cpuLimit,
      };

      const bot = await createBot.mutateAsync(input);

      toast({
        title: 'Instance created',
        description: 'Your bot instance has been created. Upload your files to get started.',
      });

      router.push(`/dashboard/bots/${bot.id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create instance',
        description: error.response?.data?.error || 'Please try again',
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bots">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Instance</h1>
          <p className="mt-1 text-muted-foreground">
            Configure your bot instance settings and resource limits
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Instance Information
            </CardTitle>
            <CardDescription>
              Give your instance a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Instance Name</Label>
              <Input
                id="name"
                placeholder="My Discord Bot"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
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
                onValueChange={([value]) => setValue('memoryLimit', value)}
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
                onValueChange={([value]) => setValue('cpuLimit', value / 10)}
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
                  onValueChange={(value) => {
                    setValue('runtime', value as 'NODEJS' | 'PYTHON');
                    setValue(
                      'entryFile',
                      value === 'NODEJS' ? 'index.js' : 'main.py'
                    );
                  }}
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
                <Input
                  id="entryFile"
                  placeholder={runtime === 'NODEJS' ? 'index.js' : 'main.py'}
                  {...register('entryFile')}
                />
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
                onCheckedChange={(checked) => setValue('autoRestart', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <h4 className="font-medium text-blue-400">Next Steps</h4>
          <p className="mt-1 text-sm text-blue-300/80">
            After creating the instance, you'll be able to upload your bot files,
            configure environment variables (like your Discord token), and start
            your bot.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/dashboard/bots" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={createBot.isPending}
          >
            {createBot.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Instance'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

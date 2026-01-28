'use client';

import { Bot, Code, ExternalLink, Github, Heart, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="mt-1 text-muted-foreground">
          Learn more about Discord Bot Manager
        </p>
      </div>

      {/* Main Info */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/30 backdrop-blur">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Discord Bot Manager</h2>
              <p className="text-muted-foreground">
                Pterodactyl-style panel for managing Discord bots
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Discord Bot Manager is a self-hosted panel for managing your Discord bots
            with ease. Built with modern technologies, it provides a clean and intuitive
            interface for deploying, monitoring, and managing multiple bots from a
            single dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: Server,
                title: 'Docker Integration',
                description: 'Each bot runs in its own isolated Docker container',
              },
              {
                icon: Code,
                title: 'Multi-Runtime Support',
                description: 'Support for Node.js and Python bots',
              },
              {
                icon: Bot,
                title: 'File Manager',
                description: 'Built-in file manager with code editor',
              },
              {
                icon: Heart,
                title: 'Real-time Logs',
                description: 'Live console output with WebSocket streaming',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-lg bg-white/5 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              'Next.js 14',
              'React',
              'TypeScript',
              'Tailwind CSS',
              'Fastify',
              'Prisma',
              'PostgreSQL',
              'Docker',
              'Socket.io',
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle>Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Built with care by Dead Studios. Inspired by Pterodactyl Panel.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Discord Bot Manager v1.0.0</p>
        <p className="mt-1">Made with <Heart className="inline h-3 w-3 text-red-500" /> by Dead Studios</p>
      </div>
    </div>
  );
}

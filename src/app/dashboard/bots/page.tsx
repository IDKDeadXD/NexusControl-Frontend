'use client';

import Link from 'next/link';
import { Bot, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBots } from '@/hooks/useBots';
import { BotCard } from '@/components/bots/BotCard';

export default function BotsPage() {
  const { data: bots, isLoading } = useBots();
  const [search, setSearch] = useState('');

  const filteredBots = bots?.filter(
    (bot) =>
      bot.name.toLowerCase().includes(search.toLowerCase()) ||
      bot.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Bots</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your Discord bots in one place
          </p>
        </div>
        <Link href="/dashboard/bots/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bot
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search bots..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bots Grid */}
      {filteredBots && filteredBots.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      ) : bots && bots.length > 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Search className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No results found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search terms
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No bots yet</h3>
            <p className="mt-2 text-muted-foreground">
              Add your first Discord bot to get started
            </p>
            <Link href="/dashboard/bots/new">
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Bot
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

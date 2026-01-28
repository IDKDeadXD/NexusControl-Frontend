# NexusControl - Frontend

The web dashboard for NexusControl - a self-hosted Discord bot management panel.

## Features

- Modern, responsive dashboard
- Real-time bot status monitoring
- Live log streaming via WebSocket
- Bot container management (start/stop/restart)
- File manager for bot code
- Environment variable management
- Webhook notifications for bot events
- Security dashboard with audit logs
- Dark mode UI

## Prerequisites

- Node.js 18+
- NexusControl Backend running

## Installation

1. Clone the repository:
```bash
git clone https://github.com/IDKDeadXD/NexusControl-Frontend.git
cd NexusControl-Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your backend URL:
```
NEXT_PUBLIC_API_URL=http://your-backend-url:3001
```

4. Start development server:
```bash
npm run dev
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = Your backend URL

### Self-Hosted

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Or use the standalone output:
```bash
node .next/standalone/server.js
```

### Docker

```bash
docker build -t nexuscontrol-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://your-backend:3001 nexuscontrol-frontend
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **WebSocket**: Socket.io Client
- **Icons**: Lucide React

## Pages

- `/login` - Authentication
- `/change-password` - First-time password change
- `/dashboard` - Overview with system stats
- `/dashboard/bots` - Bot management
- `/dashboard/bots/new` - Create new bot
- `/dashboard/bots/[id]` - Bot details and logs
- `/dashboard/analytics` - Usage analytics
- `/dashboard/security` - Security dashboard
- `/dashboard/webhooks` - Webhook configuration
- `/dashboard/settings` - User settings

## License

MIT

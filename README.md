# Catalyst — Discord Bot Control Panel

A full-stack web dashboard for managing Discord bots. Built with React + Express, featuring a dark purple/blue aesthetic inspired by Discord.

## Features

- **Bot Connection** — Connect any Discord bot via token
- **Server Management** — View all servers the bot is in
- **Nuke** — Configurable server nuke (delete channels, roles, kick/ban all, leave)
- **Single Ban / Kick / Unban** — Act on specific users by Discord ID
- **Member List** — Browse and ban/kick members from a searchable list
- **Mass Actions** — Nuke channels, nuke roles, mass kick, mass ban, unban all, leave server
- **Send Message** — Post to any text channel
- **DM All Members** — Broadcast a DM to every non-bot member
- **Action Log** — Live log of all operations performed

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS v4 |
| Backend | Express + TypeScript |
| Bot | discord.js v14 |
| API | OpenAPI spec with auto-generated types + hooks |
| Auth | Session-based password auth |

## Setup

### Requirements

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A Discord bot token ([create one here](https://discord.com/developers/applications))

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/catalyst-bot-panel.git
cd catalyst-bot-panel

# Install dependencies
pnpm install

# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend (in another terminal)
pnpm --filter @workspace/catalyst run dev
```

Then open `http://localhost:24400` in your browser.

### Environment Variables

Create a `.env` file in `artifacts/api-server/`:

```env
# Password to access the dashboard (default: catalyst2024)
DASHBOARD_PASSWORD=your_secure_password

# Session secret for cookie signing (change this!)
SESSION_SECRET=your_random_secret_here

# Port (default: 8080)
PORT=8080
```

> **Important:** Change the `DASHBOARD_PASSWORD` and `SESSION_SECRET` before deploying!

## Deployment

The app runs as two services:

1. **API Server** — `artifacts/api-server/` → runs on port 8080
2. **Frontend** — `artifacts/catalyst/` → runs on port 24400

For production, build the frontend with `pnpm --filter @workspace/catalyst run build` and serve the `dist/` folder via nginx or a static host, pointing `/api/*` requests to the API server.

### Deploy on Railway / Render

1. Push to GitHub
2. Create a new service for the API server (`pnpm --filter @workspace/api-server run start`)
3. Create another service or use a static host for the frontend
4. Set the `DASHBOARD_PASSWORD` and `SESSION_SECRET` environment variables

## Security

- The dashboard is protected by a single password (configurable via env var)
- All bot operations require an active session
- Bot tokens are never stored persistently — they are only held in memory while the process runs
- Use a strong `SESSION_SECRET` in production

## License

MIT

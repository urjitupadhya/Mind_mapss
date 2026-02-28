# Deployment Guide — mindctl

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

## Local Installation

```bash
# Clone the repository
git clone https://github.com/your-team/mindctl.git
cd mindctl

# Install CLI dependencies
cd packages/cli
npm install

# Run directly
node bin/mindctl.js

# Or link globally for `mindctl` command
npm link
mindctl
```

## Configuration

### MegaLLM API Setup

```bash
# Interactive setup
mindctl config setup

# Or via environment variables
export MEGALLM_API_URL="https://api.megallm.com/v1/chat"
export MEGALLM_API_KEY="your-api-key"
export MEGALLM_MODEL="megallm-2.5"
```

All AI features work offline with intelligent fallback responses. The API key is optional but unlocks full AI capabilities.

## Data Storage

All data is stored locally at `~/.mindctl/mindctl.db` (SQLite).

- **Export:** `mindctl data export` (coming soon)
- **Delete:** Delete `~/.mindctl/` directory
- **Backup:** Copy `~/.mindctl/mindctl.db`

## Full System Architecture

```
mindctl (CLI)              → Terminal commands, animations, companion
packages/backend           → Fastify API for telemetry & insights
packages/dashboard         → React web dashboard (Vite)
packages/extension         → VS Code extension for code session tracking
```

### Running the Full Stack

```bash
# From root directory
npm install

# Backend (API server)
npm run dev:backend

# Dashboard (web UI)
npm run dev:dashboard

# Extension (VS Code)
cd packages/extension && npm run build
# Then install the .vsix in VS Code
```

## Platform Support

| Platform | Status |
|----------|--------|
| Windows  | ✅ Fully supported |
| macOS    | ✅ Fully supported |
| Linux    | ✅ Fully supported |

## Troubleshooting

### `better-sqlite3` build errors
```bash
npm rebuild better-sqlite3
```

### Permission errors on global install
```bash
npm link --force
# or use npx
npx ./bin/mindctl.js
```

### Terminal animations not rendering
Ensure your terminal supports Unicode and ANSI escape codes. Most modern terminals do (Terminal.app, iTerm2, Windows Terminal, GNOME Terminal).

## NPM Publishing (Future)

```bash
cd packages/cli
npm publish
# Users can then: npx mindctl
```

# MindLint - Cognitive Weather System for Developers

<p align="center">
  <strong>Observability for your brain, not your code.</strong>
</p>

MindLint is a cognitive observability platform that helps developers understand and optimize their mental performance during coding sessions. Think of it as a "weather report" for your coding mind.

## Overview

MindLint tracks behavioral cognitive patterns during coding sessions and provides actionable insights to improve focus, reduce burnout, and optimize your workflow. Unlike traditional developer tools that analyze code, MindLint analyzes *you* — your typing patterns, error rates, session stability, and work rhythms.

## Features

- **Session Analysis** — Real-time tracking of cognitive stability, error rates, and typing patterns
- **Cognitive Weather Forecast** — Predictive insights about your mental state throughout the day
- **Weekly Narrative Reports** — AI-generated summaries of your cognitive patterns over time
- **Recovery Suggestions** — Intelligent prompts when strain is detected
- **AI Therapy Chat** — Conversational AI companion for mental wellness
- **Guided Meditation** — Breathing exercises and mindfulness practices
- **CBT Tools** — Cognitive Behavioral Therapy thought records and reframing
- **Habit Tracking** — Build healthy coding habits with gamification
- **Burnout Detection** — Git-powered burnout risk analysis
- **Team Insights** — Aggregated, anonymized patterns for enterprise teams (coming soon)

## Architecture

This is a monorepo containing four packages:

| Package | Description |
|---------|-------------|
| `mindctl` (CLI) | Terminal-based wellness toolkit and command interface |
| `mindlint-backend` | Fastify API server for telemetry storage and processing |
| `mindlint-dashboard` | React-based web interface for visualizing cognitive insights |
| `mindlint-extension` | VS Code extension for capturing telemetry |

### Tech Stack

- **CLI**: Node.js, Commander, Chalk, Inquirer, Terminal Kit
- **Backend**: Fastify, Better-SQLite3, WebSockets
- **Dashboard**: React 18, Vite, Recharts, Framer Motion, Tailwind CSS
- **Extension**: TypeScript, VS Code API, esbuild

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install all dependencies
npm install

# Build all packages
npm run build
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MEGALLM_API_URL` - Your AI API endpoint
- `MEGALLM_API_KEY` - Your API key

### Development

```bash
# Run CLI in development mode
npm run dev:cli

# Run backend in development mode
npm run dev:backend

# Run dashboard in development mode
npm run dev:dashboard

# Build the VS Code extension
npm run build:extension
```

### Running the Full Stack

1. Start the backend:
   ```bash
   npm run dev:backend
   ```

2. In a separate terminal, start the dashboard:
   ```bash
   npm run dev:dashboard
   ```

3. Install the VS Code extension (see below)

### Docker Deployment

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## VS Code Extension

The MindLint extension collects telemetry from your VS Code sessions:

- **Typing cadence** — Keystroke patterns and variance
- **Error tracking** — Lint errors and diagnostic events
- **File switching** — Context switching frequency
- **Session duration** — Time spent in deep work

### Installing the Extension

```bash
cd packages/extension
npm install
npm run build
```

Then install the extension in VS Code by running "Extensions: Install from VSIX" and selecting the built extension.

### Extension Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mindlint.backendUrl` | `http://localhost:3001` | Backend server URL |
| `mindlint.trackTyping` | `true` | Enable typing pattern tracking |
| `mindlint.trackErrors` | `true` | Enable lint error tracking |
| `mindlint.minSessionDuration` | `5` | Minimum session minutes to record |

## CLI Commands

The `mindctl` CLI provides a comprehensive terminal interface for mental wellness:

### Mood & Check-ins
```bash
mindctl check-in          # Smart mood check-in with AI insights
mindctl mood-history      # View mood history
```

### Breathing & Meditation
```bash
mindctl breathe           # Guided breathing exercises
mindctl breathe --type box   # Box breathing (4-4-4-4)
mindctl breathe --type 478   # 4-7-8 relaxing breath
mindctl meditate timer   # Meditation timer
mindctl meditate guided  # AI-guided meditation
mindctl meditate ground  # 5-4-3-2-1 grounding
```

### Journaling
```bash
mindctl journal write     # Freeform journal entry
mindctl journal prompt    # Write with therapeutic prompt
mindctl journal gratitude # Gratitude practice (3 things)
mindctl journal dream    # Dream journal with AI analysis
mindctl journal history  # Review past entries
mindctl journal analyze  # AI pattern analysis
```

### CBT & Thought Management
```bash
mindctl think record     # Full CBT thought record
mindctl think reframe   # Quick negative thought reframing
mindctl think history   # View past thought records
```

### AI Conversation
```bash
mindctl talk open       # Open-ended therapy chat
mindctl talk vent       # Safe venting space
mindctl talk socratic   # Socratic questioning mode
mindctl talk wisdom     # AI wisdom quote
mindctl talk challenge  # Daily wellness challenge
```

### Focus & Productivity
```bash
mindctl focus           # Immersive Zen focus session (25 min)
mindctl focus 45       # Custom focus duration
mindctl flow           # AI Flow State analysis
mindctl quest          # Active wellness quest
```

### Wellness Tracking
```bash
mindctl water           # Log water intake
mindctl eyes            # 20-20-20 eye break reminder
mindctl stretch        # Guided desk stretches
mindctl posture        # Posture check reminder
mindctl walk           # Walk timer
```

### Health Tracking
```bash
mindctl sleep log      # Log last night's sleep
mindctl sleep history  # Sleep trends
mindctl sleep tips     # Sleep hygiene tips
mindctl habit add     # Create new habit
mindctl habit check   # Check off habits
mindctl habit list   # View all habits & streaks
```

### Analytics & Insights
```bash
mindctl stats today    # Today's wellness snapshot
mindctl stats week     # Weekly dashboard
mindctl stats month   # Monthly overview
mindctl stats report  # AI weekly report
mindctl forecast      # Tomorrow's mood prediction
mindctl insights      # Behavioral correlations
mindctl report        # Weekly wellness report
mindctl burnout       # Git-powered burnout analysis
```

### Background Guardian
```bash
mindctl daemon start   # Start wellness guardian
mindctl daemon stop    # Stop guardian
mindctl daemon status  # Check status
```

### Configuration
```bash
mindctl config setup     # Configure AI API
mindctl config show      # View current config
mindctl config companion # Customize companion
```

### Crisis Support
```bash
mindctl crisis help    # Crisis helplines
mindctl crisis plan    # Safety plan
mindctl crisis ground  # Quick grounding
mindctl crisis breathe # Crisis breathing
```

## Data Collected

MindLint aggregates the following metrics (never raw code):

| Metric | Description |
|--------|-------------|
| `stability` | Cognitive stability score (0-100) |
| `error_rate` | Proportion of actions that were corrections |
| `complexity_index` | Code complexity trend |
| `typing_cadence_variance` | Normalized keystroke variability |
| `file_switches` | Files opened per minute |
| `session_duration` | Total session length in minutes |

## AI Insights

MindLint uses Large Language Models to generate insights from your telemetry data. The system includes carefully designed prompts for:

- Session analysis and summaries
- Weekly narrative reports
- Behavioral pattern clustering
- Recovery strategy suggestions
- Cognitive weather forecasting
- Micro-nudges for strain prevention

**Privacy Note**: MindLint never stores or analyzes raw code. All insights are based on aggregated, anonymized behavioral metrics.

## Project Structure

```
Mind_Code/
├── packages/
│   ├── cli/              # Terminal wellness toolkit
│   │   ├── src/
│   │   │   ├── commands/ # All CLI commands
│   │   │   ├── ui/       # Terminal UI components
│   │   │   ├── ai.js    # AI integration
│   │   │   ├── db.js    # Local SQLite DB
│   │   │   └── index.js  # CLI entry point
│   │   └── bin/
│   ├── backend/          # Fastify API server
│   │   └── src/
│   │       ├── db/       # Database layer
│   │       └── services/ # Business logic
│   ├── dashboard/         # React web UI
│   │   └── src/
│   │       └── components/ # UI components
│   └── extension/        # VS Code extension
│       └── src/          # TypeScript source
├── docker-compose.yml
├── .env.example
└── package.json
```

## License

MIT

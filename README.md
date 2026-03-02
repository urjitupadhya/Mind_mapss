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

The `mindctl` CLI provides a terminal interface for interacting with MindLint:

```bash
# Start an interactive session
npm run cli

# View help
npm run cli -- --help
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

## License

MIT

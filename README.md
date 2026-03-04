# MindLint - Cognitive Weather System for Developers

<p align="center">
  <strong>Observability for your brain, not your code.</strong>
</p>

---

## 🚀 Live Demo & Installation

### 🌐 Cloud Dashboard
Experience the full cognitive analytics suite live on Render:
**[https://mind-mapss.onrender.com](https://mind-mapss.onrender.com)**

### 🎬 Product Demo
Watch the MindLint ecosystem in action:
**[Watch on YouTube](https://www.youtube.com/watch?v=xCcwFuubo-o)**

### 💻 Global CLI
MindLint is live on the official npm registry. Install it globally on your machine:
```bash
npm install -g mindctl
```
**Start your first session:**
```bash
mindctl check-in
mindctl stats today
```

### 🧩 VS Code Extension
Connect your editor to the cloud. Install the extension to sync real-time telemetry:
1. Navigate to `packages/extension`
2. Run `npm install && npm run build`
3. Load in VS Code (F5) to see your real-time **Stability Score** in the status bar.

---

## 🔬 Overview

MindLint tracks behavioral cognitive patterns during coding sessions and provides actionable insights to improve focus, reduce burnout, and optimize your workflow. Unlike traditional developer tools that analyze code, MindLint analyzes *you* — your typing patterns, error rates, session stability, and work rhythms.

## ✨ Core Features

- **Real-time Stability Meter** — Live status-bar feedback in VS Code (🟢 Green, 🟡 Yellow, 🔴 Red)
- **Cognitive Weather Forecast** — Predictive AI insights powered by MegaLLM
- **Smart Check-ins** — Interactive terminal-based mood logging with your companion, **Pixel**
- **Burnout Detection** — Deep analysis of Git commit patterns and late-night habits
- **Unified Analytics** — Single cloud-hosted dashboard for all your wellness data
- **Physical Health** — Integrated timers for water, eye breaks, and posture checks

## 🏗️ Architecture

MindLint is built as a high-performance monorepo:

| Package | Role | Tech Stack |
|---------|------|------------|
| `mindctl` (CLI) | Global Wellness Shell | Node.js, Commander, Terminal-Kit |
| `backend` | Unified API & UI Host | Fastify, SQLite, WebSockets |
| `dashboard` | Visual Analytics Hub | React 18, Vite, Tailwind CSS |
| `extension` | Telemetry Collector | TypeScript, VS Code API |

### 🛠️ Local Setup (Monorepo)

```bash
# Clone the repository
git clone https://github.com/urjitupadhya/Mind_mapss.git

# Install all dependencies
npm install

# Build all packages
npm run build
```

---

## 🧪 Deployment (Docker)

The project is optimized for high-performance containerization:

```bash
# Start the full stack (API + Dashboard)
docker-compose up -d
```
The Docker image utilizes a multi-stage build, optimizing for native `better-sqlite3` performance and standardized path handling.

---

## 🛡️ Privacy & Security

MindLint follows a **Privacy-by-Design** philosophy:
- **No Raw Code**: We never read or store your actual source code.
- **Behavioral Only**: Telemetry is strictly metadata (typing cadence, undos, lint frequencies).
- **Local DB**: Your local CLI data stays on your machine (`mindlint.db`).

---

## 📄 License

MIT © 2026 MindLint Team

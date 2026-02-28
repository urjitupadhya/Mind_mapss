# 🧠 mindctl — Your Terminal Wellness OS

> AI-powered mental health toolkit that lives where developers already spend their time — the terminal.

Built for [MINDCODE 2026](https://hackformental.com) — 72 hours to build tools that matter.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)

---

## ⚡ Quick Start

```bash
# Clone & install
git clone https://github.com/your-team/mindctl.git
cd mindctl/packages/cli
npm install

# Run
node bin/mindctl.js

# Or link globally
npm link
mindctl
```

## 🎯 What Is This?

**mindctl** is a comprehensive mental health CLI that combines:

- 🤖 **AI Therapy** — Evidence-based conversations using CBT, DBT, and mindfulness techniques
- 🎭 **Smart Mood Tracking** — Daily check-ins with AI-powered pattern analysis
- 🫁 **Breathing Exercises** — 6 animated techniques (box, 4-7-8, calm, panic, sleep, energize)
- 🧘 **Meditation** — Timer with ASCII mandala, AI-guided sessions, 5-4-3-2-1 grounding
- 📝 **Therapeutic Journaling** — Freeform, gratitude, dream, prompted — with AI analysis
- 🧠 **CBT Thought Records** — Identify cognitive distortions, reframe negative thoughts
- 🔥 **Burnout Detection** — Analyze git commit patterns for burnout risk indicators
- 📊 **Wellness Dashboard** — Sparkline charts, heatmaps, trend analysis
- 🌤️ **Predictive Forecast** — AI-powered mood prediction using weighted behavioral data
- 🔗 **Correlation Engine** — Pearson correlation analysis between sleep, mood, habits, and activity
- 📋 **Weekly AI Reports** — Narrative wellness summaries with weather metaphors
- 🏆 **Gamification** — XP, levels, achievements, streak tracking
- 🐱 **Pixel Companion** — ASCII pet that evolves with your wellness journey (Egg→Dragon)
- 🛡️ **Guardian Daemon** — Background monitoring with smart break reminders
- 💤 **Sleep Tracking** — Log, analyze, get AI-powered sleep hygiene tips
- 🏋️ **Habit Tracker** — Build healthy habits with streaks and AI suggestions
- 💧 **Physical Wellness** — Water, posture, eye breaks, desk stretches, walk timer
- 🚨 **Crisis Support** — Instant helplines, safety plan builder, grounding exercises
- 🔒 **Privacy-First** — All data stored locally with AES-256 encryption

## 📋 Commands

### Core Wellness
| Command | Description |
|---------|-------------|
| `mindctl check-in` | 🎭 AI-guided mood check-in |
| `mindctl breathe` | 🫁 Animated breathing exercises |
| `mindctl meditate` | 🧘 Meditation timer & guided sessions |
| `mindctl meditate ground` | 🌍 5-4-3-2-1 grounding exercise |

### AI-Powered
| Command | Description |
|---------|-------------|
| `mindctl talk` | 💬 Open AI therapy conversation |
| `mindctl talk vent` | 💨 Safe venting space |
| `mindctl talk socratic` | 🔍 Socratic questioning |
| `mindctl talk wisdom` | ✦ AI wisdom quote |
| `mindctl talk challenge` | 🎯 Daily wellness challenge |

### Cognitive Tools
| Command | Description |
|---------|-------------|
| `mindctl think` | 🧠 Full CBT thought record |
| `mindctl think reframe` | 💡 Quick negative thought reframing |
| `mindctl journal write` | 📝 Freeform journaling |
| `mindctl journal gratitude` | 🙏 Gratitude practice |
| `mindctl journal dream` | 🔮 Dream journal with AI analysis |
| `mindctl journal analyze` | 📊 AI pattern analysis |

### Analytics
| Command | Description |
|---------|-------------|
| `mindctl stats today` | 📊 Today's wellness snapshot |
| `mindctl stats week` | 📈 Weekly dashboard |
| `mindctl stats month` | 📅 Monthly overview with heatmap |
| `mindctl stats report` | 🤖 AI-generated weekly narrative |
| `mindctl burnout` | 🔥 Git burnout risk analysis |
| `mindctl forecast` | 🌤️ Predictive mood forecast for tomorrow |
| `mindctl insights` | 🔗 Behavioral correlation analysis |
| `mindctl report` | 📋 AI weekly wellness report |

### Healthy Habits
| Command | Description |
|---------|-------------|
| `mindctl habit add` | ➕ Create a new habit |
| `mindctl habit check` | ✅ Check off daily habits |
| `mindctl sleep log` | 💤 Log last night's sleep |
| `mindctl water` | 💧 Log water intake |
| `mindctl stretch` | 💪 Guided desk stretches |
| `mindctl eyes` | 👁 20-20-20 eye break |
| `mindctl posture` | 🧍 Posture check |
| `mindctl walk` | 🚶 Walk timer |

### System
| Command | Description |
|---------|-------------|
| `mindctl daemon start` | 🛡️ Start background guardian |
| `mindctl crisis` | 🚨 Crisis resources & helplines |
| `mindctl crisis plan` | 📋 Safety plan builder |
| `mindctl config setup` | ⚙️ Configure MegaLLM API |

## 🤖 AI Integration (MegaLLM)

mindctl uses MegaLLM for intelligent features. Configure with:

```bash
mindctl config setup
```

**AI-powered features:**
- Therapy conversations (CBT, DBT, motivational interviewing)
- Mood analysis and pattern detection
- Journal reflection and insight extraction
- Cognitive distortion identification
- Burnout risk assessment
- Sleep coaching
- Personalized meditation scripts
- Daily challenges and wisdom
- Weekly wellness narratives
- **Predictive mood forecasting** (weighted algorithm + AI)
- **Behavioral correlation analysis** (Pearson r + significance testing)
- **Weekly narrative reports** (weather-metaphor storytelling)

**Safety guardrails:**
- Crisis detection with automatic helpline display
- Never diagnoses medical conditions
- Reminds users it's not a replacement for professional therapy
- Warm, validating, non-judgmental tone

All features work offline with intelligent fallback responses.

## 🐱 Meet Pixel

Your terminal companion evolves with your wellness journey:

```
Lv 1-4:   🥚 Egg      — Just starting
Lv 5-14:  🐱 Kitten   — Building habits
Lv 15-29: 😸 Cat      — Consistent practice
Lv 30-49: 🦁 Lion     — Wellness warrior
Lv 50+:   🐉 Dragon   — Legendary
```

Pixel reacts to your activities, gets sad when you're away, and celebrates your milestones!

## 🏆 Achievements

- 🏅 **First Breath** — Complete first breathing exercise
- 🏅 **Week Warrior** — 7-day streak
- 🏅 **Thought Detective** — First CBT thought record
- 🏅 **Vulnerability** — Write 20 journal entries
- 🏅 **Zen Master** — 10 meditation sessions
- 🏅 **Centurion** — 100 total sessions
- ...and many more!

## 🔒 Privacy

- **100% local** — All data stored in `~/.mindctl/mindctl.db`
- **No cloud** — No telemetry, no tracking, no data sharing
- **Encrypted journals** — AES-256-GCM encryption
- **Your data** — Export anytime, delete anytime

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **CLI Framework:** Commander.js
- **Database:** better-sqlite3
- **AI:** MegaLLM API (OpenAI-compatible)
- **UI:** Chalk, Gradient-string, Boxen, Ora, Inquirer
- **Privacy:** AES-256-GCM encryption

## 📁 Project Structure

```
packages/cli/
├── bin/mindctl.js           # Entry point
├── src/
│   ├── index.js             # CLI command registration
│   ├── ai.js                # MegaLLM AI engine
│   ├── db.js                # SQLite database layer
│   ├── companion.js         # Pixel companion system
│   ├── commands/
│   │   ├── checkin.js       # Mood check-in
│   │   ├── breathe.js       # Breathing exercises
│   │   ├── journal.js       # Journaling system
│   │   ├── think.js         # CBT thought records
│   │   ├── talk.js          # AI therapy chat
│   │   ├── burnout.js       # Git burnout analysis
│   │   ├── stats.js         # Analytics dashboard
│   │   ├── meditate.js      # Meditation & grounding
│   │   ├── crisis.js        # Crisis support
│   │   ├── sleep.js         # Sleep tracking
│   │   ├── habit.js         # Habit tracker
│   │   ├── wellness.js      # Physical wellness
│   │   ├── daemon.js        # Background guardian
│   │   ├── config.js        # Configuration
│   │   ├── forecast.js      # Predictive mood forecast
│   │   ├── insights.js      # Correlation engine
│   │   └── report.js        # Weekly AI report
│   └── ui/
│       ├── theme.js         # Colors, gradients, charts
│       ├── animations.js    # Terminal animations
│       └── banner.js        # ASCII art & help
└── package.json
```

## 🏅 MINDCODE 2026 Tracks Covered

| Track | Coverage |
|-------|----------|
| **Track 1** — Pattern Archaeologists | Git burnout detection, typing patterns |
| **Track 2** — Conversation Architects | AI therapy, CBT, Socratic questioning |
| **Track 3** — Interface Alchemists | Mood-reactive terminal, animations, companion |
| **Track 5** — Quantified Self | Sleep, mood, habits — all correlated by AI |
| **Track 6** — Wildcard | It's a CLI! With an evolving pet! That does therapy! |

## 👥 Team

Built with ❤️ for MINDCODE 2026.

## 📄 License

MIT — See [LICENSE](./LICENSE) for details.

---

*"The mental health crisis won't wait. Neither will we."*

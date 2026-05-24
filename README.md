# 🔭 InfraWatch-Monitor

> Real-time infrastructure monitoring with AI-powered anomaly detection, predictive alerts, and unified health dashboards — powered by MiMo V2.5

## Why This Exists

Infrastructure monitoring has traditionally been a reactive discipline — you set static thresholds, they fire constantly, alert fatigue sets in, and when a real incident hits, the on-call engineer misses the signal buried under a mountain of false positives. CPU spikes to 80% every night during backups. Memory slowly creeps up over weeks. Network latency has seasonal patterns. Static thresholds understand none of this.

InfraWatch-Monitor reimagines infrastructure observability with AI at its core. MiMo V2.5 analyzes your metrics streams to learn normal behavioral patterns for each service, host, and metric — then alerts only when something genuinely deviates from the expected baseline. It distinguishes between a CPU spike during a known batch job and the same spike during peak traffic hours, because context matters.

The dashboard unifies server health, network metrics, and service status into a single pane of glass designed for both quick triage and deep investigation. Whether you're running a handful of servers or managing a fleet of hundreds, InfraWatch gives you the situational awareness to stay ahead of incidents rather than chasing them.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     InfraWatch-Monitor Pipeline                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │              │    │              │    │              │      │
│  │   Metrics    │───▶│  Collector   │───▶│  Analyzer    │      │
│  │   Sources    │    │   Agent      │    │   Engine     │      │
│  │              │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│                                                 │              │
│                          ┌──────────────────────┤              │
│                          │                      │              │
│                          ▼                      ▼              │
│                   ┌──────────────┐    ┌──────────────┐        │
│                   │              │    │              │        │
│                   │  Dashboard   │    │   Alerts     │        │
│                   │   Renderer   │    │   Engine     │        │
│                   │              │    │              │        │
│                   └──────────────┘    └──────────────┘        │
│                                                                 │
│  Sources: CPU · Memory · Disk · Network · Services              │
│  Output: Health Dashboard + Predictive Alert Feed               │
└─────────────────────────────────────────────────────────────────┘
```

## Token Consumption Model

| Pipeline Stage     | Tokens per Run | Description                                         |
|--------------------|----------------|-----------------------------------------------------|
| 📡 Collector Agent  | 50K            | Gather metrics from hosts, normalize data formats   |
| 🧠 Analyzer Engine  | 300K           | Anomaly detection, baseline learning, trend analysis |
| 📊 Dashboard Render | 100K           | Generate visualizations, gauges, and health cards    |
| **Total**          | **450K**       | End-to-end monitoring cycle                          |

## Features

- **Server Health Cards** — Real-time CPU, memory, and disk gauges for every monitored host
- **Intelligent Alerts** — AI-driven anomaly detection replaces static threshold spam
- **Network Metrics** — Live bandwidth, latency, and connection monitoring with trend analysis
- **Service Status Grid** — Up/down/degraded status for all monitored services at a glance
- **Predictive Warning** — Detects slow-burn issues like memory leaks before they trigger incidents
- **Alert Severity Levels** — Color-coded critical, warning, and info alerts with timestamps
- **Uptime Tracking** — SLA-based uptime percentages with rolling window calculations
- **Ops Dashboard Theme** — Professional dark-mode interface built for NOC screens

## Tech Stack

- **Frontend** — Vanilla HTML5 / CSS3 / JavaScript (ES6+)
- **Styling** — Custom ops dashboard CSS with SVG gauges and CSS animations
- **Logic** — Client-side metrics simulation, gauge rendering, and alert logic
- **AI Engine** — MiMo V2.5 by Nous Research
- **Deployment** — Static files, works on any modern browser or NOC display

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nousresearch/InfraWatch-Monitor.git
cd InfraWatch-Monitor

# Launch directly
open index.html

# Or serve on a network-accessible port for NOC displays
python3 -m http.server 8080
# Visit http://localhost:8080
```

## Project Structure

```
InfraWatch-Monitor/
├── index.html          # Dashboard layout with server cards & alert panel
├── style.css           # Ops dashboard theme with gauge & chart styles
├── app.js              # Metrics collection, analysis, & alert logic
└── README.md           # This file
```

---

> Built with MiMo V2.5 — [Nous Research](https://nousresearch.com)

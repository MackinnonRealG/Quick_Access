# Quick_Access

<!-- HQ:META
id: Quick_Access
name: Quick_Access
status: working
completion: 90
health: amber
category: Personal Tooling
stack: Electron 33, Node.js, HTML/CSS/JS (vanilla), electron-builder 25
entry: main.js
run: npm install && npm start
github: https://github.com/MackinnonRealG/Quick_Access
started: 2026-07
last_verified: 2026-07-13
connections: Higgsfield_AI, claude-usage-monitor
value: One-click launcher + live status for every local HQ project — the front door to the HQ
summary: Always-on-top macOS widget that lists local projects with live status and opens or starts them with one click.
-->

> 🟡 **WORKING** · **90% complete** · health amber · last verified 2026-07-13
> Always-on-top macOS widget that lists local projects with live status and opens or starts them with one click.

## What it is
Quick_Access is a small always-on-top desktop widget for macOS, built with Electron, that acts as the launcher and status board for local projects. It pings each project's URL every 5 seconds (or checks a process via `pgrep` for Mac-app projects), shows a live status dot/badge, and lets you open a running project in the browser or auto-start a stopped one with a single click. Projects are stored in a `projects.json` registry that is hot-reloaded on save, and can be added/edited through an in-app form with a native folder picker that auto-detects Node and native-app start commands. It is effectively the front door to the Artificial Intelligence Headquarters.

## Status & completion — 90%
**Works today:**
- Live status dots/badges (running / stopped / starting / no-status) polled every 5s.
- One-click open of running web projects; click-to-start of stopped ones (polls the URL up to 60s, then opens it).
- Both "web" projects (URL health check) and "app" projects (process check via `pgrep`, start/stop scripts).
- Add / edit / remove projects; native Finder picker with auto-detection (Vite/Next/CRA ports, `npm run dev`/`start`, native `start`/`stop` scripts + Swift binary name).
- Start-all / stop-all, pin toggle, window bounds persistence, off-screen recovery, single-instance lock, and login-item auto-launch when packaged.
- Builds into a real macOS `.app` (`npm run dist` → `dist/mac-arm64/Quick_Access.app`, present in the tree).

**Missing / not working:**
- No automated tests (it is a GUI Electron app; none are expected but none exist).
- Auto-start / stop-by-port rely on local shell tools (`spawn`, `lsof`, `pgrep`, `pkill`) and are macOS-oriented.
- `projects.json` registry currently holds a single entry (Creator HQ → Higgsfield).

**Why 90%:** Feature-complete against its stated scope, it runs, it is packaged into a `.app` with login-item auto-launch, and every claim in the original README was verified against the code (status-ping semantics, stop-button behavior, remove-never-deletes, hot-reload via `fs.watchFile`). Held below 95 only by the absence of tests.

**Health amber:** It clearly works and is in active daily use, but nearly the entire current state is uncommitted — 8 tracked files are modified (`main.js`, `preload.js`, all of `renderer/`, `package.json`) and the `Start`/`Stop .command` launchers plus `dist/` are untracked, against just 3 initial commits from 2026-07-02. The working tree therefore diverges substantially from the GitHub remote.

## Tech stack
Electron ^33, Node.js, vanilla HTML/CSS/JS renderer, `electron-builder` ^25 (mac `dir` target). Secure IPC via `contextBridge`/`preload.js` (contextIsolation on, nodeIntegration off). Uses Node `http`/`https`, `child_process` (`spawn`/`execFile`), and macOS CLIs (`pgrep`, `pkill`, `lsof`, `osascript`, `open`).

## How to run
```
npm install
npm start        # runs from source via electron .

# build the installable macOS app bundle:
npm run dist     # → dist/mac-arm64/Quick_Access.app

# or, without a terminal: double-click "Start Quick_Access.command"
```

## Project structure
```
main.js                    Electron main process: window, health checks, start/stop, IPC
preload.js                 Secure contextBridge exposing api.* to the renderer
renderer/index.html        Widget markup (titlebar actions, list, add/edit form)
renderer/app.js            UI logic: render, status polling, start/stop, form handling
renderer/style.css         Widget styling
projects.json              Project registry (hot-reloaded); 1 entry (Creator HQ / Higgsfield)
package.json               Scripts (start, dist) + electron-builder config
Start/Stop Quick_Access.command   Double-click launch/quit helpers (untracked)
dist/mac-arm64/            Built Quick_Access.app (electron-builder output, untracked)
```

## Connections
- **Higgsfield_AI** — the sole registered project in `projects.json` ("Creator HQ", `http://localhost:8787`, path `/Users/connorsandford/Desktop/Higgsfield_AI`, started via `./studio/run.sh`); Quick_Access starts, monitors, and opens it.
- **claude-usage-monitor** — sibling Personal Tooling widget; Quick_Access's "app"-type support (start/stop scripts + `processName` = `ClaudeMonitor`) is exactly the shape needed to register and manage it, though it is not currently in the registry.
- Within the HQ, Quick_Access is the launcher/dashboard hub — any local project can be added as a web or app entry.

## Log
- 2026-07-13 — HQ README created; status assessed at 90%.

## Original project notes

# Quick_Access

A small always-on-top desktop widget (macOS) that lists all your local
projects, shows which ones are currently running, and opens the live page in
your browser with one click. Built with Electron.

## Features

- 📌 **Always on top** — floats above other windows (toggle with the pin button)
- ↔️ **Fully resizable & draggable** — remembers its size and position
- 🟢 **Live status dots** — green = running, grey = stopped, orange = starting
  (each project's URL is pinged every 5 seconds)
- 🖱️ **One-click open** — click a running project and its live page opens in
  your default browser; close the tab anytime, the project keeps running
- ▶️ **Auto-start** — click a *stopped* project and Quick_Access runs its start
  command, waits until the page responds, then opens it
- ➕ **Easy to add projects** — via the + button or by editing `projects.json`
  (hot-reloaded on save)

## Getting started

```bash
git clone https://github.com/MackinnonRealG/Quick_Access.git
cd Quick_Access
npm install
npm start
```

## Adding your projects

Click **+** in the app, or edit `projects.json`:

```json
{
  "projects": [
    {
      "name": "My Shop",
      "url": "http://localhost:3000",
      "path": "/Users/you/Projects/my-shop",
      "command": "npm run dev"
    }
  ]
}
```

| Field     | Required | Purpose                                              |
| --------- | -------- | ---------------------------------------------------- |
| `name`    | yes      | Display name on the card                             |
| `url`     | yes      | Where the project runs, e.g. `http://localhost:5173` |
| `path`    | no       | Project folder — enables auto-start & "folder" button |
| `command` | no       | Start command run inside `path`, e.g. `npm run dev`  |

## How it works

- **Status check:** any HTTP response from the URL (even a 404) counts as
  "running" — only a refused connection or timeout counts as "stopped".
- **Stop button:** appears on running projects, but can only stop dev servers
  that were started *from* Quick_Access (it doesn't touch servers you started
  in your own terminal).
- **Remove (×):** removes a project from the list only — never deletes files.

## Project structure

```
main.js            Electron main process: window, health checks, start/stop
preload.js         Secure bridge between the UI and the main process
renderer/          The widget UI (HTML/CSS/JS)
projects.json      Your project registry — the only file you need to edit
```

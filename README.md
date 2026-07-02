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

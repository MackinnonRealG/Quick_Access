# Quick Overview

A small always-on-top window that lists all your projects, shows which ones are
currently running, and opens the live page in your browser with one click.

## Run it

```bash
cd "/Users/connorsandford/Desktop/Quick_ Overvie"
npm install     # first time only
npm start
```

## Add a project

Two ways:

1. Click the **+** button in the app and fill in the form.
2. Edit `projects.json` directly — the app reloads it automatically:

```json
{
  "projects": [
    {
      "name": "My Shop",
      "url": "http://localhost:3000",
      "path": "/Users/connorsandford/Projects/my-shop",
      "command": "npm run dev"
    }
  ]
}
```

- `name` and `url` are required.
- `path` + `command` are optional — with them, clicking a **stopped** project
  starts it automatically and opens the page once it's up.

## How it works

- **Green dot** = the URL responds (project is running). Click the card to open
  it in your browser. Close the browser tab whenever you like — the project
  keeps running.
- **Grey dot** = nothing is listening on that URL. Clicking runs the project's
  `command` in its `path`, waits until the URL responds, then opens it.
- **Orange pulsing dot** = starting up.
- **📌 pin button** toggles always-on-top.
- **stop** only appears for projects that were started from this app.
- The window remembers its size and position between launches.

## Start automatically at login (optional)

System Settings → General → Login Items → **+** → add a small launcher, or run
`npm start` from this folder whenever you want the dashboard up.

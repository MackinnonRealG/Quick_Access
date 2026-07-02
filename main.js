const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const BOUNDS_FILE = () => path.join(app.getPath('userData'), 'window-bounds.json');

let win = null;
// pids of dev servers we started ourselves, keyed by project name
const startedProcesses = new Map();

function loadProjects() {
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (err) {
    return [];
  }
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
}

function loadBounds() {
  try {
    return JSON.parse(fs.readFileSync(BOUNDS_FILE(), 'utf8'));
  } catch {
    return { width: 380, height: 540 };
  }
}

// Ping a project's URL. Any HTTP response (even 404) means the server is up;
// only a connection failure/timeout means it is down.
function checkUrl(url) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, { timeout: 2000 }, (res) => {
        res.resume();
        done(true);
      });
      req.on('timeout', () => { req.destroy(); done(false); });
      req.on('error', () => done(false));
    } catch {
      done(false);
    }
  });
}

function createWindow() {
  const bounds = loadBounds();
  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 280,
    minHeight: 300,
    alwaysOnTop: true,
    title: 'Quick_Access',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 'floating' keeps it above normal windows but below OS-critical panels
  win.setAlwaysOnTop(true, 'floating');
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  const saveBounds = () => {
    try { fs.writeFileSync(BOUNDS_FILE(), JSON.stringify(win.getBounds())); } catch {}
  };
  win.on('resize', saveBounds);
  win.on('move', saveBounds);
}

app.whenReady().then(() => {
  createWindow();

  // Reload the list in the UI whenever projects.json is edited by hand
  fs.watchFile(PROJECTS_FILE, { interval: 1000 }, () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('projects-updated', loadProjects());
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

// ---------- IPC handlers ----------

ipcMain.handle('get-projects', () => loadProjects());

ipcMain.handle('check-status', async (_e, url) => checkUrl(url));

ipcMain.handle('open-url', (_e, url) => shell.openExternal(url));

ipcMain.handle('reveal-folder', (_e, folder) => {
  if (folder) shell.openPath(folder);
});

ipcMain.handle('set-pinned', (_e, pinned) => {
  if (win) win.setAlwaysOnTop(pinned, 'floating');
  return pinned;
});

ipcMain.handle('add-project', (_e, project) => {
  const projects = loadProjects();
  projects.push(project);
  saveProjects(projects);
  return projects;
});

ipcMain.handle('remove-project', (_e, name) => {
  const projects = loadProjects().filter((p) => p.name !== name);
  saveProjects(projects);
  return projects;
});

// Start a stopped project: run its command in its folder, wait until the
// URL responds, then open it in the browser.
ipcMain.handle('start-project', async (_e, name) => {
  const project = loadProjects().find((p) => p.name === name);
  if (!project || !project.command || !project.path) {
    return { ok: false, error: 'No start command or folder configured for this project.' };
  }
  if (startedProcesses.has(name)) {
    return { ok: false, error: 'Already starting/started from here.' };
  }

  const child = spawn(project.command, {
    cwd: project.path,
    shell: true,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  startedProcesses.set(name, child.pid);
  child.on('exit', () => startedProcesses.delete(name));

  // Poll the URL for up to 60s
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkUrl(project.url)) {
      shell.openExternal(project.url);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Started the command but the URL never came up (waited 60s).' };
});

ipcMain.handle('stop-project', (_e, name) => {
  const pid = startedProcesses.get(name);
  if (!pid) return { ok: false, error: 'This project was not started from Quick Overview, so it cannot be stopped from here.' };
  try {
    // negative pid kills the whole process group (the shell + the dev server)
    process.kill(-pid, 'SIGTERM');
  } catch {}
  startedProcesses.delete(name);
  return { ok: true };
});

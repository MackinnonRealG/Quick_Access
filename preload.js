const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  checkStatus: (url) => ipcRenderer.invoke('check-status', url),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  revealFolder: (folder) => ipcRenderer.invoke('reveal-folder', folder),
  setPinned: (pinned) => ipcRenderer.invoke('set-pinned', pinned),
  addProject: (project) => ipcRenderer.invoke('add-project', project),
  removeProject: (name) => ipcRenderer.invoke('remove-project', name),
  startProject: (name) => ipcRenderer.invoke('start-project', name),
  stopProject: (name) => ipcRenderer.invoke('stop-project', name),
  onProjectsUpdated: (cb) => ipcRenderer.on('projects-updated', (_e, projects) => cb(projects)),
});

const listEl = document.getElementById('project-list');
const emptyEl = document.getElementById('empty-state');
const statusEl = document.getElementById('status-text');
const addForm = document.getElementById('add-form');

let projects = [];
// name -> 'running' | 'stopped' | 'starting'
const statuses = new Map();

function setStatus(msg) {
  statusEl.textContent = msg;
  if (msg) setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 6000);
}

function render() {
  listEl.innerHTML = '';
  emptyEl.classList.toggle('hidden', projects.length > 0);

  for (const p of projects) {
    const state = statuses.get(p.name) || 'stopped';

    const card = document.createElement('div');
    card.className = 'card';

    const dot = document.createElement('span');
    dot.className = `dot ${state}`;

    const info = document.createElement('div');
    info.className = 'card-info';
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = p.name;
    const url = document.createElement('div');
    url.className = 'card-url';
    url.textContent = p.url;
    info.append(name, url);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    if (p.path) {
      const folderBtn = document.createElement('button');
      folderBtn.className = 'mini-btn';
      folderBtn.textContent = 'folder';
      folderBtn.title = 'Open project folder';
      folderBtn.onclick = (e) => { e.stopPropagation(); window.api.revealFolder(p.path); };
      actions.append(folderBtn);
    }

    if (state === 'running') {
      const stopBtn = document.createElement('button');
      stopBtn.className = 'mini-btn danger';
      stopBtn.textContent = 'stop';
      stopBtn.title = 'Stop (only if started from here)';
      stopBtn.onclick = async (e) => {
        e.stopPropagation();
        const res = await window.api.stopProject(p.name);
        setStatus(res.ok ? `Stopped ${p.name}` : res.error);
      };
      actions.append(stopBtn);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'mini-btn danger';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove from list';
    removeBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`Remove "${p.name}" from the list? (Does not delete any files.)`)) {
        projects = await window.api.removeProject(p.name);
        render();
      }
    };
    actions.append(removeBtn);

    card.append(dot, info, actions);

    // The main interaction: click the card to open the live project.
    card.onclick = async () => {
      if (statuses.get(p.name) === 'running') {
        window.api.openUrl(p.url);
      } else if (p.command && p.path) {
        statuses.set(p.name, 'starting');
        render();
        setStatus(`Starting ${p.name}…`);
        const res = await window.api.startProject(p.name);
        if (!res.ok) {
          statuses.set(p.name, 'stopped');
          setStatus(res.error);
        } else {
          statuses.set(p.name, 'running');
          setStatus(`${p.name} is up`);
        }
        render();
      } else {
        // No start command configured — open the URL anyway so the
        // browser at least shows what's wrong.
        window.api.openUrl(p.url);
      }
    };

    listEl.append(card);
  }
}

async function refreshStatuses() {
  await Promise.all(projects.map(async (p) => {
    if (statuses.get(p.name) === 'starting') return; // don't fight the start poll
    const up = await window.api.checkStatus(p.url);
    statuses.set(p.name, up ? 'running' : 'stopped');
  }));
  render();
}

// ---------- Add-project form ----------

document.getElementById('add-btn').onclick = () => addForm.classList.toggle('hidden');
document.getElementById('f-cancel').onclick = () => addForm.classList.add('hidden');
document.getElementById('f-save').onclick = async () => {
  const name = document.getElementById('f-name').value.trim();
  const url = document.getElementById('f-url').value.trim();
  if (!name || !url) { setStatus('Name and URL are required.'); return; }
  projects = await window.api.addProject({
    name,
    url,
    path: document.getElementById('f-path').value.trim() || undefined,
    command: document.getElementById('f-command').value.trim() || undefined,
  });
  addForm.classList.add('hidden');
  for (const el of addForm.querySelectorAll('input')) el.value = '';
  refreshStatuses();
};

// ---------- Pin toggle ----------

let pinned = true;
document.getElementById('pin-btn').onclick = async (e) => {
  pinned = !pinned;
  await window.api.setPinned(pinned);
  e.currentTarget.classList.toggle('pinned', pinned);
  setStatus(pinned ? 'Window pinned on top' : 'Window unpinned');
};

// ---------- Boot ----------

window.api.onProjectsUpdated((updated) => {
  projects = updated;
  refreshStatuses();
});

(async () => {
  projects = await window.api.getProjects();
  render();
  refreshStatuses();
  setInterval(refreshStatuses, 5000);
})();

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

console.log('=== REVO World Builder v0.1.0 ===');
console.log('[MAIN] Electron:', process.versions.electron, '| Node:', process.version);

const SAVES_ROOT = path.join(app.getAppPath(), 'world_data');
if (!fs.existsSync(SAVES_ROOT)) fs.mkdirSync(SAVES_ROOT, { recursive: true });
console.log('[MAIN] saves:', SAVES_ROOT);

// ── Helpers ────────────────────────────────────────────────────────────────
function timestamp() {
  return new Date().toISOString().replace('T', ' ').replace(/:/g, '-').substring(0, 19);
}

function nextVersionDir() {
  const existing = fs.existsSync(SAVES_ROOT)
    ? fs.readdirSync(SAVES_ROOT, { withFileTypes: true })
        .filter(d => d.isDirectory() && /^v\d+$/.test(d.name))
        .map(d => parseInt(d.name.slice(1), 10))
        .sort((a, b) => b - a)
    : [];
  const next = (existing[0] || 0) + 1;
  return path.join(SAVES_ROOT, `v${String(next).padStart(3, '0')}`);
}

function writeSaveFiles(versionDir, worldData) {
  ['kingdoms', 'counties', 'baronies', 'hexmaps'].forEach(s =>
    fs.mkdirSync(path.join(versionDir, s), { recursive: true })
  );
  const index = { meta: worldData.meta, kingdoms: {}, counties: {} };

  for (const kid in worldData.kingdoms) {
    const k = worldData.kingdoms[kid];
    index.kingdoms[kid] = { id: k.id, name: k.name, color: k.color, counties: k.counties || [] };
    fs.writeFileSync(path.join(versionDir, 'kingdoms', `${kid}.json`), JSON.stringify(k, null, 2));
  }

  for (const colorKey in worldData.counties) {
    const c = worldData.counties[colorKey];
    index.counties[colorKey] = {
      id: c.id, name: c.name, type: c.type, colorKey: c.colorKey,
      r: c.r, g: c.g, b: c.b, kingdomId: c.kingdomId, baronyCount: c.baronyCount,
      baronies: (c.baronies || []).map(b => b ? { id: b.id, name: b.name, index: b.index } : null),
    };
    fs.writeFileSync(path.join(versionDir, 'counties', `${c.id}.json`), JSON.stringify(c, null, 2));

    (c.baronies || []).forEach((b, i) => {
      if (!b) return;
      const fiefId = colorKey + '_b' + i;
      const hexmap = (worldData.hexmaps || {})[fiefId] || [];
      const doc    = { ...b, fiefId, hexmap, hexCols: worldData.meta.hexCols || 16, hexRows: worldData.meta.hexRows || 12 };
      fs.writeFileSync(path.join(versionDir, 'baronies', `${b.id}.json`), JSON.stringify(doc, null, 2));
      if (hexmap.length) {
        const safeId = fiefId.replace(/,/g, 'x');
        fs.writeFileSync(path.join(versionDir, 'hexmaps', `${safeId}.json`), JSON.stringify({ fiefId, tiles: hexmap }, null, 2));
      }
    });
  }

  fs.writeFileSync(path.join(versionDir, 'world.json'), JSON.stringify(index, null, 2));
}

function readSaveFiles(versionDir) {
  const worldPath = path.join(versionDir, 'world.json');
  if (!fs.existsSync(worldPath)) throw new Error('world.json nao encontrado em ' + versionDir);
  const index = JSON.parse(fs.readFileSync(worldPath, 'utf8'));

  const kingdoms = {};
  for (const kid in index.kingdoms) {
    const p = path.join(versionDir, 'kingdoms', `${kid}.json`);
    kingdoms[kid] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : index.kingdoms[kid];
  }

  const counties = {};
  for (const colorKey in index.counties) {
    const ref = index.counties[colorKey];
    const p   = path.join(versionDir, 'counties', `${ref.id}.json`);
    counties[colorKey] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : ref;
  }

  const hexmaps = {};
  const hxDir = path.join(versionDir, 'hexmaps');
  if (fs.existsSync(hxDir)) {
    fs.readdirSync(hxDir).filter(f => f.endsWith('.json')).forEach(f => {
      const doc = JSON.parse(fs.readFileSync(path.join(hxDir, f), 'utf8'));
      if (doc.fiefId) hexmaps[doc.fiefId] = doc.tiles;
    });
  }

  return { meta: index.meta, kingdoms, counties, hexmaps };
}

function listSaves() {
  if (!fs.existsSync(SAVES_ROOT)) return [];
  return fs.readdirSync(SAVES_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^v\d+$/.test(d.name))
    .map(d => {
      const wf = path.join(SAVES_ROOT, d.name, 'world.json');
      if (!fs.existsSync(wf)) return null;
      try {
        const w    = JSON.parse(fs.readFileSync(wf, 'utf8'));
        const stat = fs.statSync(wf);
        return {
          version:   d.name,
          worldName: w.meta?.worldName || '(sem nome)',
          savedAt:   w.meta?.savedAt   || stat.mtime.toISOString(),
          kingdoms:  Object.keys(w.kingdoms || {}).length,
          counties:  Object.keys(w.counties || {}).length,
        };
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => b.version.localeCompare(a.version));
}

// ── Windows ────────────────────────────────────────────────────────────────
let mainWindow  = null;
let debugWindow = null;

function sendToDebug(type, msg) {
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.webContents.send('debug-message', type, msg);
  }
  // Also log to CMD
  if (type === 'err') console.log('[ERR]', msg);
}

function openDebugWindow() {
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.focus();
    return;
  }
  debugWindow = new BrowserWindow({
    width: 800, height: 520,
    title: 'REVO Debug Console',
    backgroundColor: '#0a0a0a',
    parent: mainWindow,
    webPreferences: {
      preload:          path.join(__dirname, 'preload-debug.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });
  debugWindow.loadFile('debug.html');
  debugWindow.on('closed', () => { debugWindow = null; });
  // Remove default menu
  debugWindow.setMenu(null);
  console.log('[MAIN] Debug console aberto');
}

function closeDebugWindow() {
  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.close();
    debugWindow = null;
  }
  console.log('[MAIN] Debug console fechado');
}

function createWindow() {
  console.log('[MAIN] createWindow()');
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: 'REVO World Builder', backgroundColor: '#1a1510',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  // Pipe ALL renderer console messages to debug window
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const types = ['log','warn','err','log'];
    const type  = types[level] || 'log';
    const src   = sourceId ? sourceId.split('/').pop() + ':' + line : '';
    sendToDebug(type, message + (src ? '  [' + src + ']' : ''));
    if (level >= 2) console.log('[ERR]', message);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[MAIN] pagina carregada');
    sendToDebug('info', 'Pagina carregada com sucesso');
  });
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.log('[MAIN] ERRO ao carregar:', code, desc);
    sendToDebug('err', 'ERRO ao carregar pagina: ' + desc);
  });

  // F12 toggles debug console window
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      if (debugWindow && !debugWindow.isDestroyed()) {
        closeDebugWindow();
      } else {
        openDebugWindow();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (debugWindow && !debugWindow.isDestroyed()) debugWindow.close();
  });
}

app.whenReady().then(() => {
  console.log('[MAIN] app ready');
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.handle('fs:saveVersion', async (_, worldData) => {
  try {
    const verDir = nextVersionDir();
    worldData.meta.savedAt = timestamp();
    writeSaveFiles(verDir, worldData);
    console.log('[IPC] saveVersion ->', path.basename(verDir));
    return { ok: true, version: path.basename(verDir) };
  } catch (e) {
    console.log('[IPC] saveVersion ERRO:', e.message);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('fs:listSaves', async () => {
  try {
    const saves = listSaves();
    return { ok: true, saves };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('fs:loadVersion', async (_, { version }) => {
  try {
    const data = readSaveFiles(path.join(SAVES_ROOT, version));
    console.log('[IPC] loadVersion ->', version);
    return { ok: true, data, version };
  } catch (e) {
    console.log('[IPC] loadVersion ERRO:', e.message);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('fs:deleteVersion', async (_, { version }) => {
  try {
    const verDir = path.join(SAVES_ROOT, version);
    if (fs.existsSync(verDir)) fs.rmSync(verDir, { recursive: true, force: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('fs:savesRoot', () => SAVES_ROOT);

// Debug eval -- envia codigo ao renderer via IPC, executa la e retorna resultado
// O renderer escuta 'debug:run' e responde com 'debug:result'
const { v4: uuidv4 } = require('crypto');
const pendingEvals = new Map();

ipcMain.handle('debug:eval', async (_, code) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return 'ERROR: janela principal nao disponivel';
  }
  return new Promise((resolve) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const timer = setTimeout(() => {
      pendingEvals.delete(id);
      resolve('ERROR: timeout');
    }, 5000);
    pendingEvals.set(id, { resolve, timer });
    mainWindow.webContents.send('debug:run', id, code);
  });
});

// Renderer sends back the result
ipcMain.on('debug:result', (_, id, result) => {
  const pending = pendingEvals.get(id);
  if (pending) {
    clearTimeout(pending.timer);
    pendingEvals.delete(id);
    pending.resolve(result);
  }
});

import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference so the window is not garbage-collected
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

// ── Automation HTTP server ─────────────────────────────────────────────────
let automationServer: http.Server | null = null;

function startAutomationServer(port: number): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (automationServer) {
      resolve({ success: true });
      return;
    }

    const server = http.createServer((req, res) => {
      // CORS headers so BitFocus Companion (or any HTTP client) can reach us
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method not allowed');
        return;
      }

      const url = req.url || '';
      let trigger: string | null = null;

      if (url.includes('/set-audience'))  trigger = 'setAudience';
      else if (url.includes('/match-start')) trigger = 'matchStart';
      else if (url.includes('/match-end'))   trigger = 'matchEnd';
      else if (url.includes('/post-result')) trigger = 'postResult';

      if (!trigger) {
        res.writeHead(404);
        res.end('Unknown endpoint');
        return;
      }

      // Forward trigger event to the renderer process
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('automation-trigger', trigger);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, trigger }));
    });

    server.listen(port, '0.0.0.0', () => {
      automationServer = server;
      resolve({ success: true });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      const msg = err.code === 'EADDRINUSE'
        ? `Port ${port} is already in use. Choose a different port.`
        : err.message;
      resolve({ success: false, error: msg });
    });
  });
}

function stopAutomationServer(): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    if (!automationServer) {
      resolve({ success: true });
      return;
    }
    automationServer.close(() => {
      automationServer = null;
      resolve({ success: true });
    });
  });
}

// IPC handlers for automation
ipcMain.handle('start-automation-server', (_event, port: number) =>
  startAutomationServer(port)
);
ipcMain.handle('stop-automation-server', () => stopAutomationServer());
ipcMain.handle('get-version', () => app.getVersion());

// ── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 480,
    minHeight: 500,
    title: 'FIRST AutoDJ',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false, // Required for preload script to use require() (Electron 20+ defaults sandbox to true)
    },
    backgroundColor: '#0f172a',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' as const }, { role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About FIRST AutoDJ',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About FIRST AutoDJ',
              message: 'FIRST AutoDJ',
              detail: `Version ${app.getVersion()}\n\nA semi-automatic DJ substitute for FIRST Robotics Competition events.\n\nBuilt with Electron + React.`,
              buttons: ['OK'],
            });
          },
        },
        {
          label: 'View on GitHub',
          click: () => shell.openExternal('https://github.com/pat67/first-autodj'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopAutomationServer();
  if (process.platform !== 'darwin') app.quit();
});

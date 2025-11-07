import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const isDev = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production" || app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBasePath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'dist')
    : join(__dirname, '../app');
}
function getBinaryPath() {
  return app.isPackaged
    ? process.resourcesPath
    : join(__dirname, '../app');
}
function getHTMLPath(file) {
  return join(getBasePath(), file);
}

const store = new Store({ defaults: { assets: [], optimizationReady: false }});

ipcMain.handle('store:get', (_event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (_event, key, value) => {
  if (typeof value !== 'null') {
    store.set(key, value);
  }
  return true;
});

ipcMain.handle('store:delete', (_event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('basePath', () => getBasePath());
ipcMain.handle('binaryPath', () => getBinaryPath());

let mainWindow;

async function createWindow() {
  const iconPath = join(getBasePath(), 'common', 'icons', 'icon-256.png');

  mainWindow = new BrowserWindow({
    width: 1306,
    height: 791,
    resizable: false,
    frame: false,
    icon: iconPath, 
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: isProduction,
      devTools: !isProduction,
    }
  });

  mainWindow.removeMenu();
  const indexScreen = getHTMLPath('index.html');
  
  if (isDev) {
      mainWindow.loadURL("http://localhost:5173");
      if (!isProduction) {
        mainWindow.webContents.openDevTools();
      }
  } else {
    mainWindow.loadFile(indexScreen);
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.center();

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('assets', store.get('assets'));
    mainWindow.webContents.send('investment', store.get('investment'));
  });

  // Disable dev tools keyboard shortcuts in production
  if (isProduction) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Disable F12
      if (input.key === 'F12') {
        event.preventDefault();
      }
      
      // Disable Ctrl+Shift+I (Windows/Linux) and Cmd+Option+I (Mac)
      if ((input.control || input.meta) && input.shift && input.key === 'I') {
        event.preventDefault();
      }
      
      // Disable Ctrl+Shift+J (Windows/Linux) and Cmd+Option+J (Mac) - Console
      if ((input.control || input.meta) && input.shift && input.key === 'J') {
        event.preventDefault();
      }
      
      // Disable Ctrl+U (Windows/Linux) and Cmd+Option+U (Mac) - View Source
      if ((input.control || input.meta) && input.key === 'U') {
        event.preventDefault();
      }
    });
  }
}

app.whenReady().then(createWindow);
ipcMain.on('quit', () => app.quit());

app.on('window-all-closed', () => app.quit());

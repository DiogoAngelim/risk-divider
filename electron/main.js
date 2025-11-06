import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const isDev = process.env.NODE_ENV === "development";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBasePath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'app')
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
      webSecurity: false,
      devTools: !app.isPackaged, 
    }
  });

  mainWindow.removeMenu();
  const profile = store.get('investment');
  const assets = store.get('assets');

  const assetsScreen = getHTMLPath('assets/index.html');
  const indexScreen = getHTMLPath('index.html');
  const portfolioScreen = getHTMLPath('dashboard/index.html');
  
  if (isDev) {
      mainWindow.loadURL("http://localhost:5173");
      mainWindow.webContents.openDevTools();
  } else {
    if (assets && assets.length > 1) {
      mainWindow.loadFile(portfolioScreen);
    } else if (profile && profile.length > 0) {
      mainWindow.loadFile(assetsScreen);
    } else {
      mainWindow.loadFile(indexScreen);
    }
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.center();

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('assets', store.get('assets'));
    mainWindow.webContents.send('investment', store.get('investment'));
  });
}

app.whenReady().then(createWindow);
ipcMain.on('quit', () => app.quit());

app.on('window-all-closed', () => app.quit());

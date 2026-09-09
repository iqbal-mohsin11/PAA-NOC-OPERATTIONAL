/**
 * Electron Main Process for PAA IT Inventory Management Desktop App (.exe)
 */
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'PAA Sentinel - Pakistan Airports Authority IT Inventory',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // Check if express server is running on localhost:3000, otherwise load dist
  const serverUrl = 'http://localhost:3000';
  
  function tryConnect(retries = 10) {
    http.get(serverUrl, (res) => {
      mainWindow.loadURL(serverUrl);
    }).on('error', () => {
      if (retries > 0) {
        setTimeout(() => tryConnect(retries - 1), 1000);
      } else {
        // Fallback to static index.html in dist
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
          mainWindow.loadURL(serverUrl);
        });
      }
    });
  }

  tryConnect();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

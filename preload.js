const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Add any IPC methods here if needed for native features
  // For this app, we are mostly using the web-based API we built
  // but in a real Electron app, you might proxy SQLite calls through here
});

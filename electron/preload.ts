const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (data, defaultPath, exportMode: 'single' | 'all' | false = false, rotation = 0) => 
    ipcRenderer.invoke('save-file', { data, defaultPath, exportMode, rotation }),
  getFilePath: () => ipcRenderer.invoke('get-file-path'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  onLoadInitialFile: (callback) => {
    ipcRenderer.on('load-initial-file', (_event, fileData) => callback(fileData))
  }
})
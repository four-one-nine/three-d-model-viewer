import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: (data: string, defaultPath: string) => 
    ipcRenderer.invoke('save-file', { data, defaultPath }),
  getFilePath: () => ipcRenderer.invoke('get-file-path')
})
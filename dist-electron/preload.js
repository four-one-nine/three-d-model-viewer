import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  saveFile: (data, defaultPath) => ipcRenderer.invoke("save-file", { data, defaultPath }),
  getFilePath: () => ipcRenderer.invoke("get-file-path")
});

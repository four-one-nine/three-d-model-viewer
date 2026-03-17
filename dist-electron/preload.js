const { contextBridge: l, ipcRenderer: e } = require("electron");
l.exposeInMainWorld("electronAPI", {
  openFileDialog: () => e.invoke("open-file-dialog"),
  saveFile: (i, n) => e.invoke("save-file", { data: i, defaultPath: n }),
  getFilePath: () => e.invoke("get-file-path"),
  onLoadInitialFile: (i) => {
    e.on("load-initial-file", (n, o) => i(o));
  }
});

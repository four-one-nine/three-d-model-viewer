const { contextBridge: a, ipcRenderer: e } = require("electron");
a.exposeInMainWorld("electronAPI", {
  openFileDialog: () => e.invoke("open-file-dialog"),
  saveFile: (i, o, n = !1, l = 0) => e.invoke("save-file", { data: i, defaultPath: o, exportMode: n, rotation: l }),
  getFilePath: () => e.invoke("get-file-path"),
  quitApp: () => e.invoke("quit-app"),
  onLoadInitialFile: (i) => {
    e.on("load-initial-file", (o, n) => i(n));
  }
});

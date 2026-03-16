import { app as o, BrowserWindow as d, ipcMain as r, dialog as h } from "electron";
import i from "path";
import m from "fs";
import { fileURLToPath as p } from "url";
const w = p(import.meta.url), f = i.dirname(w);
let e = null;
const u = process.env.NODE_ENV === "development" || !o.isPackaged;
function c() {
  e = new d({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: i.join(f, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    backgroundColor: "#18181B",
    show: !1
  }), e.once("ready-to-show", () => {
    e == null || e.show();
  }), u ? (e.loadURL("http://localhost:5173"), e.webContents.openDevTools()) : e.loadFile(i.join(f, "../dist/index.html"));
}
o.whenReady().then(() => {
  c(), o.on("activate", () => {
    d.getAllWindows().length === 0 && c();
  });
});
o.on("window-all-closed", () => {
  process.platform !== "darwin" && o.quit();
});
r.handle("open-file-dialog", async () => {
  const l = await h.showOpenDialog(e, {
    properties: ["openFile"],
    filters: [
      { name: "3D Models", extensions: ["3mf", "stl", "obj"] }
    ]
  });
  if (l.canceled || l.filePaths.length === 0)
    return null;
  const n = l.filePaths[0], a = m.readFileSync(n), t = i.basename(n), s = i.extname(n).toLowerCase();
  return {
    name: t,
    path: n,
    content: a.toString("base64"),
    extension: s.slice(1)
  };
});
r.handle("save-file", async (l, { data: n, defaultPath: a }) => {
  const t = await h.showSaveDialog(e, {
    defaultPath: a,
    filters: [
      { name: "PNG Image", extensions: ["png"] }
    ]
  });
  if (t.canceled || !t.filePath)
    return null;
  const s = Buffer.from(n, "base64");
  return m.writeFileSync(t.filePath, s), t.filePath;
});
r.handle("get-file-path", async () => null);

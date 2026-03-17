import { app as r, BrowserWindow as w, ipcMain as g, dialog as x } from "electron";
import s from "path";
import i from "fs";
import { fileURLToPath as b } from "url";
console.log("=== MAIN PROCESS STARTING ===");
console.log("process.argv:", process.argv);
const S = b(import.meta.url), p = s.dirname(S);
let l = null;
const u = process.env.NODE_ENV === "development" || !r.isPackaged, y = ["3mf", "stl", "obj"];
let f = "none";
function E() {
  const o = process.argv.slice(u ? 2 : 1);
  return o.includes("-a") || o.includes("--all") ? "all" : o.includes("-e") || o.includes("--export") ? "single" : "none";
}
function P() {
  console.log("getFilePathFromArgs called, argv:", process.argv);
  const o = process.argv.slice(u ? 2 : 1).filter((e) => e !== "." && !e.startsWith("--"));
  console.log("Filtered args:", o);
  for (const e of o)
    if (console.log("Checking arg:", e, "exists:", i.existsSync(e)), i.existsSync(e)) {
      const n = s.extname(e).toLowerCase().slice(1);
      if (console.log("Ext:", n), y.includes(n))
        return e;
    }
  return null;
}
function m() {
  l = new w({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: s.join(p, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    backgroundColor: "#18181B",
    show: !1
  }), l.once("ready-to-show", () => {
    l == null || l.show();
  });
  const o = P();
  if (f = E(), console.log("createWindow: autoExportMode =", f), u)
    console.log("createWindow: isDev mode"), l.loadURL("http://localhost:5173"), l.webContents.openDevTools();
  else {
    console.log("createWindow: production mode");
    const e = s.join(p, "../dist/index.html");
    if (o) {
      console.log("createWindow: have file path");
      const t = { file: Buffer.from(o).toString("base64") };
      f !== "none" && (console.log("createWindow: adding export flag"), t.export = f), console.log("createWindow: loading with query:", t), l.loadFile(e, { query: t });
    } else
      console.log("createWindow: no file path"), l.loadFile(e);
  }
}
r.whenReady().then(() => {
  console.log("=== APP READY ==="), m(), r.on("activate", () => {
    w.getAllWindows().length === 0 && m();
  }), console.log("=== IPC HANDLERS REGISTERED ===");
});
r.on("window-all-closed", () => {
  process.platform !== "darwin" && r.quit();
});
g.handle("open-file-dialog", async () => {
  const o = await x.showOpenDialog(l, {
    properties: ["openFile"],
    filters: [
      { name: "3D Models", extensions: ["3mf", "stl", "obj"] }
    ]
  });
  if (o.canceled || o.filePaths.length === 0)
    return null;
  const e = o.filePaths[0], n = i.readFileSync(e), t = s.basename(e), a = s.extname(e).toLowerCase();
  return {
    name: t,
    path: e,
    content: n.toString("base64"),
    extension: a.slice(1)
  };
});
g.handle("save-file", async (o, { data: e, defaultPath: n, exportMode: t, rotation: a }) => {
  if (console.log("save-file called with exportMode:", t, "rotation:", a), t === "single" || t === "all") {
    const h = Buffer.from(e, "base64");
    if (t === "single")
      return i.writeFileSync(n, h), console.log("Auto-exported to:", n), n;
    if (t === "all") {
      const d = `${n.replace(".png", "")}_rot${a}.png`;
      return i.writeFileSync(d, h), console.log("Auto-exported to:", d), d;
    }
  }
  const c = await x.showSaveDialog(l, {
    defaultPath: n,
    filters: [
      { name: "PNG Image", extensions: ["png"] }
    ]
  });
  if (c.canceled || !c.filePath)
    return null;
  const v = Buffer.from(e, "base64");
  return i.writeFileSync(c.filePath, v), c.filePath;
});
g.handle("get-file-path", async () => {
  console.log("=== get-file-path IPC called ===");
  const o = P();
  if (!o) return null;
  try {
    const e = i.readFileSync(o), n = s.basename(o), t = s.extname(o).toLowerCase();
    return console.log("Loaded file:", n), {
      name: n,
      path: o,
      content: e.toString("base64"),
      extension: t.slice(1)
    };
  } catch (e) {
    return console.error("Failed to load file:", e), null;
  }
});
g.handle("quit-app", () => {
  console.log("Quit requested"), r.quit();
});

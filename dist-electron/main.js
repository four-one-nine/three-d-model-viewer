import { app as a, BrowserWindow as p, ipcMain as f, dialog as u } from "electron";
import s from "path";
import i from "fs";
import { fileURLToPath as w } from "url";
console.log("=== MAIN PROCESS STARTING ===");
console.log("process.argv:", process.argv);
const x = w(import.meta.url), d = s.dirname(x);
let n = null;
const g = process.env.NODE_ENV === "development" || !a.isPackaged, P = ["3mf", "stl", "obj"];
let c = !1;
function v() {
  const o = process.argv.slice(g ? 2 : 1);
  console.log("getAutoExportFlag args:", o);
  const e = o.includes("-e") || o.includes("--export");
  return console.log("getAutoExportFlag result:", e), e;
}
function m() {
  console.log("getFilePathFromArgs called, argv:", process.argv);
  const o = process.argv.slice(g ? 2 : 1).filter((e) => e !== "." && !e.startsWith("--"));
  console.log("Filtered args:", o);
  for (const e of o)
    if (console.log("Checking arg:", e, "exists:", i.existsSync(e)), i.existsSync(e)) {
      const l = s.extname(e).toLowerCase().slice(1);
      if (console.log("Ext:", l), P.includes(l))
        return e;
    }
  return null;
}
function h() {
  n = new p({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: s.join(d, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    backgroundColor: "#18181B",
    show: !1
  }), n.once("ready-to-show", () => {
    n == null || n.show();
  });
  const o = m();
  if (c = v(), console.log("createWindow: autoExport =", c), g)
    console.log("createWindow: isDev mode"), n.loadURL("http://localhost:5173"), n.webContents.openDevTools();
  else {
    console.log("createWindow: production mode");
    const e = s.join(d, "../dist/index.html");
    if (o) {
      console.log("createWindow: have file path");
      const t = { file: Buffer.from(o).toString("base64") };
      c && (console.log("createWindow: adding export flag"), t.export = "true"), console.log("createWindow: loading with query:", t), n.loadFile(e, { query: t });
    } else
      console.log("createWindow: no file path"), n.loadFile(e);
  }
}
a.whenReady().then(() => {
  console.log("=== APP READY ==="), h(), a.on("activate", () => {
    p.getAllWindows().length === 0 && h();
  }), console.log("=== IPC HANDLERS REGISTERED ===");
});
a.on("window-all-closed", () => {
  process.platform !== "darwin" && a.quit();
});
f.handle("open-file-dialog", async () => {
  const o = await u.showOpenDialog(n, {
    properties: ["openFile"],
    filters: [
      { name: "3D Models", extensions: ["3mf", "stl", "obj"] }
    ]
  });
  if (o.canceled || o.filePaths.length === 0)
    return null;
  const e = o.filePaths[0], l = i.readFileSync(e), t = s.basename(e), r = s.extname(e).toLowerCase();
  return {
    name: t,
    path: e,
    content: l.toString("base64"),
    extension: r.slice(1)
  };
});
f.handle("save-file", async (o, { data: e, defaultPath: l }) => {
  const t = await u.showSaveDialog(n, {
    defaultPath: l,
    filters: [
      { name: "PNG Image", extensions: ["png"] }
    ]
  });
  if (t.canceled || !t.filePath)
    return null;
  const r = Buffer.from(e, "base64");
  return i.writeFileSync(t.filePath, r), t.filePath;
});
f.handle("get-file-path", async () => {
  console.log("=== get-file-path IPC called ===");
  const o = m();
  if (!o) return null;
  try {
    const e = i.readFileSync(o), l = s.basename(o), t = s.extname(o).toLowerCase();
    return console.log("Loaded file:", l), {
      name: l,
      path: o,
      content: e.toString("base64"),
      extension: t.slice(1)
    };
  } catch (e) {
    return console.error("Failed to load file:", e), null;
  }
});

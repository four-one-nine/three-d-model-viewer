import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#18181B',
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: '3D Models', extensions: ['3mf', 'stl', 'obj'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]
  const fileContent = fs.readFileSync(filePath)
  const fileName = path.basename(filePath)
  const fileExt = path.extname(filePath).toLowerCase()

  return {
    name: fileName,
    path: filePath,
    content: fileContent.toString('base64'),
    extension: fileExt.slice(1)
  }
})

ipcMain.handle('save-file', async (_event, { data, defaultPath }) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [
      { name: 'PNG Image', extensions: ['png'] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  const buffer = Buffer.from(data, 'base64')
  fs.writeFileSync(result.filePath, buffer)

  return result.filePath
})

ipcMain.handle('get-file-path', async () => {
  return null
})
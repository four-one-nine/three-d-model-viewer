import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

console.log('=== MAIN PROCESS STARTING ===')
console.log('process.argv:', process.argv)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let initialFileData: { name: string; path: string; content: string; extension: string } | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

const validExtensions = ['3mf', 'stl', 'obj']

let autoExport = false

function getAutoExportFlag(): boolean {
  const args = process.argv.slice(isDev ? 2 : 1)
  console.log('getAutoExportFlag args:', args)
  const result = args.includes('-e') || args.includes('--export')
  console.log('getAutoExportFlag result:', result)
  return result
}

function getFilePathFromArgs(): string | null {
  console.log('getFilePathFromArgs called, argv:', process.argv)
  const args = process.argv.slice(isDev ? 2 : 1).filter(arg => arg !== '.' && !arg.startsWith('--'))
  console.log('Filtered args:', args)
  for (const arg of args) {
    console.log('Checking arg:', arg, 'exists:', fs.existsSync(arg))
    if (fs.existsSync(arg)) {
      const ext = path.extname(arg).toLowerCase().slice(1)
      console.log('Ext:', ext)
      if (validExtensions.includes(ext)) {
        return arg
      }
    }
  }
  return null
}

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

  const initialFilePath = getFilePathFromArgs()
  autoExport = getAutoExportFlag()
  console.log('createWindow: autoExport =', autoExport)
  
  if (isDev) {
    console.log('createWindow: isDev mode')
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    console.log('createWindow: production mode')
    const indexPath = path.join(__dirname, '../dist/index.html')
    if (initialFilePath) {
      console.log('createWindow: have file path')
      // Encode the file path as a URL parameter
      const encodedPath = Buffer.from(initialFilePath).toString('base64')
      const query: Record<string, string> = { file: encodedPath }
      if (autoExport) {
        console.log('createWindow: adding export flag')
        query.export = 'true'
      }
      console.log('createWindow: loading with query:', query)
      mainWindow.loadFile(indexPath, { query })
    } else {
      console.log('createWindow: no file path')
      mainWindow.loadFile(indexPath)
    }
  }
}

app.whenReady().then(() => {
  console.log('=== APP READY ===')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
  }
})

console.log('=== IPC HANDLERS REGISTERED ===')
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
  console.log('=== get-file-path IPC called ===')
  const filePath = getFilePathFromArgs()
  if (!filePath) return null
  
  try {
    const fileContent = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const fileExt = path.extname(filePath).toLowerCase()
    console.log('Loaded file:', fileName)
    return {
      name: fileName,
      path: filePath,
      content: fileContent.toString('base64'),
      extension: fileExt.slice(1)
    }
  } catch (err) {
    console.error('Failed to load file:', err)
    return null
  }
})
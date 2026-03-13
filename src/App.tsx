import { useState, useCallback, useRef } from 'react'
import FileUpload from './components/FileUpload'
import PreviewCanvas from './components/PreviewCanvas'
import ControlPanel from './components/ControlPanel'

declare global {
  interface Window {
    electronAPI?: {
      openFileDialog: () => Promise<{ name: string; path: string; content: string; extension: string } | null>
      saveFile: (data: string, defaultPath: string) => Promise<string | null>
      getFilePath: () => Promise<string | null>
    }
  }
}

export interface ModelSettings {
  color: string
  roughness: number
  metalness: number
}

export interface BackgroundSettings {
  color: string
}

export interface ExportSettings {
  aspectRatio: string
  resolution: string
}

const App = () => {
  const [modelData, setModelData] = useState<{ name: string; path: string; content: string; extension: string } | null>(null)
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    color: '#1C1C1C',
    roughness: 0.7,
    metalness: 0.1
  })
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    color: '#EAB308'
  })
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    aspectRatio: '16:9',
    resolution: '1920x1080'
  })
  const [isExporting, setIsExporting] = useState(false)
  const canvasRef = useRef<{ exportImage: () => Promise<string> } | null>(null)

  const handleFileLoad = useCallback((data: { name: string; path: string; content: string; extension: string }) => {
    setModelData(data)
  }, [])

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || !modelData) return

    setIsExporting(true)
    try {
      const base64Data = await canvasRef.current.exportImage()
      
      const baseName = modelData.name.replace(/\.[^/.]+$/, '')
      const resolution = exportSettings.resolution
      const fileName = `${baseName}_${resolution}.png`

      if (window.electronAPI) {
        const defaultPath = modelData.path.replace(/[^/\\]+$/, '') + fileName
        await window.electronAPI.saveFile(base64Data, defaultPath)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [modelData, exportSettings])

  return (
    <div className="flex h-screen bg-secondary">
      <div className="w-80 flex-shrink-0 border-r border-border">
        <ControlPanel
          modelSettings={modelSettings}
          setModelSettings={setModelSettings}
          backgroundSettings={backgroundSettings}
          setBackgroundSettings={setBackgroundSettings}
          exportSettings={exportSettings}
          setExportSettings={setExportSettings}
          onExport={handleExport}
          isExporting={isExporting}
          hasModel={!!modelData}
        />
      </div>
      <div className="flex-1 relative">
        {!modelData ? (
          <FileUpload onFileLoad={handleFileLoad} />
        ) : (
          <PreviewCanvas
            ref={canvasRef}
            modelData={modelData}
            modelSettings={modelSettings}
            backgroundSettings={backgroundSettings}
            exportSettings={exportSettings}
          />
        )}
      </div>
    </div>
  )
}

export default App
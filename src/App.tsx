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
  const [flipTrigger, setFlipTrigger] = useState(0)
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    color: '#404040',
    roughness: 1,
    metalness: 0
  })
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    color: '#B1AD38'
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

  const handleReset = useCallback(() => {
    setModelData(null)
  }, [])

  const handleFlip = useCallback(() => {
    setFlipTrigger(f => f + 1)
  }, [])

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || !modelData) return

    setIsExporting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const base64Data = await canvasRef.current.exportImage()
      console.log('Exported image length:', base64Data.length)
      
      if (base64Data.length < 1000) {
        alert('Export failed: Image too small or empty')
        setIsExporting(false)
        return
      }
      
      const baseName = modelData.name.replace(/\.[^/.]+$/, '')
      const resolution = exportSettings.resolution
      const fileName = `${baseName}_${resolution}.png`

      if (window.electronAPI) {
        console.log('Using electron API to save file')
        const defaultPath = modelData.path.replace(/[^/\\]+$/, '') + fileName
        const result = await window.electronAPI.saveFile(base64Data, defaultPath)
        console.log('Save result:', result)
      } else {
        console.log('Using browser download fallback')
        const link = document.createElement('a')
        link.href = 'data:image/png;base64,' + base64Data
        link.download = fileName
        link.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + error)
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
          onReset={handleReset}
          onFlip={handleFlip}
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
            flipTrigger={flipTrigger}
          />
        )}
      </div>
    </div>
  )
}

export default App
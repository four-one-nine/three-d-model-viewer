import { useState, useCallback, DragEvent } from 'react'

interface FileData {
  name: string
  path: string
  content: string
  extension: string
}

interface FileUploadProps {
  onFileLoad: (data: FileData) => void
}

const FileUpload = ({ onFileLoad }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validExtensions = ['3mf', 'stl', 'obj']

  const processFile = useCallback(async (file: File) => {
    setError(null)
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !validExtensions.includes(extension)) {
      setError('Invalid file format. Please use .3mf, .stl, or .obj files.')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100MB.')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      
      onFileLoad({
        name: file.name,
        path: file.name,
        content: base64,
        extension
      })
    } catch (err) {
      setError('Failed to read file.')
    }
  }, [onFileLoad])

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleClick = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFileDialog()
      if (result) {
        onFileLoad(result)
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.3mf,.stl,.obj'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          processFile(file)
        }
      }
      input.click()
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full max-w-lg h-64 
          border-2 border-dashed rounded-lg 
          flex flex-col items-center justify-center 
          cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-accent bg-accent/10' 
            : 'border-border hover:border-text-secondary'}
        `}
      >
        <svg 
          className="w-16 h-16 text-text-secondary mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        <p className="text-lg font-medium text-text-primary mb-2">
          Drop your 3D model here
        </p>
        <p className="text-sm text-text-secondary">
          or click to browse
        </p>
        <p className="text-xs text-text-secondary mt-2">
          Supported formats: .3mf, .stl, .obj
        </p>
      </div>
      {error && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

export default FileUpload
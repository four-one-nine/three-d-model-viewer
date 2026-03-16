import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { OBJLoader } from 'three-stdlib'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import type { ModelSettings, BackgroundSettings, ExportSettings } from '../App'

interface PreviewCanvasProps {
  modelData: { name: string; path: string; content: string; extension: string }
  modelSettings: ModelSettings
  backgroundSettings: BackgroundSettings
  exportSettings: ExportSettings
  flipTrigger?: number
}

function CameraSetup({ modelHeight = 2, modelWidth = 2, modelCenterY = 1 }: { modelHeight?: number; modelWidth?: number; modelCenterY?: number }) {
  const { camera } = useThree()
  const yPos = modelHeight * 2
  const distance = modelWidth * 2
  camera.position.set(0, yPos, distance)
  camera.lookAt(0, modelCenterY, 0)
  return null
}

function ExportHelper({ forwardedRef }: { forwardedRef: any }) {
  const { gl, scene, camera } = useThree()
  
  useImperativeHandle(forwardedRef, () => ({
    exportImage: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/png').replace('data:image/png;base64,', '')
    }
  }))
  
  return null
}

const Ground = ({ color, visible, resetKey }: { color: string; visible: boolean; resetKey?: number }) => {
  if (!visible) return null
  return (
    <AccumulativeShadows key={resetKey} temporal frames={30} color={color} colorBlend={1} opacity={0.8} scale={10} position={[0, 0, 0]} alphaTest={0.5}>
      <RandomizedLight amount={8} radius={10} ambient={0.5} intensity={3} position={[5, 5, -5]} bias={0.001} />
    </AccumulativeShadows>
  )
}

function Model({ modelData, modelSettings, flipCount = 0, onDimensionsChange, onCenterChange }: { modelData: { name: string; path: string; content: string; extension: string }; modelSettings: ModelSettings; flipCount?: number; onDimensionsChange?: (height: number, width: number) => void; onCenterChange?: (centerY: number) => void }) {
  const geometry = useMemo(() => {
    try {
      const binary = atob(modelData.content)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      
      let geom: THREE.BufferGeometry | null = null
      
      if (modelData.extension === 'stl') {
        const loader = new STLLoader()
        geom = loader.parse(bytes.buffer)
      } else if (modelData.extension === 'obj') {
        const loader = new OBJLoader()
        const obj = loader.parse(binary)
        
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && !geom) {
            geom = child.geometry.clone()
          }
        })
      } else if (modelData.extension === '3mf') {
        const loader = new ThreeMFLoader()
        const obj = loader.parse(bytes.buffer)
        
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && !geom) {
            geom = child.geometry
          }
        })
      }

      if (!geom) return null

      geom.computeVertexNormals()
      geom.computeBoundingBox()
      let box = geom.boundingBox
      if (!box) return geom

      const size = new THREE.Vector3()
      box.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim
      geom.scale(scale, scale, scale)

      geom.computeBoundingBox()
      box = geom.boundingBox
      if (!box) return geom

      const center = new THREE.Vector3()
      box.getCenter(center)
      geom.translate(-center.x, -center.y, -center.z)

      if (flipCount > 0) {
        geom.rotateX(flipCount * Math.PI / 2)
      }

      geom.computeBoundingBox()
      box = geom.boundingBox
      if (!box) return geom

      box.getCenter(center)
      geom.translate(-center.x, -center.y, -center.z)

      const centerY = box.max.y - box.min.y
      geom.translate(0, centerY / 2, 0)

      return geom
    } catch (e) {
      console.error('Failed to parse model:', e)
    }
    return null
  }, [modelData, flipCount])

  useEffect(() => {
    if (geometry) {
      geometry.computeBoundingBox()
      const box = geometry.boundingBox
      if (box) {
        const height = box.max.y - box.min.y
        const width = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
        const centerY = (box.max.y + box.min.y) / 2
        
        if (onDimensionsChange) {
          onDimensionsChange(height || 2, width || 2)
        }
        if (onCenterChange) {
          onCenterChange(centerY || 1)
        }
      }
    }
  }, [geometry, onDimensionsChange, onCenterChange])

  if (!geometry) return null

  const material = new THREE.MeshStandardMaterial({
    color: modelSettings.color,
    roughness: modelSettings.roughness,
    metalness: modelSettings.metalness
  })

  return (
    <mesh castShadow receiveShadow geometry={geometry} material={material} />
  )
}

function DragHandler({ onDragStart, onDragEnd, children }: { onDragStart?: () => void; onDragEnd?: () => void; children?: React.ReactNode }) {
  const rotation = useRef(Math.PI / 4)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(0, rotation.current, 0)
    }
  }, [])

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = true
    onDragStart?.()
    last.current = { x: e.clientX, y: e.clientY }
    e.stopPropagation()
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !groupRef.current) return
    rotation.current += (e.clientX - last.current.x) * 0.01
    groupRef.current.rotation.set(0, rotation.current, 0)
    last.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = () => {
    dragging.current = false
    onDragEnd?.()
  }

  return (
    <>
      <mesh 
        position={[0, 0, -5]} 
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <group ref={groupRef}>
        {children}
      </group>
    </>
  )
}

export interface PreviewCanvasRef {
  exportImage: () => Promise<string>
}

const PreviewCanvas = forwardRef<PreviewCanvasRef, PreviewCanvasProps>(({
  modelData,
  modelSettings,
  backgroundSettings,
  flipTrigger = 0
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [flipCount, setFlipCount] = useState(0)
  const [shadowKey, setShadowKey] = useState(0)
  const [modelHeight, setModelHeight] = useState(2)
  const [modelWidth, setModelWidth] = useState(2)
  const [modelCenterY, setModelCenterY] = useState(1)

  const handleDimensionsChange = (height: number, width: number) => {
    setModelHeight(height)
    setModelWidth(width)
  }

  const handleCenterChange = (centerY: number) => {
    setModelCenterY(centerY)
  }

  useEffect(() => {
    setModelHeight(2)
    setModelWidth(2)
    setModelCenterY(1)
  }, [modelData.content])

  useEffect(() => {
    if (flipTrigger > 0) {
      setFlipCount(c => (c + 1) % 4)
      setShadowKey(k => k + 1)
    }
  }, [flipTrigger])

  const cameraHeight = useMemo(() => {
    const aspectRatio = modelWidth / modelHeight
    if (aspectRatio > 2) {
      return modelHeight * 2
    }
    return modelHeight
  }, [modelHeight, modelWidth])

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      <Canvas 
        shadows
        camera={{ position: [0, 3, 4], fov: 45 }}
        gl={{
          preserveDrawingBuffer: true
        }}
      >
        <ExportHelper forwardedRef={ref} />
        <CameraSetup modelHeight={cameraHeight} modelWidth={modelWidth} modelCenterY={modelCenterY} />
        <color attach="background" args={[backgroundSettings.color]} />
        <fog attach="fog" args={[backgroundSettings.color, 10, 50]} />
        
        <ambientLight intensity={1.5} />
        
        <directionalLight position={[5, 10, 7]} intensity={1} />
        
        <Ground color={backgroundSettings.color} visible={true} resetKey={shadowKey} />
        
        <DragHandler onDragEnd={() => setShadowKey(k => k + 1)}>
          {modelData.content ? (
            <Model modelData={modelData} modelSettings={modelSettings} flipCount={flipCount} onDimensionsChange={handleDimensionsChange} onCenterChange={handleCenterChange} />
          ) : (
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial 
                color={modelSettings.color} 
                roughness={modelSettings.roughness} 
                metalness={modelSettings.metalness} 
              />
            </mesh>
          )}
        </DragHandler>
      </Canvas>
    </div>
  )
})

PreviewCanvas.displayName = 'PreviewCanvas'

export default PreviewCanvas

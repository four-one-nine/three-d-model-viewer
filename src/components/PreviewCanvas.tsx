import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import { OBJLoader } from 'three-stdlib'
import type { ModelSettings, BackgroundSettings, ExportSettings } from '../App'

interface PreviewCanvasProps {
  modelData: { name: string; path: string; content: string; extension: string }
  modelSettings: ModelSettings
  backgroundSettings: BackgroundSettings
  exportSettings: ExportSettings
  flipTrigger?: number
}

function CameraSetup({ modelHeight = 2, flipCount = 0 }: { modelHeight?: number; flipCount?: number }) {
  const { camera } = useThree()
  const distance = modelHeight * 2
  const centerY = flipCount % 2 === 0 ? modelHeight / 2 : modelHeight * 0.25
  camera.position.set(0, distance * 0.6, distance)
  camera.lookAt(0, centerY, 0)
  return null
}

const Ground = ({ color, visible }: { color: string; visible: boolean }) => {
  if (!visible) return null
  return (
    <AccumulativeShadows frames={100} color={color} colorBlend={1} opacity={0.8} scale={10} position={[0, 0, 0]} alphaTest={0.5}>
      <RandomizedLight amount={8} radius={10} ambient={0.5} intensity={3} position={[5, 5, -5]} bias={0.001} />
    </AccumulativeShadows>
  )
}

function Model({ modelData, modelSettings, flipCount = 0 }: { modelData: { name: string; path: string; content: string; extension: string }; modelSettings: ModelSettings; flipCount?: number }) {
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
      }

      if (!geom) return null

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

function DragHandler({ onDragStart, onDragEnd, children }: { onDragStart?: () => void; onDragEnd?: () => void; children: React.ReactNode }) {
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
  const [isDragging, setIsDragging] = useState(false)
  const [flipCount, setFlipCount] = useState(0)

  useEffect(() => {
    if (flipTrigger > 0) {
      setFlipCount(c => (c + 1) % 4)
    }
  }, [flipTrigger])

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      const canvas = containerRef.current?.querySelector('canvas')
      if (!canvas) return ''
      return canvas.toDataURL('image/png').replace('data:image/png;base64,', '')
    }
  }))

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      <Canvas 
        shadows
        camera={{ position: [0, 3, 4], fov: 45 }}
      >
        <CameraSetup modelHeight={flipCount % 2 === 0 ? 2 : 1.5} flipCount={flipCount} />
        <color attach="background" args={[backgroundSettings.color]} />
        <fog attach="fog" args={[backgroundSettings.color, 10, 50]} />
        
        <ambientLight intensity={1.5} />
        
        <directionalLight position={[5, 10, 7]} intensity={1} />
        
        <Ground color={backgroundSettings.color} visible={!isDragging} />
        
        <DragHandler onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}>
          {modelData.content ? (
            <Model modelData={modelData} modelSettings={modelSettings} flipCount={flipCount} />
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

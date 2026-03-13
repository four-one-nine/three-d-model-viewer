import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react'
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
}

function CameraSetup() {
  const { camera } = useThree()
  camera.lookAt(0, 1, 0)
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

function Model({ modelData, modelSettings }: { modelData: { name: string; path: string; content: string; extension: string }; modelSettings: ModelSettings }) {
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
      const box = geom.boundingBox
      if (box) {
        const center = new THREE.Vector3()
        box.getCenter(center)
        geom.translate(-center.x, -center.y, -center.z)
        
        const size = new THREE.Vector3()
        box.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        geom.scale(scale, scale, scale)
        
        geom.translate(0, 1, 0)
      }

      return geom
    } catch (e) {
      console.error('Failed to parse model:', e)
    }
    return null
  }, [modelData])

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

function Rotator({ children, onDragStart, onDragEnd }: { children: React.ReactNode; onDragStart?: () => void; onDragEnd?: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const rotation = useRef(0)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

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
    <group 
      ref={groupRef} 
      onPointerDown={onPointerDown} 
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => dragging.current = false}
    >
      {children}
    </group>
  )
}

export interface PreviewCanvasRef {
  exportImage: () => Promise<string>
}

const PreviewCanvas = forwardRef<PreviewCanvasRef, PreviewCanvasProps>(({
  modelData,
  modelSettings,
  backgroundSettings
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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
        camera={{ position: [0, 3, 10], fov: 45 }}
      >
        <CameraSetup />
        <color attach="background" args={[backgroundSettings.color]} />
        <fog attach="fog" args={[backgroundSettings.color, 10, 50]} />
        
        <ambientLight intensity={1.5} />
        
        <directionalLight position={[5, 10, 7]} intensity={1} />
        
        <Ground color={backgroundSettings.color} visible={!isDragging} />
        
        <Rotator onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}>
          {modelData.content ? (
            <Model modelData={modelData} modelSettings={modelSettings} />
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
        </Rotator>
      </Canvas>
    </div>
  )
})

PreviewCanvas.displayName = 'PreviewCanvas'

export default PreviewCanvas

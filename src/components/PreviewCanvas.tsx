import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { Canvas, ThreeEvent, useThree as useThreeFiber } from '@react-three/fiber'
import * as THREE from 'three'
import ViewCube from './ViewCube'
import type { ModelSettings, BackgroundSettings, ExportSettings } from '../App'

function SetupShadows() {
  const { gl } = useThreeFiber()
  useEffect(() => {
    gl.shadowMap.type = THREE.VSMShadowMap
  }, [gl])
  return null
}

interface PreviewCanvasProps {
  modelData: { name: string; path: string; content: string; extension: string }
  modelSettings: ModelSettings
  backgroundSettings: BackgroundSettings
  exportSettings: ExportSettings
}

const Ground = ({ color }: { color: string }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Rotator({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const rotation = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
    e.stopPropagation()
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !groupRef.current) return
    rotation.current.y += (e.clientX - last.current.x) * 0.01
    rotation.current.x += (e.clientY - last.current.y) * 0.01
    groupRef.current.rotation.set(rotation.current.x, rotation.current.y, 0)
    last.current = { x: e.clientX, y: e.clientY }
  }

  return (
    <group 
      ref={groupRef} 
      onPointerDown={onPointerDown} 
      onPointerMove={onPointerMove}
      onPointerUp={() => dragging.current = false}
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
  modelSettings,
  backgroundSettings
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)

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
        <SetupShadows />
        <color attach="background" args={[backgroundSettings.color]} />
        <fog attach="fog" args={[backgroundSettings.color, 10, 50]} />
        
        <ambientLight intensity={1} />
        <directionalLight 
          position={[5, 10, 7]} 
          intensity={2} 
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-bias={-0.0001}
          shadow-radius={100}
        />
        
        <Ground color={backgroundSettings.color} />
        
        <Rotator>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial 
              color={modelSettings.color} 
              roughness={modelSettings.roughness} 
              metalness={modelSettings.metalness} 
            />
          </mesh>
        </Rotator>
      </Canvas>
      <ViewCube />
    </div>
  )
})

PreviewCanvas.displayName = 'PreviewCanvas'

export default PreviewCanvas
import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const CubeLabel = ({ text, position, rotation }: { text: string; position: [number, number, number]; rotation: [number, number, number] }) => {
  return (
    <group position={position} rotation={rotation}>
      <Html
        center
        style={{
          color: '#A1A1AA',
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          userSelect: 'none',
        }}
      >
        {text}
      </Html>
    </group>
  )
}

const ViewCubeInner = () => {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshBasicMaterial color="#27272A" wireframe transparent opacity={0.5} />
      </mesh>
      <CubeLabel text="F" position={[0, 0, -0.8]} rotation={[0, 0, 0]} />
      <CubeLabel text="B" position={[0, 0, 0.8]} rotation={[0, Math.PI, 0]} />
      <CubeLabel text="L" position={[-0.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <CubeLabel text="R" position={[0.8, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <CubeLabel text="U" position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <CubeLabel text="D" position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

const ViewCube = () => {
  return (
    <div 
      className="absolute top-4 right-4 w-20 h-20 rounded-lg overflow-hidden"
      style={{ backgroundColor: 'rgba(39, 39, 42, 0.8)', backdropFilter: 'blur(4px)' }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ViewCubeInner />
      </Canvas>
    </div>
  )
}

export default ViewCube
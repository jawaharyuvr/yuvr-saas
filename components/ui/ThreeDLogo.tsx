'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, PerspectiveCamera, Environment, Text, ContactShadows, PresentationControls } from '@react-three/drei';

function LogoMesh() {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, '/logo-3d.png');

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.3;
      meshRef.current.position.y = Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Outer Glow/Ring */}
      <mesh position={[0, 0, -0.1]}>
        <torusGeometry args={[1.2, 0.02, 16, 100]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
      </mesh>

      {/* Main Logo Card */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          {/* Front Face with Logo */}
          <meshStandardMaterial 
            attach="material-4" 
            map={texture} 
            transparent 
            roughness={0.1} 
            metalness={0.8}
          />
          {/* Other Faces (Metallic) */}
          <meshStandardMaterial attach="material-0" color="#ffffff" roughness={0.1} metalness={0.9} />
          <meshStandardMaterial attach="material-1" color="#ffffff" roughness={0.1} metalness={0.9} />
          <meshStandardMaterial attach="material-2" color="#ffffff" roughness={0.1} metalness={0.9} />
          <meshStandardMaterial attach="material-3" color="#ffffff" roughness={0.1} metalness={0.9} />
          <meshStandardMaterial attach="material-5" color="#ffffff" roughness={0.1} metalness={0.9} />
        </mesh>
      </Float>
    </group>
  );
}

export function ThreeDLogo() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center relative cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#f0abfc" />
        
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
        >
          <LogoMesh />
        </PresentationControls>

        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={4} 
        />
      </Canvas>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
    </div>
  );
}

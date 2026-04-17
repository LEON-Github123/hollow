import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Sparkles } from '@react-three/drei';
import { MortyAvatar } from './MortyAvatar';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      );
    }
    return this.props.children;
  }
}

export const Scene: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <Canvas 
      camera={{ 
        position: isMobile ? [0, 0.5, 9] : [0, 0, 4.5], 
        fov: 40 
      }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
    >
      <fog attach="fog" args={['#0d1123', 6, 16]} />
      <ambientLight intensity={0.6} color="#94a3b8" />
      <spotLight position={[2, 5, 4]} angle={0.4} penumbra={1} intensity={35} color="#a6c8ff" castShadow />
      <pointLight position={[-3, -1, -2]} intensity={4} color="#8b5cf6" />
      <pointLight position={[0, 2, -3]} intensity={3} color="#6366f1" />
      
      <Suspense fallback={
         <mesh>
           <boxGeometry args={[0.5, 0.5, 0.5]} />
           <meshStandardMaterial color="#8b5cf6" wireframe emissive="#8b5cf6" emissiveIntensity={2} />
         </mesh>
      }>
        <ErrorBoundary>
          <MortyAvatar />
          <Sparkles count={isMobile ? 60 : 150} scale={12} size={isMobile ? 3 : 4} speed={0.4} color="#8b5cf6" opacity={0.5} noise={0.4} />
          <Sparkles count={isMobile ? 30 : 80} scale={10} size={2} speed={0.8} color="#a6c8ff" opacity={0.7} noise={0.2} />
        </ErrorBoundary>
      </Suspense>

      <ContactShadows resolution={isMobile ? 256 : 1024} scale={10} blur={2.5} opacity={0.6} far={10} color="#000000" />
      <Environment preset="city" />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={true}
        maxPolarAngle={Math.PI / 2 + 0.1} 
        minPolarAngle={Math.PI / 2 - 0.2} 
      />
    </Canvas>
  );
};

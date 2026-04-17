import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useChatStore } from '../store/useChatStore';

export const MortyAvatar: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const targetPointer = useRef({ x: 0, y: 0 });
  
  const { scene, animations } = useGLTF('/hollow_knight.glb');
  useAnimations(animations, group);
  
  const isSpeaking = useChatStore(state => state.isSpeaking);

  // Global mouse + touch tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetPointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetPointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetPointer.current.x = (touch.clientX / window.innerWidth) * 2 - 1;
        targetPointer.current.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  useFrame((state) => {
    if (!group.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Head tracking — smooth follow pointer
    const targetRotY = targetPointer.current.x * 0.4;
    const targetRotX = -targetPointer.current.y * 0.3;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.08);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotX, 0.08);
    
    if (isSpeaking) {
      // Speaking: rhythmic bounce + subtle vibration
      const bounce = Math.sin(time * 12) * 0.03;
      const pulse = Math.sin(time * 8) * 0.02;
      
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y, 
        -1.5 + bounce,
        0.3
      );
      group.current.position.x = THREE.MathUtils.lerp(
        group.current.position.x, 
        pulse,
        0.3
      );
      // Subtle scale pulse when speaking
      const scalePulse = 1.2 + Math.sin(time * 6) * 0.015;
      group.current.scale.setScalar(scalePulse);
    } else {
      // Idle: gentle levitation breathing
      const breathe = Math.sin(time * 1.8) * 0.04;
      const sway = Math.sin(time * 0.7) * 0.01;
      
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -1.5 + breathe, 0.06);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, sway, 0.06);
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, 1.2, 0.05));
    }
  });

  return (
    <group ref={group} position={[0, -1.5, 0]} dispose={null}>
      <primitive object={scene} scale={[1.2, 1.2, 1.2]} />
    </group>
  );
};

useGLTF.preload('/hollow_knight.glb');

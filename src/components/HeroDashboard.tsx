import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, MeshTransmissionMaterial, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { MatrixText } from './MatrixText';

const PythonCode = `print('Hello Python!')
if score > 9000:
    win_game()
for i in range(10):
    print(i)
def hack_matrix():
    pass`;

const CodeFace = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
  const textRef = useRef<any>(null);

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.y = (state.clock.elapsedTime * 0.2) % 2 - 1;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <Text
        ref={textRef}
        fontSize={0.15}
        color="#ff4444"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff"
      >
        {PythonCode}
      </Text>
    </group>
  );
};

const CrystalCube = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {}
      <Sphere args={[0.6, 32, 32]}>
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ff2200" 
          emissiveIntensity={4} 
          toneMapped={false} 
        />
      </Sphere>

      {}
      <Box args={[2, 2, 2]}>
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={1}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.3}
          temporalDistortion={0.1}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </Box>

      {}
      <CodeFace position={[0, 0, 1.01]} rotation={[0, 0, 0]} />
      <CodeFace position={[0, 0, -1.01]} rotation={[0, Math.PI, 0]} />
      <CodeFace position={[1.01, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <CodeFace position={[-1.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <CodeFace position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <CodeFace position={[0, -1.01, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

const MetricPanel = ({ title, value, description, align = 'left' }: { title: string, value: string, description: string, align?: 'left' | 'right' }) => (
  <div className={`glass rounded-2xl p-6 border border-white/10 bg-black/40 backdrop-blur-md flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
    <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">{title}</div>
    <div className="text-3xl md:text-4xl font-bold font-mono text-white mb-1">{value}</div>
    <div className="text-sm text-white/60">{description}</div>
  </div>
);

export const HeroDashboard = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 z-20 overflow-hidden">
      {}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {}
        <div className="text-center mb-16 w-full flex flex-col items-center">
          <MatrixText text="PYTHON" />
          <h1 className="text-xl md:text-2xl font-mono font-light text-white/50 mt-2 tracking-[0.3em] uppercase">
            Освой Пайтон Играя
          </h1>
        </div>

        {}
        <div className="relative w-full aspect-square md:aspect-[21/9] max-h-[600px] flex items-center justify-center mb-12">
          
          {}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <CrystalCube />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
          </div>

          {}
          <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none p-4 md:p-8">
            <div className="flex justify-between w-full">
              <div className="w-64 pointer-events-auto">
                <MetricPanel 
                  title="ОСВОЕНИЕ СИНТАКСИСА" 
                  value="85%" 
                  description="Базы Python Fundamentals" 
                />
              </div>
              <div className="w-64 pointer-events-auto">
                <MetricPanel 
                  title="ПРОГРЕСС УРОКОВ" 
                  value="LEVEL 25" 
                  description="Ключевые Концепты Освоены" 
                  align="right"
                />
              </div>
            </div>
            <div className="flex justify-between w-full">
              <div className="w-64 pointer-events-auto">
                <MetricPanel 
                  title="ОЧКИ ДОСТИЖЕНИЙ" 
                  value="15,500 XP" 
                  description="Заработанные Значки" 
                />
              </div>
              <div className="w-64 pointer-events-auto">
                <MetricPanel 
                  title="РЕШЕННЫЕ КВЕСТЫ" 
                  value="321 QUESTS" 
                  description="Логические Задачи Пройдены" 
                  align="right"
                />
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="w-full max-w-4xl glass rounded-2xl p-4 border border-red-500/30 bg-black/60 backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shimmer" />
          <div className="text-center font-mono text-sm md:text-base text-white/80 relative z-10">
            <span className="text-red-400">PythonQuest</span> = геймифицированное обучение + синтаксические квесты + логические пазлы + код-челленджи
          </div>
        </div>

      </div>
    </section>
  );
};

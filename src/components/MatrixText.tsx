import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Bug, Zap } from 'lucide-react';

const ICONS = [Sword, Bug, Zap];
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#ffffff']; 

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  isIcon: boolean;
  Icon?: any;
  duration: number;
  delay: number;
}

export const MatrixText = ({ text = "PYTHON" }: { text?: string }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const particleCount = 60; 

      for (let i = 0; i < particleCount; i++) {
        const isIcon = Math.random() > 0.85;
        newParticles.push({
          id: i,
          x: Math.random() * 100, 
          y: Math.random() * 100, 
          size: isIcon ? Math.random() * 10 + 10 : Math.random() * 4 + 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          isIcon,
          Icon: isIcon ? ICONS[Math.floor(Math.random() * ICONS.length)] : undefined,
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 2,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    
    
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = [...prev];
        
        for(let i=0; i<5; i++) {
          const idx = Math.floor(Math.random() * updated.length);
          const isIcon = Math.random() > 0.85;
          updated[idx] = {
            id: Date.now() + i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: isIcon ? Math.random() * 10 + 10 : Math.random() * 4 + 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            isIcon,
            Icon: isIcon ? ICONS[Math.floor(Math.random() * ICONS.length)] : undefined,
            duration: Math.random() * 2 + 1,
            delay: 0,
          };
        }
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block select-none">
      {}
      <h1 className="text-[100px] sm:text-[150px] md:text-[220px] font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter leading-none relative z-10"
          style={{ 
            WebkitTextStroke: '2px rgba(255,255,255,0.1)',
            textShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.3)'
          }}>
        {text}
      </h1>

      {}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: p.y + 10 }}
              animate={{ 
                opacity: [0, 0.8, 0], 
                y: [`${p.y}%`, `${p.y - 20}%`],
                x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: p.duration, 
                delay: p.delay, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute flex items-center justify-center"
              style={{
                left: 0,
                top: 0,
                width: p.size,
                height: p.size,
                color: p.color,
                filter: `drop-shadow(0 0 8px ${p.color})`
              }}
            >
              {p.isIcon && p.Icon ? (
                <p.Icon size={p.size} strokeWidth={1.5} className="opacity-60" />
              ) : (
                <div 
                  className="w-full h-full opacity-80" 
                  style={{ 
                    backgroundColor: p.color,
                    boxShadow: `0 0 ${p.size * 2}px ${p.color}`
                  }} 
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {}
      <div className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-30">
        <motion.div 
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"
        />
      </div>
    </div>
  );
};

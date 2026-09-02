import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export const FloatingParticles = ({ color = 'rgba(255, 255, 255, 0.5)', count = 20 }: { color?: string, count?: number }) => {
  const { performanceSettings } = useAuth();
  
  
  
  
  const particles = useMemo(() => {
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const finalCount = isMobile ? Math.floor(count / 2) : count;

    return [...Array(finalCount)].map((_, i) => ({
      id: i,
      size: Math.random() * 10 + 5,
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      opacity: Math.random() * 0.2 + 0.1,
      duration: Math.random() * 10 + 10,
      xMove: Math.random() * 50 - 25,
      delay: Math.random() * 5
    }));
  }, [count]);
  
  if (performanceSettings.lowPerfMode) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size + 'px',
            height: p.size + 'px',
            backgroundColor: color,
            left: p.left,
            top: p.top,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, p.xMove, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
        />
      ))}
    </div>
  );
};

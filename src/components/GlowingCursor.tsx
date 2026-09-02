import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';

import { useAuth } from '../contexts/AuthContext';

export const GlowingCursor = () => {
  const { performanceSettings } = useAuth();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  
  const springX = useSpring(mouseX, { stiffness: 1000, damping: 50, mass: 0.2 });
  const springY = useSpring(mouseY, { stiffness: 1000, damping: 50, mass: 0.2 });
  
  const outerSpringX = useSpring(mouseX, { stiffness: 500, damping: 30, mass: 0.5 });
  const outerSpringY = useSpring(mouseY, { stiffness: 500, damping: 30, mass: 0.5 });

  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    if (isTouchDevice) return;

    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'a' || target.closest('button') || target.closest('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isVisible, isTouchDevice]);

  if (isTouchDevice || !isVisible || performanceSettings.lowPerfMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-brand-primary/50 pointer-events-none z-[9999] bg-transparent"
        style={{
          x: outerSpringX,
          y: outerSpringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-brand-primary pointer-events-none z-[10000] shadow-[0_0_15px_rgba(139,92,246,0.8)]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </AnimatePresence>
  );
};

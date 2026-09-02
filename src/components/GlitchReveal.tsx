import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const GlitchReveal = ({ text, className, delay = 0, onComplete }: { text: string; className?: string; delay?: number; onComplete?: () => void }) => {
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGlitching(false);
      if (onComplete) onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [delay, onComplete]);

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-black"
            transition={{ delay: delay / 1000 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-white"
                initial={{ x: -100, y: Math.random() * 100 }}
                animate={{ x: 500, y: Math.random() * 100 }}
                transition={{ duration: 0.1, repeat: Infinity, delay: (delay / 1000) + i * 0.05 }}
                style={{
                  width: Math.random() * 200 + 50,
                  height: Math.random() * 5 + 2,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, filter: 'blur(20px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, delay: (delay / 1000) + 1.5 }}
        className={className}
      >
        {text}
      </motion.div>
    </div>
  );
};

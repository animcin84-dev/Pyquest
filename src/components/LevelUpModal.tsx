import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Sparkles, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  isOpen: boolean;
  level: number;
  onClose: () => void;
}

export const LevelUpModal = ({ isOpen, level, onClose }: LevelUpModalProps) => {
  React.useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
        >
          <motion.div
            initial={{ scale: 0.5, y: 100, rotate: -10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
            className="w-full max-w-lg glass rounded-[40px] p-12 border border-white/20 text-center relative overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.5)]"
          >
            {}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/30 blur-[100px] rounded-full" />
            
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] relative z-10"
            >
              <Trophy className="text-white w-16 h-16" />
            </motion.div>

            <h2 className="text-5xl font-display font-bold mb-4 relative z-10">
              НОВЫЙ УРОВЕНЬ!
            </h2>
            <p className="text-2xl text-white/60 mb-8 font-mono relative z-10">
              Вы достигли <span className="text-brand-primary font-bold">{level} уровня</span>
            </p>

            <div className="grid grid-cols-3 gap-4 mb-12 relative z-10">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <Star className="text-yellow-400 w-6 h-6 mx-auto mb-2" />
                <div className="text-xs text-white/40 uppercase">Награда</div>
                <div className="font-bold">+500 XP</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <Sparkles className="text-brand-primary w-6 h-6 mx-auto mb-2" />
                <div className="text-xs text-white/40 uppercase">Статус</div>
                <div className="font-bold">Мастер</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <Trophy className="text-orange-400 w-6 h-6 mx-auto mb-2" />
                <div className="text-xs text-white/40 uppercase">Значок</div>
                <div className="font-bold">Pythonist</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 relative z-10 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              Продолжить квест
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

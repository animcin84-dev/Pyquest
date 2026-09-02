import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Zap, Sword, Trophy } from 'lucide-react';
import { playSound } from '../utils/sounds';

interface BossFightProps {
  bossName: string;
  bossHp: number;
  challenge: string;
  expectedOutput: string;
  onVictory: () => void;
}

export const BossFight = ({ bossName, bossHp, challenge, expectedOutput, onVictory }: BossFightProps) => {
  const [currentHp, setCurrentHp] = useState(bossHp);
  const [code, setCode] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [message, setMessage] = useState('Босс ждет вашего хода...');
  const [damageNumbers, setDamageNumbers] = useState<{ id: number, val: number }[]>([]);
  const [shake, setShake] = useState(false);

  const handleAttack = () => {
    if (!code.trim()) return;
    setIsAttacking(true);
    playSound('click');
    
    setTimeout(() => {
      const normalize = (str: string) => {
        return str
          .replace(/["'‘“]/g, "'")
          .replace(/\s/g, '')
          .replace(/;/g, '')
          .trim();
      };
      
      const normalizedCode = normalize(code);
      const normalizedExpected = normalize(expectedOutput);
      
      const expectedLines = expectedOutput.split(/\r?\n/).filter(line => line.trim() !== '');
      const containsAll = expectedLines.every(line => {
        const normalizedLine = normalize(line);
        return normalizedCode.includes(normalizedLine);
      });

      const coreStrings = expectedOutput.match(/['"](.*?)['"]/g)?.map(s => normalize(s)) || [];
      const containsCoreStrings = coreStrings.length > 0 && coreStrings.every(s => normalizedCode.includes(s));

      if (normalizedCode === normalizedExpected || containsAll || containsCoreStrings) {
        const nextHp = currentHp - 1;
        setCurrentHp(nextHp);
        setIsHit(true);
        setShake(true);
        setMessage('Критический удар! Код сработал!');
        playSound('success');
        
        
        const newDmg = { id: Date.now(), val: 999 };
        setDamageNumbers(prev => [...prev, newDmg]);
        setTimeout(() => setDamageNumbers(prev => prev.filter(d => d.id !== newDmg.id)), 1000);

        if (nextHp <= 0) {
          playSound('levelUp');
          setTimeout(onVictory, 2000);
        }
      } else {
        setMessage('Промах! Ошибка в логике или синтаксисе.');
        playSound('error');
        setShake(true);
      }
      
      setIsAttacking(false);
      setTimeout(() => {
        setIsHit(false);
        setShake(false);
      }, 500);
    }, 800);
  };

  return (
    <motion.div 
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="glass rounded-[40px] p-8 border-2 border-red-500/30 relative overflow-hidden bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
    >
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
            <Skull className="text-red-500 w-10 h-10 relative z-10" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-red-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">{bossName}</h3>
            <div className="flex gap-2 mt-2">
              {[...Array(bossHp)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={false}
                  animate={i < currentHp ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  className="w-8 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/40 text-xs uppercase mb-1 tracking-widest">Статус</div>
          <div className="text-xl font-bold text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">БИТВА С БОССОМ</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl"
          >
            <h4 className="text-sm font-bold text-white/40 uppercase mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Задание
            </h4>
            <p className="text-lg leading-relaxed text-white/90">{challenge}</p>
          </motion.div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="relative w-full h-48 bg-black/80 border-2 border-white/10 rounded-3xl p-6 font-mono text-lg focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/20 text-blue-300 shadow-inner"
              placeholder="# Введите ваш код здесь..."
              spellCheck="false"
            />
            <button
              onClick={handleAttack}
              disabled={isAttacking || currentHp <= 0}
              className="absolute bottom-4 right-4 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              {isAttacking ? <Zap className="w-5 h-5 animate-spin" /> : <Sword className="w-5 h-5" />}
              АТАКОВАТЬ
            </button>
          </div>
          <motion.p 
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center font-bold h-6 text-lg drop-shadow-md ${message.includes('Критический') ? 'text-green-400' : 'text-red-400'}`}
          >
            {message}
          </motion.p>
        </div>

        <div className="relative flex items-center justify-center min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHp}
              initial={{ scale: 1 }}
              animate={isHit ? { 
                x: [0, -30, 30, -30, 30, 0],
                filter: ['brightness(1)', 'brightness(3) hue-rotate(90deg)', 'brightness(1)'],
                scale: [1, 0.8, 1.1, 1]
              } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Skull className={`w-56 h-56 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] ${currentHp <= 0 ? 'text-white/5' : 'text-red-500'} transition-colors duration-700`} />
              
              {}
              <AnimatePresence>
                {damageNumbers.map(dmg => (
                  <motion.div
                    key={dmg.id}
                    initial={{ opacity: 1, y: 0, scale: 0.5, x: (Math.random() - 0.5) * 100 }}
                    animate={{ opacity: 0, y: -150, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] pointer-events-none z-50"
                  >
                    -{dmg.val}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isAttacking && (
                <motion.div
                  initial={{ x: -300, y: -100, opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 2, rotate: 0 }}
                  exit={{ opacity: 0, scale: 3 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
                >
                  <Sword className="w-40 h-40 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {currentHp <= 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, delay: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-[40px] backdrop-blur-sm z-50 border-2 border-green-500/50"
            >
              <div className="text-center">
                <Trophy className="w-32 h-32 text-green-400 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(74,222,128,0.8)]" />
                <h2 className="text-4xl font-black text-white drop-shadow-lg">БОСС ПОВЕРЖЕН!</h2>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

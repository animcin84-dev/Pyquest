import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { CheckCircle2, XCircle, Lightbulb, Play, Terminal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { Lesson } from '../constants/lessons';
import { playSound } from '../utils/sounds';
import { cn } from '../lib/utils';
import { CodeEditor } from './CodeEditor';

interface GameProps {
  lesson: Lesson;
  onComplete: () => void;
  onMistake?: () => void;
}

export const PythonGame: React.FC<GameProps> = ({ lesson, onComplete, onMistake }) => {
  const { setCurrentCode, setCurrentChallenge } = useAuth();
  const challenges = lesson.challenges || (lesson.challenge ? [lesson.challenge] : []);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const currentChallenge = challenges[currentChallengeIndex];

  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentChallenge) return;
    setUserInput('');
    setStatus('idle');
    setShowHint(false);
    
    setCurrentChallenge(currentChallenge.question + ": " + currentChallenge.description);
    setCurrentCode(currentChallenge.initialCode || '');
    
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  }, [currentChallenge]);

  const handleSuccess = () => {
    setStatus('success');
    playSound('success');
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B']
    });
    
    setTimeout(() => {
      if (currentChallengeIndex < challenges.length - 1) {
        setCurrentChallengeIndex(prev => prev + 1);
        setStatus('idle');
      } else {
        onComplete();
      }
    }, 1500);
  };

  const checkAnswer = () => {
    if (!currentChallenge || currentChallenge.testCases) return;
    const trimmedInput = userInput.trim().toLowerCase();
    const isCorrect = Array.isArray(currentChallenge.answer)
      ? currentChallenge.answer.some(ans => ans?.toLowerCase() === trimmedInput)
      : currentChallenge.answer?.toLowerCase() === trimmedInput;

    if (isCorrect) {
      handleSuccess();
    } else {
      setStatus('error');
      playSound('error');
      if (onMistake) onMistake();
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status !== 'success') {
      checkAnswer();
    }
  };

  const gameRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <div 
      className="w-full max-w-3xl mx-auto glass rounded-[40px] p-10 border border-white/10 relative overflow-hidden group shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {challenges.length > 1 && (
        <div className="absolute top-0 left-0 right-0 flex h-1.5 bg-white/5">
          {challenges.map((_, idx) => (
            <div 
              key={idx} 
              className={cn(
                "flex-1 transition-all duration-500",
                idx < currentChallengeIndex ? "bg-green-500" : 
                idx === currentChallengeIndex ? "bg-brand-primary" : "bg-transparent"
              )}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        <h3 className="text-2xl font-display font-bold flex items-center gap-3">
            <Terminal className="w-6 h-6 text-brand-primary" />
            Задача {currentChallengeIndex + 1}
          </h3>
        <div className={cn(
            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]",
            (currentChallenge.difficulty || 'Beginner') === 'Beginner' ? "bg-green-500/10 text-green-400" :
            (currentChallenge.difficulty || 'Beginner') === 'Intermediate' ? "bg-yellow-500/10 text-yellow-400" :
            "bg-red-500/10 text-red-400"
          )}>
          {currentChallenge.difficulty || 'Beginner'}
        </div>

        <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <h4 className="text-xl font-bold text-white mb-2">{currentChallenge.question}</h4>
          <p className="text-white/80 text-lg leading-relaxed font-medium mb-4">{currentChallenge.description}</p>
          <p className="text-white/50 text-sm font-mono bg-black/30 p-3 rounded-lg">Пример: {currentChallenge.example || 'Нет примера'}</p>
        </div>

        {currentChallenge.testCases ? (
          <div className="mb-8">
            <CodeEditor
              initialCode={currentChallenge.initialCode || ''}
              testCases={currentChallenge.testCases}
              onSuccess={handleSuccess}
              lessonId={lesson.id}
            />
          </div>
        ) : (
          <motion.div 
            animate={status === 'error' ? { x: [-10, 10, -10, 10, 0], filter: ['hue-rotate(90deg)', 'hue-rotate(-90deg)', 'hue-rotate(0deg)'] } : {}}
            transition={{ duration: 0.4 }}
            className="bg-[#0a0a0a] rounded-2xl p-8 font-mono text-base mb-8 border border-white/10 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-primary to-brand-secondary" />
            <div className="flex items-center gap-2 text-white/30 mb-4 pb-4 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="ml-3 text-xs uppercase tracking-[0.2em]">main.py</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <span className="text-brand-secondary font-bold">{">>>"}</span>
              <div className="flex-1 flex items-center flex-wrap gap-2 leading-loose">
                {currentChallenge.code?.split('______').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    <span className="text-blue-300/90">{part}</span>
                    {i < arr.length - 1 && (
                      <div className="relative inline-block">
                        <input
                          ref={i === 0 ? inputRef : null}
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={status === 'success'}
                          className={cn(
                            "bg-white/5 border-b-2 border-brand-primary/50 outline-none px-3 py-1 w-32 text-center text-white font-bold transition-all rounded-t-md focus:bg-white/10 focus:border-brand-primary",
                            status === 'error' && "border-red-500 text-red-500 bg-red-500/10",
                            status === 'success' && "border-green-500 text-green-400 bg-green-500/10"
                          )}
                          placeholder="..."
                        />
                        {status === 'success' && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -right-3 -top-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!currentChallenge.testCases && (
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-white/40 hover:text-yellow-400 transition-colors text-sm font-medium group"
              >
                <Lightbulb className="w-5 h-5 group-hover:fill-yellow-400/20" />
                Нужна подсказка?
              </button>
              <AnimatePresence>
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-4 w-64 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-200/80 text-sm backdrop-blur-xl shadow-[0_10px_30px_rgba(234,179,8,0.1)]"
                  >
                    <div className="absolute -bottom-2 left-6 w-4 h-4 bg-yellow-500/10 border-b border-r border-yellow-500/30 rotate-45 backdrop-blur-xl" />
                    {currentChallenge.hint}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={checkAnswer}
              disabled={status === 'success' || !userInput.trim()}
              className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-full font-bold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              {status === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Отлично!
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Запустить код
                </>
              )}
            </button>
          </div>
        )}

        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-red-400 font-bold text-sm flex items-center justify-center gap-2 bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20 backdrop-blur-md"
            >
              <XCircle className="w-4 h-4" />
              Ошибка синтаксиса: Попробуйте еще раз!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

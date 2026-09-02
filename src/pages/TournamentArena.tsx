import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Zap, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';

import { TOURNAMENTS } from './Tournaments';

const TASKS_BY_TYPE = {
  speed: [
    { desc: "Напишите функцию sum(a, b), возвращающую сумму a и b.", sol: "def sum(a, b): return a + b" },
    { desc: "Напишите функцию square(n), возвращающую квадрат числа n.", sol: "def square(n): return n * n" },
    { desc: "Напишите функцию greet(name), возвращающую 'Hello ' + name.", sol: "def greet(name): return 'Hello ' + name" },
  ],
  logic: [
    { desc: "Напишите функцию is_even(n), возвращающую True, если n четное.", sol: "def is_even(n): return n % 2 == 0" },
    { desc: "Напишите функцию is_positive(n), возвращающую True, если n > 0.", sol: "def is_positive(n): return n > 0" },
    { desc: "Напишите функцию max_val(a, b), возвращающую большее из a и b.", sol: "def max_val(a, b): return max(a, b)" },
  ],
  boss: [
    { desc: "Напишите функцию reverse(s), возвращающую перевернутую строку s.", sol: "def reverse(s): return s[::-1]" },
    { desc: "Напишите функцию get_len(s), возвращающую длину строки s.", sol: "def get_len(s): return len(s)" },
    { desc: "Напишите функцию to_upper(s), возвращающую строку s в верхнем регистре.", sol: "def to_upper(s): return s.upper()" },
  ]
};

export const TournamentArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useAuth();
  
  useEffect(() => {
    if (!userProfile) {
      navigate('/tournaments');
    }
  }, [userProfile, navigate]);

  const tournament = TOURNAMENTS.find(t => t.id === id);
  const tasks = tournament ? TASKS_BY_TYPE[tournament.type] : TASKS_BY_TYPE.speed;
  
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const checkAnswer = () => {
    if (userCode.trim() === tasks[currentTaskIndex].sol) {
      setScore(prev => prev + 100);
      setFeedback('correct');
      playSound('success');
      setTimeout(() => {
        setFeedback('idle');
        setUserCode('');
        if (currentTaskIndex < tasks.length - 1) {
          setCurrentTaskIndex(prev => prev + 1);
        } else {
          setGameState('finished');
        }
      }, 1000);
    } else {
      setFeedback('incorrect');
      playSound('error');
      setTimeout(() => setFeedback('idle'), 1000);
    }
  };

  const finishTournament = async () => {
    const rewardXP = score * 5;
    const rewardCoins = Math.floor(score / 2);
    
    await updateProfile({
      xp: (userProfile?.xp || 0) + rewardXP,
      coins: (userProfile?.coins || 0) + rewardCoins
    });
    
    playSound('success');
    navigate('/tournaments');
  };

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="max-w-3xl w-full glass rounded-[40px] p-12 border border-white/10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <TextReveal text="Турнир: " delay={0.1} />
            {tournament?.title || id}
          </h1>
          <div className="text-2xl font-mono font-bold text-orange-500">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
        </div>
        
        {gameState === 'playing' ? (
          <div className="space-y-6">
            <div className="text-white/60 text-lg">Задача {currentTaskIndex + 1} из {tasks.length}:</div>
            <div className="text-xl font-bold text-white">{tasks[currentTaskIndex].desc}</div>
            
            <textarea 
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono"
              placeholder="Введите код..."
            />
            
            <button 
              onClick={checkAnswer}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                feedback === 'correct' ? 'bg-green-500' : feedback === 'incorrect' ? 'bg-red-500' : 'bg-brand-primary'
              }`}
            >
              {feedback === 'correct' ? <CheckCircle2 className="mx-auto" /> : feedback === 'incorrect' ? <X className="mx-auto" /> : 'Проверить'}
            </button>
            <div className="text-center text-white/40">Очки: {score}</div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              <TextReveal text="Турнир завершен!" delay={0.1} />
            </h2>
            <p className="text-xl text-white/60 mb-8">Ваш результат: {score} очков</p>
            <button 
              onClick={finishTournament}
              className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-orange-500 hover:text-white transition-all"
            >
              Забрать награду и вернуться
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

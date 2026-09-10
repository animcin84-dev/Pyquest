import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';
import { CodeEditor } from '../components/CodeEditor';
import type { TestCase } from '../constants/lessons';
import { TOURNAMENTS } from './Tournaments';

interface TrainingTask {
  id: string;
  description: string;
  initialCode: string;
  testCases: TestCase[];
}

const TASKS_BY_TYPE: Record<'speed' | 'logic' | 'boss', TrainingTask[]> = {
  speed: [
    { id: 'sum', description: 'Напишите sum_numbers(a, b), возвращающую сумму a и b.', initialCode: 'def sum_numbers(a, b):\n    pass', testCases: [{ description: '2 + 3 = 5', assertCode: 'assert sum_numbers(2, 3) == 5' }, { description: '-1 + 4 = 3', assertCode: 'assert sum_numbers(-1, 4) == 3' }] },
    { id: 'square', description: 'Напишите square(n), возвращающую квадрат числа n.', initialCode: 'def square(n):\n    pass', testCases: [{ description: 'Квадрат 5', assertCode: 'assert square(5) == 25' }, { description: 'Квадрат -3', assertCode: 'assert square(-3) == 9' }] },
    { id: 'greet', description: "Напишите greet(name), возвращающую строку 'Hello ' + name.", initialCode: 'def greet(name):\n    pass', testCases: [{ description: 'Приветствие Ada', assertCode: "assert greet('Ada') == 'Hello Ada'" }] }
  ],
  logic: [
    { id: 'even', description: 'Напишите is_even(n), возвращающую True для чётного числа.', initialCode: 'def is_even(n):\n    pass', testCases: [{ description: '8 — чётное', assertCode: 'assert is_even(8) is True' }, { description: '7 — нечётное', assertCode: 'assert is_even(7) is False' }] },
    { id: 'positive', description: 'Напишите is_positive(n), возвращающую True только когда n больше нуля.', initialCode: 'def is_positive(n):\n    pass', testCases: [{ description: '1 положительное', assertCode: 'assert is_positive(1) is True' }, { description: '0 не положительное', assertCode: 'assert is_positive(0) is False' }] },
    { id: 'max', description: 'Напишите max_value(a, b), возвращающую большее число.', initialCode: 'def max_value(a, b):\n    pass', testCases: [{ description: 'Сравнение 2 и 9', assertCode: 'assert max_value(2, 9) == 9' }, { description: 'Сравнение -1 и -5', assertCode: 'assert max_value(-1, -5) == -1' }] }
  ],
  boss: [
    { id: 'reverse', description: 'Напишите reverse_text(value), возвращающую перевёрнутую строку.', initialCode: 'def reverse_text(value):\n    pass', testCases: [{ description: 'Переворот строки', assertCode: "assert reverse_text('python') == 'nohtyp'" }] },
    { id: 'length', description: 'Напишите text_length(value), возвращающую длину строки.', initialCode: 'def text_length(value):\n    pass', testCases: [{ description: 'Длина строки', assertCode: "assert text_length('quest') == 5" }] },
    { id: 'upper', description: 'Напишите to_upper(value), возвращающую строку в верхнем регистре.', initialCode: 'def to_upper(value):\n    pass', testCases: [{ description: 'Верхний регистр', assertCode: "assert to_upper('PyQuest') == 'PYQUEST'" }] }
  ]
};

export const TournamentArena = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, claimTournamentReward } = useAuth();
  const tournament = TOURNAMENTS.find(item => item.id === id);
  const tasks = TASKS_BY_TYPE[tournament?.type || 'speed'];
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (!userProfile) navigate('/tournaments');
  }, [userProfile, navigate]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = window.setInterval(() => setTimeLeft(previous => {
      if (previous <= 1) {
        setGameState('finished');
        return 0;
      }
      return previous - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [gameState]);

  const completeTask = () => {
    if (isAdvancing || gameState !== 'playing') return;
    setIsAdvancing(true);
    setScore(previous => previous + 100);
    playSound('success');
    window.setTimeout(() => {
      if (currentTaskIndex === tasks.length - 1) setGameState('finished');
      else setCurrentTaskIndex(previous => previous + 1);
      setIsAdvancing(false);
    }, 700);
  };

  const finishTraining = async () => {
    if (rewardClaimed || !userProfile) return;
    setRewardClaimed(true);
    try {
      if (!id || !(await claimTournamentReward(id))) {
        setRewardClaimed(false);
        return;
      }
      playSound('success');
      navigate('/tournaments');
    } catch {
      setRewardClaimed(false);
    }
  };

  const task = tasks[currentTaskIndex];
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 pb-12 pt-24">
      <div className="glass w-full max-w-4xl rounded-[40px] border border-white/10 p-6 md:p-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">Личная тренировочная серия</div>
            <h1 className="text-2xl font-bold text-white md:text-3xl"><TextReveal text={tournament?.title || 'Тренировка'} delay={0.1} /></h1>
          </div>
          <div className="font-mono text-2xl font-bold text-orange-500">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
        </div>
        {gameState === 'playing' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-white/60"><span>Задача {currentTaskIndex + 1} из {tasks.length}</span><span>Очки: {score}</span></div>
            <p className="text-lg font-bold text-white">{task.description}</p>
            <CodeEditor key={task.id} initialCode={task.initialCode} testCases={task.testCases} lessonId={`training_${tournament?.id}_${task.id}`} onSuccess={completeTask} />
            {isAdvancing && <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Задача засчитана</div>}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <Trophy className="mx-auto mb-6 h-20 w-20 text-yellow-500" />
            <h2 className="mb-4 text-3xl font-bold text-white"><TextReveal text="Серия завершена" delay={0.1} /></h2>
            <p className="mb-3 text-xl text-white/60">Ваш результат: {score} очков</p>
            <p className="mb-8 text-sm text-white/40">Награда: {score * 5} XP и {Math.floor(score / 2)} монет.</p>
            <button onClick={finishTraining} disabled={rewardClaimed} className="rounded-full bg-white px-8 py-4 font-bold text-black transition-all hover:bg-orange-500 hover:text-white disabled:cursor-wait disabled:opacity-60">
              {rewardClaimed ? 'Сохраняем награду…' : 'Забрать награду и вернуться'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

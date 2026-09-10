import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronRight, Code2, Brain, Swords } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { useNavigate } from 'react-router-dom';
import { TextReveal } from '../components/TextReveal';

export interface Tournament {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'speed' | 'logic' | 'boss';
}

// These are single-player training series. They intentionally do not claim a
// global ranking or a participant count until that data is backed by Firestore.
export const TOURNAMENTS: Tournament[] = [
  { id: 't_1', title: 'Python Speed Masters', description: 'Три короткие задачи на скорость и аккуратный код.', reward: 1500, type: 'speed' },
  { id: 't_2', title: 'Logic Gates', description: 'Проверьте условия, сравнения и логику в трёх задачах.', reward: 1500, type: 'logic' },
  { id: 't_3', title: 'Boss Rush', description: 'Серия задач со строками и списками для продвинутой разминки.', reward: 1500, type: 'boss' },
  { id: 't_4', title: 'Data Sprint', description: 'Практика простых функций и обработки значений.', reward: 1500, type: 'logic' },
  { id: 't_5', title: 'Web Dev Marathon', description: 'Быстрые упражнения на функции Python.', reward: 1500, type: 'speed' }
];

const typeMeta = {
  speed: { label: 'Скорость', icon: Code2, gradient: 'from-blue-500 to-cyan-500' },
  logic: { label: 'Логика', icon: Brain, gradient: 'from-purple-500 to-pink-500' },
  boss: { label: 'Сложный режим', icon: Swords, gradient: 'from-red-500 to-orange-500' }
};

export function Tournaments() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const startTraining = (id: string) => {
    if (!userProfile) {
      playSound('error');
      window.alert('Для запуска тренировочной серии войдите в аккаунт.');
      return;
    }
    playSound('click');
    navigate(`/tournaments/${id}`);
  };

  return (
    <div className="min-h-screen bg-transparent px-4 pb-12 pt-32">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-medium uppercase tracking-wider text-orange-500">
            <Trophy className="h-4 w-4" /> Тренировочные серии
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
            <TextReveal text="Практика" delay={0.1} /> <span className="serif italic text-orange-500"><TextReveal text="без фейкового рейтинга" delay={0.3} /></span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/45">
            Каждая серия — личное испытание из трёх задач с проверкой реального Python-кода в браузере. Награда зависит от пройденных задач.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {TOURNAMENTS.map((tournament, index) => {
            const meta = typeMeta[tournament.type];
            const Icon = meta.icon;
            return (
              <motion.article
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] p-8 transition-all duration-500 hover:border-white/15"
              >
                <div className={`absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r ${meta.gradient} px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white`}>
                  {meta.label}
                </div>
                <Icon className="mb-8 h-10 w-10 text-orange-500" />
                <h2 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-orange-500">{tournament.title}</h2>
                <p className="mb-8 min-h-12 text-sm leading-relaxed text-white/45">{tournament.description}</p>
                <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Максимальная награда за серию</div>
                  <div className="mt-1 text-xl font-bold text-orange-500">до {tournament.reward} XP + 150 монет</div>
                </div>
                <button onClick={() => startTraining(tournament.id)} className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-orange-500 hover:text-white">
                  Начать серию <ChevronRight className="ml-2 inline-block h-4 w-4" />
                </button>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

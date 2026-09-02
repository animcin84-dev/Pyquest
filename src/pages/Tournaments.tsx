import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Trophy, Calendar, Users, Zap, Star, Shield, Timer, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Layout';
import { TextReveal } from '../components/TextReveal';

interface Tournament {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  participants: number;
  maxParticipants: number;
  prizePool: number;
  status: 'upcoming' | 'active' | 'finished';
  type: 'speed' | 'logic' | 'boss';
}

export const TOURNAMENTS: Tournament[] = [
  {
    id: 't_1',
    title: 'Python Speed Masters',
    description: 'Соревнование на скорость написания кода. Кто быстрее решит 10 задач?',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    participants: 45,
    maxParticipants: 100,
    prizePool: 5000,
    status: 'active',
    type: 'speed'
  },
  {
    id: 't_2',
    title: 'Logic Gates Championship',
    description: 'Турнир по решению логических задач. Проверь свою смекалку!',
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    participants: 82,
    maxParticipants: 150,
    prizePool: 7500,
    status: 'upcoming',
    type: 'logic'
  },
  {
    id: 't_3',
    title: 'Boss Rush Weekend',
    description: 'Победите как можно больше боссов за выходные. Максимальный уровень сложности!',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    participants: 12,
    maxParticipants: 50,
    prizePool: 10000,
    status: 'upcoming',
    type: 'boss'
  },
  {
    id: 't_4',
    title: 'Data Science Sprint',
    description: 'Анализ данных в реальном времени. Найди закономерности!',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    participants: 30,
    maxParticipants: 80,
    prizePool: 6000,
    status: 'upcoming',
    type: 'logic'
  },
  {
    id: 't_5',
    title: 'Web Dev Marathon',
    description: 'Создай функциональный компонент за минимальное время.',
    startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    participants: 55,
    maxParticipants: 120,
    prizePool: 8000,
    status: 'upcoming',
    type: 'speed'
  }
];

export function Tournaments() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'finished'>('active');
  const [joinedTournaments, setJoinedTournaments] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const handleJoin = (id: string) => {
    if (!userProfile) {
      playSound('error');
      alert('Только зарегистрированные пользователи могут участвовать в турнирах. Пожалуйста, войдите в аккаунт.');
      return;
    }
    if (joinedTournaments.includes(id)) return;
    playSound('success');
    setJoinedTournaments([...joinedTournaments, id]);
    
    const tournamentIndex = TOURNAMENTS.findIndex(t => t.id === id);
    if (tournamentIndex !== -1) {
      TOURNAMENTS[tournamentIndex].participants += 1;
    }
  };

  const filteredTournaments = TOURNAMENTS.filter(t => t.status === activeTab);
  const isGuest = !userProfile;

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent relative overflow-hidden">
      {}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-red-500/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/10 blur-[200px] rounded-full mix-blend-screen" />
      </motion.div>


      <div className="pt-32 pb-12 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-4"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Турниры и события</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight"
          >
            <TextReveal text="Стань" delay={0.1} /> <span className="text-orange-500 italic serif"><TextReveal text="легендой" delay={0.3} /></span> <TextReveal text="кода" delay={0.5} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg max-w-2xl mx-auto"
          >
            Участвуй в еженедельных турнирах, соревнуйся с лучшими и выигрывай ценные призы.
          </motion.p>
        </header>

        <div className="flex justify-center gap-4 mb-12">
          <TabButton 
            active={activeTab === 'active'} 
            onClick={() => setActiveTab('active')} 
            label="Текущие" 
            icon={<Zap className="w-4 h-4" />}
          />
          <TabButton 
            active={activeTab === 'upcoming'} 
            onClick={() => setActiveTab('upcoming')} 
            label="Предстоящие" 
            icon={<Calendar className="w-4 h-4" />}
          />
          <TabButton 
            active={activeTab === 'finished'} 
            onClick={() => setActiveTab('finished')} 
            label="Завершенные" 
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="wait">
            {filteredTournaments.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-20 text-center bg-[#0a0a0a] rounded-3xl border border-white/5"
              >
                <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-medium">Турниров в этой категории пока нет.</p>
              </motion.div>
            ) : (
              filteredTournaments.map((tournament: Tournament, index: number) => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament} 
                  index={index}
                  isJoined={joinedTournaments.includes(tournament.id)}
                  isGuest={isGuest}
                  onJoin={() => handleJoin(tournament.id)}
                  onStart={() => navigate(`/tournament/${tournament.id}`)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 p-12 rounded-[40px] bg-gradient-to-br from-orange-500/10 via-transparent to-indigo-500/10 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-4">Сезонный рейтинг</h2>
              <p className="text-white/40 max-w-md">
                Зарабатывай очки турниров, чтобы подняться в глобальном рейтинге сезона и получить эксклюзивные награды в конце месяца.
              </p>
            </div>
            <button 
              onClick={() => {
                playSound('click');
                alert('Функция просмотра рейтинга будет доступна в ближайшем обновлении!');
              }}
              className="px-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-orange-500 hover:text-white transition-all duration-500 group"
            >
              Посмотреть рейтинг
              <ChevronRight className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={() => {
        playSound('click');
        onClick();
      }}
      className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-500 flex items-center gap-3 ${
        active 
          ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20 scale-105' 
          : 'bg-[#0a0a0a] text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const TournamentCard: React.FC<{ tournament: Tournament, index: number, isJoined: boolean, isGuest: boolean, onJoin: () => void, onStart: () => void }> = ({ tournament, index, isJoined, isGuest, onJoin, onStart }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const target = tournament.status === 'upcoming' ? tournament.startDate : tournament.endDate;
      const diff = target.getTime() - Date.now();
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days > 0 ? days + 'д ' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const typeColors = {
    speed: 'from-blue-500 to-cyan-500',
    logic: 'from-purple-500 to-pink-500',
    boss: 'from-red-500 to-orange-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className="group bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-all duration-500 relative overflow-hidden"
    >
      {}
      <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl bg-gradient-to-r ${typeColors[tournament.type]} text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg`}>
        {tournament.type}
      </div>

      <div className="flex flex-col h-full">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-500 transition-colors">{tournament.title}</h3>
          <p className="text-white/40 text-sm leading-relaxed">{tournament.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">
              <Timer className="w-3 h-3" />
              {tournament.status === 'upcoming' ? 'До начала' : 'До конца'}
            </div>
            <div className="text-xl font-mono font-bold text-white">{timeLeft}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-wider mb-1">
              <Star className="w-3 h-3 text-orange-500" />
              Призовой фонд
            </div>
            <div className="text-xl font-bold text-orange-500">{tournament.prizePool} <span className="text-xs">монет</span></div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/40 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i + index}/32/32`} alt="user" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <span className="text-white/40 text-xs font-medium">
              <span className="text-white font-bold">{tournament.participants}</span> / {tournament.maxParticipants} участников
            </span>
          </div>

          <button
            onClick={onJoin}
            disabled={isJoined || tournament.status === 'finished'}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              isGuest
                ? 'bg-white/5 text-white/40 hover:bg-white/10'
                : isJoined
                ? 'bg-emerald-500/10 text-emerald-500 cursor-default flex items-center gap-2'
                : tournament.status === 'finished'
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-white text-black hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isGuest ? 'Войдите для участия' : isJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Участвую
              </>
            ) : tournament.status === 'finished' ? 'Завершен' : 'Участвовать'}
          </button>
          {isJoined && tournament.status === 'active' && (
            <button
              onClick={onStart}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 ml-2"
            >
              Начать
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

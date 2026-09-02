import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Layout';
import { Home } from './pages/Home';
import { Toaster } from 'sonner';
import * as Icons from 'lucide-react';
import { Loader2 } from 'lucide-react';


const Pathways = React.lazy(() => import('./pages/Pathways').then(m => ({ default: m.Pathways })));
const LessonDetail = React.lazy(() => import('./pages/LessonDetail').then(m => ({ default: m.LessonDetail })));
const PythonGenesis = React.lazy(() => import('./pages/lessons/PythonGenesis').then(m => ({ default: m.PythonGenesis })));
const DataVessels = React.lazy(() => import('./pages/lessons/DataVessels').then(m => ({ default: m.DataVessels })));
const TheCollection = React.lazy(() => import('./pages/lessons/TheCollection').then(m => ({ default: m.TheCollection })));
const TemporalLoops = React.lazy(() => import('./pages/lessons/TemporalLoops').then(m => ({ default: m.TemporalLoops })));
const Community = React.lazy(() => import('./pages/Community').then(m => ({ default: m.Community })));
const Arcade = React.lazy(() => import('./pages/Arcade').then(m => ({ default: m.Arcade })));
const Sandbox = React.lazy(() => import('./pages/Sandbox').then(m => ({ default: m.Sandbox })));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Shop = React.lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Inventory = React.lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Admin = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Friends = React.lazy(() => import('./pages/Friends').then(m => ({ default: m.Friends })));
const Tournaments = React.lazy(() => import('./pages/Tournaments').then(m => ({ default: m.Tournaments })));
const TournamentArena = React.lazy(() => import('./pages/TournamentArena').then(m => ({ default: m.TournamentArena })));
const Duels = React.lazy(() => import('./pages/Duels').then(m => ({ default: m.Duels })));
const BossArena = React.lazy(() => import('./pages/BossArena').then(m => ({ default: m.BossArena })));
const CommunityGallery = React.lazy(() => import('./pages/CommunityGallery').then(m => ({ default: m.CommunityGallery })));
const DailyChallenges = React.lazy(() => import('./pages/DailyChallenges').then(m => ({ default: m.DailyChallenges })));
const Guilds = React.lazy(() => import('./pages/Guilds').then(m => ({ default: m.Guilds })));
const SkillTree = React.lazy(() => import('./pages/SkillTree').then(m => ({ default: m.SkillTree })));
const UserProfilePublic = React.lazy(() => import('./pages/UserProfilePublic').then(m => ({ default: m.UserProfilePublic })));

import { FloatingChat } from './components/FloatingChat';
import { MentorCompanion } from './components/MentorCompanion';
import { PetCompanion } from './components/PetCompanion';
import { QuestSidebar } from './components/QuestSidebar';
import { GlowingCursor } from './components/GlowingCursor';
import { FloatingParticles } from './components/FloatingParticles';

const PageLoading = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-dark/80 backdrop-blur-md">
    <div className="relative">
      <div className="absolute -inset-4 bg-brand-primary/20 blur-2xl rounded-full animate-pulse" />
      <Loader2 className="w-12 h-12 text-brand-primary animate-spin relative z-10" />
    </div>
    <div className="mt-6 text-white/40 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
      Инициализация нейромодуля...
    </div>
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const FooterModal = ({ isOpen, onClose, title, content }: { isOpen: boolean, onClose: () => void, title: string, content: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl glass rounded-[40px] p-8 md:p-12 border border-white/10 max-h-[80vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors">
            <Icons.X className="w-6 h-6 text-white/40" />
          </button>
          <h2 className="text-3xl font-display font-bold mb-8 text-gradient">{title}</h2>
          <div className="prose prose-invert max-w-none text-white/70 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/pathways" element={<Pathways />} />
      <Route path="/lesson/intro" element={<PythonGenesis />} />
      <Route path="/lesson/variables" element={<DataVessels />} />
      <Route path="/lesson/lists" element={<TheCollection />} />
      <Route path="/lesson/loops" element={<TemporalLoops />} />
      <Route path="/lesson/:id" element={<LessonDetail />} />
      <Route path="/community" element={<Community />} />
      <Route path="/arcade" element={<Arcade />} />
      <Route path="/sandbox" element={<Sandbox />} />
      <Route path="/sandbox/:id" element={<Sandbox />} />
      <Route path="/collaborative" element={<Sandbox />} />
      <Route path="/daily" element={<DailyChallenges />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/tournaments/:id" element={<TournamentArena />} />
      <Route path="/duels" element={<Duels />} />
      <Route path="/boss-arena" element={<BossArena />} />
      <Route path="/gallery" element={<CommunityGallery />} />
      <Route path="/guilds" element={<Guilds />} />
      <Route path="/skill-tree" element={<SkillTree />} />
      <Route path="/u/:username" element={<UserProfilePublic />} />
    </Routes>
  );
};

const AppContent = () => {
  const [footerModal, setFooterModal] = useState<{ isOpen: boolean, title: string, content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  const showFooterContent = (type: 'privacy' | 'terms' | 'sitemap') => {
    const contents = {
      privacy: `Политика конфиденциальности PyQuest

Мы серьезно относимся к защите ваших данных. 
1. Сбор данных: Мы собираем только необходимую информацию для работы профиля (имя пользователя, XP, уровень).
2. Использование: Ваши данные используются исключительно для игрового процесса и таблицы лидеров.
3. Безопасность: Мы используем современные методы шифрования для защиты вашего аккаунта.
4. Сторонние сервисы: Мы используем Google Auth для входа и Firebase для хранения данных.`,
      terms: `Условия использования PyQuest

1. Принятие условий: Используя PyQuest, вы соглашаетесь с данными правилами.
2. Поведение: Запрещено использование читов, оскорбление других участников в чате.
3. Контент: Весь обучающий контент является собственностью PyQuest Academy.
4. Отказ от ответственности: Мы не несем ответственности за ошибки в коде, написанном пользователями.`,
      sitemap: `Карта сайта PyQuest

- Главная: Обзор приключения
- Обучение: Все уровни и квесты
- Сообщество: Чат и новости
- Дуэли: Битвы кодеров
- Профиль: Ваши достижения и настройки`
    };

    setFooterModal({
      isOpen: true,
      title: type === 'privacy' ? 'Privacy Policy' : type === 'terms' ? 'Terms of Service' : 'Sitemap',
      content: contents[type]
    });
  };

  const { performanceSettings } = useAuth();

  return (
    <Router>
      <ScrollToTop />
      <GlowingCursor />
      <div className="relative min-h-screen bg-bg-dark text-white overflow-hidden">
        
        {}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {!performanceSettings.lowPerfMode && (
            <>
              {}
              <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-primary/10 blur-[150px] rounded-full opacity-40 pointer-events-none will-change-transform" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-brand-secondary/10 blur-[180px] rounded-full opacity-40 pointer-events-none will-change-transform" />
              
              {}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </>
          )}
          
          {}
          {performanceSettings.lowPerfMode && (
            <div className="absolute inset-0 bg-bg-dark" />
          )}
          
          {}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <g stroke="#2a2a2a" strokeWidth="1" fill="none">
              <path d="M 15 30 L 25 45 L 40 40 L 55 25 L 70 35 L 85 30" />
              <path d="M 25 45 L 30 65 L 45 75 L 60 60 L 75 65 L 85 50" />
              <path d="M 40 40 L 60 60" />
              <path d="M 70 35 L 85 50" />
              <path d="M 30 65 L 15 70" />
            </g>
            <g fill="#333">
              <circle cx="15" cy="30" r="3" />
              <circle cx="25" cy="45" r="4" />
              <circle cx="40" cy="40" r="3" />
              <circle cx="55" cy="25" r="4" />
              <circle cx="70" cy="35" r="3" />
              <circle cx="85" cy="30" r="4" />
              <circle cx="30" cy="65" r="4" />
              <circle cx="45" cy="75" r="3" />
              <circle cx="60" cy="60" r="4" />
              <circle cx="75" cy="65" r="3" />
              <circle cx="85" cy="50" r="4" />
              <circle cx="15" cy="70" r="3" />
            </g>
          </svg>
        </div>

        <div className="relative z-10">
          <Toaster position="top-right" richColors theme="dark" />
          <QuestSidebar />
          <Navbar />
          
          <Suspense fallback={<PageLoading />}>
            <AnimatedRoutes />
          </Suspense>
        
        <MentorCompanion />
        <PetCompanion />

        {}
        <footer className="py-20 px-6 border-t border-white/5 bg-black/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <div className="flex items-center gap-2">
                <Icons.Terminal className="text-brand-primary w-6 h-6" />
                <span className="text-xl font-display font-bold">PyQuest</span>
              </div>
              <div className="flex gap-8 text-sm text-white/40">
                <button onClick={() => showFooterContent('privacy')} className="hover:text-white transition-colors">Privacy</button>
                <button onClick={() => showFooterContent('terms')} className="hover:text-white transition-colors">Terms</button>
                <button onClick={() => showFooterContent('sitemap')} className="hover:text-white transition-colors">Sitemap</button>
              </div>
              <p className="text-sm text-white/20">© 2026 PyQuest Academy. All rights reserved.</p>
            </div>
            <div className="text-center text-[10px] text-white/10 uppercase tracking-[0.2em]">
              Сделано с любовью для будущих мастеров Python
            </div>
          </div>
        </footer>

        <FooterModal 
          isOpen={footerModal.isOpen}
          onClose={() => setFooterModal(prev => ({ ...prev, isOpen: false }))}
          title={footerModal.title}
          content={footerModal.content}
        />
        </div>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

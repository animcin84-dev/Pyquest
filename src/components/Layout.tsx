import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  Terminal, Sparkles, ChevronRight, User, LogOut, X, Gamepad2, Trophy, Swords, Upload, Camera, Shield, FileText, Map, Gift, Zap, Volume2, VolumeX, BookOpen, Users, ShoppingBag, Coins, Sword, Menu, ShoppingCart, TerminalSquare, Backpack, ShieldAlert, ChevronDown, Layout, Code2, Rocket, MessageSquare, Brain, Activity
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LevelUpModal } from './LevelUpModal';
import { FloatingChat } from './FloatingChat';
import { playSound, toggleMute, getIsMuted } from '../utils/sounds';
import { MagneticButton } from './MagneticButton';
import { TextReveal } from './TextReveal';
import { SocialPanel } from './SocialPanel';
import { calculateRank, getRankColor } from '../utils/ranks';
import Spline from '@splinetool/react-spline';

const getRankProgress = (level: number) => {
  const ranks = [
    { rank: 'F', level: 0 },
    { rank: 'E', level: 6 },
    { rank: 'D', level: 11 },
    { rank: 'C', level: 21 },
    { rank: 'B', level: 31 },
    { rank: 'A', level: 41 },
    { rank: 'S', level: 51 },
    { rank: 'S+', level: 61 },
    { rank: 'SS', level: 71 },
    { rank: 'SS+', level: 81 },
    { rank: 'SSS', level: 86 },
    { rank: 'SSS+', level: 91 },
    { rank: 'GOD', level: 96 },
    { rank: 'ETERNAL', level: 101 },
  ];
  
  let currentRankIndex = 0;
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (level >= ranks[i].level) {
      currentRankIndex = i;
      break;
    }
  }
  const currentRank = ranks[currentRankIndex];
  const nextRank = ranks[currentRankIndex + 1];
  
  if (!nextRank) return 100;
  
  const progress = ((level - currentRank.level) / (nextRank.level - currentRank.level)) * 100;
  return Math.max(0, Math.min(progress, 100));
};

export const Navbar = () => {
  const location = useLocation();
  const autoHide = location.pathname.startsWith('/lesson');
  const { 
    currentUser, userProfile, logout, login, register, loginWithGoogle, 
    levelUp, resetLevelUp, claimDailyReward, canClaimReward, isAdmin,
    performanceSettings, setLowPerfMode 
  } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showRewardSuccess, setShowRewardSuccess] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [isMuted, setIsMuted] = useState(getIsMuted());
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [socialChatUserId, setSocialChatUserId] = useState<string | null>(null);

  const handleToggleMute = () => {
    const newMuted = toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) playSound('click');
  };

  useEffect(() => {
    const handleOpenAuth = () => {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    };
    window.addEventListener('open-auth-modal', handleOpenAuth);
    
    const handleOpenChat = (e: any) => {
      setSocialChatUserId(e.detail?.userId || null);
      setIsSocialOpen(true);
    };
    window.addEventListener('open-private-chat', handleOpenChat);

    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('open-private-chat', handleOpenChat);
    };
  }, []);

  useEffect(() => {
    if (levelUp) {
      playSound('levelUp');
    }
  }, [levelUp]);

  const isRewardAvailable = canClaimReward();

  const handleClaimReward = async () => {
    if (!isRewardAvailable || isClaimingReward) {
      playSound('error');
      return;
    }
    setIsClaimingReward(true);
    try {
      const success = await claimDailyReward();
      if (success) {
        playSound('success');
        setShowRewardSuccess(true);
        setTimeout(() => setShowRewardSuccess(false), 3000);
      } else {
        playSound('error');
      }
    } finally {
      setIsClaimingReward(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthLoading(true);
    try {
      if (authMode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      playSound('success');
      setIsAuthModalOpen(false);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      playSound('error');
      if (err.message?.includes('auth/operation-not-allowed')) {
        setError('Ошибка: Для входа по никнейму необходимо включить провайдер "Email/Password" в консоли Firebase (Authentication -> Sign-in method).');
      } else if (err.message?.includes('auth/invalid-credential') || err.message?.includes('auth/wrong-password')) {
        setError('Ошибка: Неверный никнейм или пароль.');
      } else if (err.message?.includes('auth/user-not-found')) {
        setError('Ошибка: Пользователь с таким никнеймом не найден.');
      } else if (err.message?.includes('auth/email-already-in-use')) {
        setError('Ошибка: Этот никнейм уже занят.');
      } else {
        setError(err.message || 'Ошибка аутентификации');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsAuthLoading(true);
    try {
      await loginWithGoogle();
      playSound('success');
      setIsAuthModalOpen(false);
    } catch (err: any) {
      playSound('error');
      setError(err.message || 'Ошибка входа через Google');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const navGroups = [
    {
      id: 'learn',
      label: 'Обучение',
      icon: <BookOpen className="w-4 h-4" />,
      items: [
        { to: '/pathways', icon: <Map className="w-4 h-4" />, label: 'Пути развития' },
        { to: '/skill-tree', icon: <Brain className="w-4 h-4" />, label: 'Древо навыков' },
        { to: '/sandbox', icon: <TerminalSquare className="w-4 h-4" />, label: 'Песочница' },
        { to: '/collaborative', icon: <Users className="w-4 h-4" />, label: 'Коллаборация' },
      ]
    },
    {
      id: 'play',
      label: 'Активности',
      icon: <Gamepad2 className="w-4 h-4" />,
      items: [
        { to: '/daily', icon: <Zap className="w-4 h-4" />, label: 'Ежедневные' },
        { to: '/arcade', icon: <Gamepad2 className="w-4 h-4" />, label: 'Аркада' },
        { to: '/duels', icon: <Swords className="w-4 h-4" />, label: 'Дуэли' },
        { to: '/boss-arena', icon: <Sword className="w-4 h-4" />, label: 'Босс-Арена' },
        { to: '/tournaments', icon: <Trophy className="w-4 h-4" />, label: 'Турниры' },
      ]
    },
    {
      id: 'social',
      label: 'Сообщество',
      icon: <Users className="w-4 h-4" />,
      items: [
        { to: '/community', icon: <Users className="w-4 h-4" />, label: 'Лента' },
        { to: '/gallery', icon: <Layout className="w-4 h-4" />, label: 'Галерея кода' },
        { to: '/leaderboard', icon: <Sparkles className="w-4 h-4" />, label: 'Рейтинг' },
        { to: '/friends', icon: <Users className="w-4 h-4" />, label: 'Друзья' },
        { to: '/guilds', icon: <Shield className="w-4 h-4" />, label: 'Гильдии' },
      ]
    },
    {
      id: 'store',
      label: 'Магазин',
      icon: <ShoppingBag className="w-4 h-4" />,
      items: [
        { to: '/shop', icon: <ShoppingBag className="w-4 h-4" />, label: 'Маркет' },
        { to: '/inventory', icon: <Backpack className="w-4 h-4" />, label: 'Инвентарь' },
      ]
    }
  ];

  const handleMouseEnter = (id: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);

  return (
    <>
      {autoHide && (
        <div 
          className="fixed top-0 left-0 right-0 h-10 z-[60] flex items-start justify-center cursor-pointer pointer-events-auto"
          onMouseEnter={() => setIsNavHovered(true)}
        >
          <motion.div 
            animate={{ opacity: isNavHovered ? 0 : 1 }}
            className="px-6 py-0.5 glass rounded-b-xl border-b border-x border-white/10 flex flex-col items-center pointer-events-none shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-[#050505]/90 backdrop-blur-md"
          >
            <ChevronDown className="w-5 h-5 text-brand-primary animate-bounce mt-1" />
            <span className="text-[9px] font-black tracking-[0.2em] text-white/50 uppercase pb-1">Главное МЕНЮ</span>
          </motion.div>
        </div>
      )}

      <motion.nav 
        initial={autoHide ? { y: "-100%" } : { y: 0 }}
        animate={{ y: (!autoHide || isNavHovered || isMobileMenuOpen || isAuthModalOpen || isProfileModalOpen) ? 0 : "-100%" }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 py-3 pointer-events-none"
      >
        <div 
          onMouseEnter={() => setIsNavHovered(true)}
          onMouseLeave={() => setIsNavHovered(false)}
          className="max-w-[1800px] mx-auto flex items-center justify-between glass rounded-2xl md:rounded-[2rem] px-4 md:px-8 py-2 md:py-3 border border-white/10 shadow-xl pointer-events-auto"
        >
          <Link to="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg md:rounded-xl flex items-center justify-center glow-shadow">
              <Terminal className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-xl md:text-2xl font-display font-black tracking-tighter">PyQuest</span>
          </Link>
          
          {}
          <div className="hidden xl:flex items-center gap-10 2xl:gap-14 text-sm font-bold text-white/60 mx-8 2xl:mx-12">
            {navGroups.map((group) => (
              <div 
                key={group.id}
                className="relative group"
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseLeave={handleMouseLeave}
              >
                <button className={`flex items-center gap-2 py-2 transition-colors hover:text-white ${activeDropdown === group.id ? 'text-white' : ''}`}>
                  {group.icon}
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === group.id ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === group.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-56 glass rounded-2xl p-2 border border-white/10 shadow-2xl backdrop-blur-3xl z-[110]"
                    >
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-brand-primary transition-all group/item"
                        >
                          <div className="p-2 bg-white/5 rounded-lg group-hover/item:bg-brand-primary/20 group-hover/item:text-brand-primary transition-colors">
                            {item.icon}
                          </div>
                          <span className="font-bold">{item.label}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 hover:text-red-500 transition-colors font-black text-red-500/80 group">
                <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>АДМИН</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {currentUser && userProfile ? (
              <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
                {}
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={handleClaimReward}
                    disabled={!isRewardAvailable || isClaimingReward}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all group relative ${
                      isRewardAvailable && !isClaimingReward
                        ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-500 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                        : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {isClaimingReward ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white bg-transparent rounded-full animate-spin" />
                    ) : (
                      <Gift className={`w-4 h-4 ${isRewardAvailable ? 'group-hover:rotate-12 animate-bounce' : ''} transition-transform`} />
                    )}
                    <span className="text-xs font-black uppercase tracking-tighter">
                      {isClaimingReward ? 'Загрузка...' : isRewardAvailable ? 'Награда!' : 'Ждите'}
                    </span>
                  </button>

                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <div className="flex items-center gap-2 px-3 2xl:px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-[10px] 2xl:text-xs font-black">{userProfile.xp} XP / Lvl {userProfile.level}</span>
                    </div>
                    {}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getRankProgress(userProfile.level || 1)}%` }}
                        className={`h-full bg-gradient-to-r ${getRankColor(calculateRank(userProfile.level || 1))}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 2xl:px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500">
                    <Coins className="w-3.5 h-3.5" />
                    <span className="text-[10px] 2xl:text-xs font-black">{userProfile.coins || 0}</span>
                  </div>
                </div>

                {}
                <div className="flex items-center gap-2 md:gap-4 md:border-l border-white/10 md:pl-6">
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className="relative">
                      {userProfile.avatar ? (
                        <img src={userProfile.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl object-cover border border-brand-primary/30" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-xs md:text-sm">
                          {userProfile.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-lg text-[7px] font-black bg-gradient-to-br ${getRankColor(calculateRank(userProfile.level || 1))} text-white border border-white/20 shadow-lg z-10`}>
                        {calculateRank(userProfile.level || 1)}
                      </div>
                    </div>
                    <span className="hidden sm:inline-block text-xs md:text-sm font-black text-white tracking-tight">
                      {userProfile.username}
                    </span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2">
                    <button 
                      onClick={handleToggleMute}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/40" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-primary" />}
                    </button>
                    <button 
                      onClick={() => setLowPerfMode(!performanceSettings.lowPerfMode)}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-colors border ${performanceSettings.lowPerfMode ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'}`}
                      title={performanceSettings.lowPerfMode ? "Экономный режим: ВКЛ" : "Обычный режим"}
                    >
                      <Activity className={`w-3.5 h-3.5 md:w-4 md:h-4 ${performanceSettings.lowPerfMode ? 'text-yellow-500' : 'text-white/40'}`} />
                    </button>
                    <button 
                      onClick={() => setIsSocialOpen(true)}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 relative"
                      title="Сообщения"
                    >
                      <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60" />
                      <div className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                    </button>
                    <button 
                      onClick={logout}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all border border-red-500/20"
                    >
                      <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 md:px-8 py-2 md:py-3 bg-white text-black rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  Войти
                  <ChevronRight className="w-3 md:w-4 h-3 md:h-4" />
                </button>
              </div>
            )}

            {}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[45] pt-24 pb-10 px-4 xl:hidden pointer-events-auto overflow-y-auto"
            >
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[-1]" onClick={() => setIsMobileMenuOpen(false)} />
              
              <div className="space-y-6">
                {navGroups.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-4 flex items-center gap-2">
                      {group.icon} {group.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                        >
                          <div className="text-brand-primary">{item.icon}</div>
                          <span className="font-bold text-lg">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500"
                  >
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-bold text-lg uppercase tracking-tight">Админ-Панель</span>
                  </Link>
                )}

                {currentUser && (
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                        <Coins className="w-4 h-4" />
                        <span className="font-bold">{userProfile?.coins || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/20">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">{userProfile?.xp || 0} XP</span>
                      </div>
                    </div>
                    <button 
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30 font-bold"
                    >
                      <LogOut className="w-5 h-5" />
                      Выйти из аккаунта
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>


      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass rounded-3xl p-8 border border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center glow-shadow">
                  <User className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold">
                    {authMode === 'login' ? 'С возвращением' : 'Присоединяйтесь к PyQuest'}
                  </h2>
                  <p className="text-sm text-white/40">
                    {authMode === 'login' ? 'Введите свои данные, чтобы продолжить.' : 'Создайте никнейм и начните обучение.'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Никнейм</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="например, CodeNinja99"
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Пароль</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl font-bold text-white glow-shadow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  {isAuthLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Подождите...
                    </div>
                  ) : (
                    authMode === 'login' ? 'Войти' : 'Создать аккаунт'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0a0a0a] px-2 text-white/40">Или</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isAuthLoading}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Войти через Google
              </button>

              <div className="mt-6 text-center text-sm text-white/40">
                {authMode === 'login' ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-brand-primary font-bold hover:underline"
                >
                  {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LevelUpModal 
        isOpen={levelUp !== null} 
        level={levelUp || 0} 
        onClose={resetLevelUp} 
      />

      <AnimatePresence>
        {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
      </AnimatePresence>

      <SocialPanel 
        isOpen={isSocialOpen} 
        onClose={() => {
          setIsSocialOpen(false);
          setSocialChatUserId(null);
        }} 
        initialChatUserId={socialChatUserId}
      />
    </>
  );
};

const ProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { userProfile, updateProfile } = useAuth();
  const [username, setUsername] = useState(userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ username, bio, avatar });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Пожалуйста, выберите изображение до 2МБ.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setAvatar(compressed);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md glass rounded-3xl p-8 border border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-3xl font-display font-bold mb-8">Настройки Профиля</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
            <div className="col-span-3 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest">Прогресс Ранга</div>
                <div className={`text-sm font-black bg-gradient-to-br ${getRankColor(calculateRank(userProfile?.level || 1))} bg-clip-text text-transparent`}>
                  {calculateRank(userProfile?.level || 1)}
                </div>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getRankProgress(userProfile?.level || 1)}%` }}
                  className={`h-full bg-gradient-to-r ${getRankColor(calculateRank(userProfile?.level || 1))}`}
                />
              </div>
              <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-widest">
                <span>LVL {userProfile?.level}</span>
                <span>След. ранг: {getRankProgress(userProfile?.level || 1).toFixed(0)}%</span>
              </div>
            </div>
          
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Выберите Аватар</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {avatars.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${avatar === url ? 'border-brand-primary scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary/10 transition-all ${avatar.startsWith('data:') ? 'border-brand-primary bg-brand-primary/10' : ''}`}
              >
                <Camera className="w-4 h-4 text-white/40" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-brand-primary/30 shadow-xl">
              <img src={avatar || avatars[0]} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Никнейм</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">О себе</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Расскажите о своем пути в Python..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors resize-none"
            />
          </div>

          {userProfile?.inventory && userProfile.inventory.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Инвентарь</label>
              <div className="flex flex-wrap gap-2">
                {userProfile.inventory.map(item => (
                  <div key={item.id} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/60 font-bold uppercase tracking-wider">
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export const Hero = ({ onSyllabusClick }: { onSyllabusClick?: () => void }) => {
  const { performanceSettings } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isHovered = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [40, -40]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-40, 40]), { stiffness: 100, damping: 30 });
  const z = useSpring(useTransform(isHovered, [0, 1], [0, 250]), { stiffness: 100, damping: 30 });
  const scale = useSpring(useTransform(isHovered, [0, 1], [1, 1.15]), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    isHovered.set(1);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    isHovered.set(0);
  };

  return (
    <section 
      className="relative min-h-[700px] md:min-h-screen flex flex-col items-center pt-24 md:pt-32 lg:pt-28 pb-10 md:pb-20 z-20"
      style={{ perspective: 2000 }}
    >
      {}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-primary/20 blur-[150px] rounded-full pointer-events-none opacity-60" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand-secondary/20 blur-[150px] rounded-full pointer-events-none opacity-60" />

      {}
      <div className="lg:hidden flex flex-col items-center gap-12 w-full px-6 z-30 mt-12">
        <div className="text-center">
          <h1 className="text-5xl font-mono font-bold drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">
            <span className="text-purple-400">class</span> <TextReveal text="PYTHON:" className="inline-block text-blue-400" delay={0.1} />
          </h1>
          <div className="text-xl font-mono text-green-400 mt-4">
            <TextReveal text='""" Освой играя """' delay={0.5} />
          </div>
        </div>

        <motion.div
          style={{ rotateX, rotateY, z, scale, transformStyle: "preserve-3d" }}
          className="w-full max-w-lg mx-auto z-20 pointer-events-auto"
        >
          <motion.div 
            animate={{ y: [0, -15, 0], rotateZ: [0, 1, -1, 0] }}
            transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, rotateZ: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
            className="relative w-full h-[450px] bg-[#0a0a0a]/90 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(99,102,241,0.3)] z-10"
            style={{ z: 120 }}
          >
            {}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 pointer-events-none z-10" />
            
            <div className="absolute inset-0 pointer-events-auto">
              {!performanceSettings.lowPerfMode ? (
                <Spline 
                  scene="https://prod.spline.design/WlekFpszn0lmLILm/scene.splinecode" 
                  className="w-full h-full scale-[1.05]" 
                  onLoad={() => console.log('Spline (Mobile) initialized')}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                  <Terminal className="w-20 h-20 text-brand-primary/40" />
                </div>
              )}
            </div>
            
            {}
            <div className="absolute bottom-[-10px] right-[-10px] w-48 h-20 bg-[#160b29] blur-xl z-50 pointer-events-none" />
            <div className="absolute bottom-2 right-2 z-50 px-4 py-2 font-mono text-[9px] text-white/30 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-full pointer-events-none">
              RENDER: ONLINE
            </div>
          </motion.div>
        </motion.div>

        <div className="flex flex-col w-full gap-4 pointer-events-auto">
          <Link to="/pathways" className="w-full">
            <MagneticButton className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl font-mono font-bold text-lg glow-shadow hover:scale-105 transition-all flex items-center justify-center gap-3">
              <Terminal className="w-5 h-5" />
              hero.start_quest()
            </MagneticButton>
          </Link>
          <MagneticButton onClick={onSyllabusClick} className="w-full py-4 glass rounded-xl font-mono font-bold text-lg hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3 text-white/70 hover:text-white">
            <BookOpen className="w-5 h-5" />
            load_syllabus()
          </MagneticButton>
        </div>
      </div>

      {}
      <div className="hidden lg:grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] w-full max-w-[120rem] mx-auto min-h-[800px] h-auto lg:h-[calc(100vh-4rem)] p-6 xl:p-10 pt-24 lg:pt-32 gap-x-8 xl:gap-x-12 gap-y-4 xl:gap-y-6 relative z-30">
        
        {}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-start-1 col-span-2 row-start-1 self-start justify-self-start pointer-events-none pl-4"
        >
          <h1 className="text-5xl xl:text-7xl 2xl:text-8xl font-mono font-bold drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">
            <span className="text-purple-400">class</span> <TextReveal text="PYTHON:" className="inline-block text-blue-400" delay={0.1} />
          </h1>
          <p className="text-lg xl:text-2xl 2xl:text-3xl font-mono text-green-400 mt-4 xl:mt-6 ml-8 xl:ml-12 border-l-2 border-white/20 pl-4 xl:pl-6">
            """<br/>
            &nbsp;<TextReveal text="Освой играя" delay={0.5} className="inline-block" /><br/>
            """
          </p>
        </motion.div>

        {}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="col-start-3 row-start-1 self-start justify-self-end glass p-5 xl:p-8 rounded-2xl border border-white/10 font-mono text-xs xl:text-sm 2xl:text-base backdrop-blur-md mt-4 mr-4"
        >
          <div className="flex items-center gap-3 mb-4 xl:mb-6 text-white/60 border-b border-white/10 pb-3 xl:pb-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            SYSTEM.STATUS = "ONLINE"
          </div>
          <div className="space-y-3 xl:space-y-4">
            <div className="flex justify-between gap-8 xl:gap-16">
              <span className="text-purple-400">active_users</span>
              <span className="text-yellow-400">1,337</span>
            </div>
            <div className="flex justify-between gap-8 xl:gap-16">
              <span className="text-purple-400">quests_completed</span>
              <span className="text-yellow-400">42,069</span>
            </div>
            <div className="flex justify-between gap-8 xl:gap-16">
              <span className="text-purple-400">server_load</span>
              <span className="text-green-400">"OPTIMAL"</span>
            </div>
          </div>
        </motion.div>

        {}
        <div 
          ref={containerRef}
          className="col-start-2 row-start-2 self-center justify-self-center w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl z-20 pointer-events-auto"
        >
          <motion.div
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div 
              className="relative w-full h-[350px] md:h-[450px] lg:h-[600px] bg-[#0a0a0a]/90 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(99,102,241,0.3)] z-10"
              style={{ z: 120, WebkitBackfaceVisibility: "hidden", transform: "translateZ(0)" }}
            >
              {}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 pointer-events-none z-10" />
              
              <div className="absolute inset-0 pointer-events-auto">
                {!performanceSettings.lowPerfMode ? (
                  <>
                    <div className="hidden md:block w-full h-full">
                      <Spline 
                        scene="https://prod.spline.design/WlekFpszn0lmLILm/scene.splinecode" 
                        className="w-full h-full scale-[1.05]" 
                        onLoad={() => console.log('Spline initialized')}
                      />
                    </div>
                    {}
                    <div className="md:hidden w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center p-8">
                      <div className="relative w-32 h-32">
                        <div className="absolute inset-0 bg-brand-primary/40 rounded-full blur-2xl animate-pulse" />
                        <Terminal className="text-white w-full h-full relative z-10 shadow-2xl" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-3xl" />
                      <Terminal className="w-32 h-32 md:w-48 md:h-48 text-brand-primary relative z-10 opacity-60" />
                    </div>
                  </div>
                )}
              </div>
              
              {}
              <div className="absolute bottom-[-10px] right-[-10px] w-48 h-20 bg-[#160b29] blur-xl z-50 pointer-events-none" />
              <div className="absolute bottom-4 right-4 z-50 px-4 py-2 font-mono text-[10px] text-white/30 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-full pointer-events-none">
                RENDER_STATUS: ONLINE
              </div>
            </motion.div>
          </motion.div>
        </div>

        {}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="col-start-1 row-start-2 self-end justify-self-start flex flex-col items-center gap-4 xl:gap-6 glass p-6 xl:p-8 rounded-3xl border border-white/10 backdrop-blur-md mb-8 z-40 w-[240px] xl:w-[280px]"
        >
          <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />
            <Trophy className="w-8 h-8 xl:w-10 xl:h-10 text-yellow-500 relative z-10" />
          </div>
          <div className="font-mono text-center">
            <div className="text-xs xl:text-sm text-white/40 mb-2"># Последнее достижение</div>
            <div className="text-sm xl:text-base text-green-400">achievement.unlock()</div>
          </div>
        </motion.div>

        {}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="col-start-3 row-start-2 self-end justify-self-end flex flex-col gap-4 xl:gap-6 pointer-events-auto mb-8 z-40 w-[240px] xl:w-[280px]"
        >
          <Link to="/pathways" className="w-full">
            <MagneticButton className="px-4 py-4 xl:py-5 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl font-mono font-bold text-sm xl:text-base glow-shadow hover:scale-105 transition-all flex items-center justify-center gap-3 w-full">
              <Terminal className="w-4 h-4 xl:w-5 xl:h-5" />
              hero.start_quest()
            </MagneticButton>
          </Link>
          <MagneticButton onClick={onSyllabusClick} className="px-4 py-4 xl:py-5 glass rounded-2xl font-mono font-bold text-sm xl:text-base hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3 text-white/70 hover:text-white w-full">
            <BookOpen className="w-4 h-4 xl:w-5 xl:h-5" />
            show_program()
          </MagneticButton>
        </motion.div>

      </div>
    </section>
  );
};


const AnimatedTerminal = () => {
  const codeLines = [
    "class PythonMaster:",
    "    def __init__(self, name):",
    "        self.name = name",
    "        self.skills = []",
    "",
    "    def learn(self, skill):",
    "        self.skills.append(skill)",
    "        print(f'{self.name} mastered {skill}!')",
    "",
    "# Начинаем путешествие",
    "hero = PythonMaster('Вы')",
    "hero.learn('Нейронные сети')"
  ];

  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (currentLineIdx >= codeLines.length) {
      setTimeout(() => setShowOutput(true), 500);
      return;
    }

    const currentLine = codeLines[currentLineIdx];

    if (currentCharIdx < currentLine.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIdx(prev => prev + 1);
      }, Math.random() * 30 + 20); 
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => [...prev, currentLine]);
        setCurrentLineIdx(prev => prev + 1);
        setCurrentCharIdx(0);
      }, 300); 
      return () => clearTimeout(timeout);
    }
  }, [currentLineIdx, currentCharIdx, codeLines, isVisible]);

  
  const highlight = (text: string) => {
    let highlighted = text
      .replace(/class /g, '<span class="text-purple-400 font-bold">class </span>')
      .replace(/def /g, '<span class="text-purple-400 font-bold">def </span>')
      .replace(/print/g, '<span class="text-purple-400 font-bold">print</span>')
      .replace(/self/g, '<span class="text-blue-300 italic">self</span>')
      .replace(/PythonMaster/g, '<span class="text-blue-400 font-bold">PythonMaster</span>')
      .replace(/__init__/g, '<span class="text-yellow-400 font-bold">__init__</span>')
      .replace(/learn/g, '<span class="text-yellow-400 font-bold">learn</span>')
      .replace(/append/g, '<span class="text-yellow-400">append</span>')
      .replace(/('.*?')/g, '<span class="text-green-400">$1</span>')
      .replace(/(#.*)/g, '<span class="text-white/40 italic">$1</span>');
    return highlighted;
  };

  return (
    <div ref={ref} className="font-mono">
      {}
      {displayedLines.map((line, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: highlight(line) || '&nbsp;' }} />
      ))}
      
      {}
      {currentLineIdx < codeLines.length && (
        <div>
          <span 
            dangerouslySetInnerHTML={{ 
              __html: highlight(codeLines[currentLineIdx].substring(0, currentCharIdx)) 
            }} 
          />
          <span className="w-2.5 h-5 bg-white/80 inline-block align-middle ml-1 animate-pulse" />
        </div>
      )}

      {}
      {showOutput && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-white/10 text-green-400 font-bold flex items-center gap-3"
        >
          <Terminal className="w-5 h-5" />
          {">>>"} Вы освоили Нейронные сети!
        </motion.div>
      )}
    </div>
  );
};

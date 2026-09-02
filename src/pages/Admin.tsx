import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Coins, Zap, Star, Swords, Brain, Heart, Package, 
  Search, History, Trash2, AlertTriangle, CheckCircle2, Terminal,
  BookOpen, Code2, Cpu, Flame, Key, Lock, Unlock, Database, Eye,
  Trophy, Hammer, Ghost, Coffee, Rocket, GraduationCap, RefreshCw, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { ALL_ITEMS } from './Shop';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';
import { LESSONS } from '../constants/lessons';
import { GuildService } from '../services/GuildService';

interface AdminLog {
  id: string;
  action: string;
  target: string;
  value: any;
  timestamp: number;
  status: 'success' | 'error';
}

type AdminTab = 'users' | 'solutions' | 'system' | 'events';

export const Admin = () => {
  const { 
    isAdmin, adminAddCoins, adminUpdateUserStats, adminGiveItem, 
    searchUsers, adminSetLevel, adminCompleteLesson, adminUnlockAllLessons,
    adminMaxOut, adminSpawnBoss, adminGiveCoins, adminSetStats,
    adminCompleteQuest, adminCompleteAllQuests
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetStat, setTargetStat] = useState('logic');
  const [statValue, setStatValue] = useState(1);
  const [targetItemId, setTargetItemId] = useState('');
  const [coinAmount, setCoinAmount] = useState(100);
  const [targetLevel, setTargetLevel] = useState(1);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  
  const [solutionSearch, setSolutionSearch] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  
  const [questUser, setQuestUser] = useState<any>(null);
  const [questUserLoading, setQuestUserLoading] = useState(false);

  const loadQuestUser = async (uid: string) => {
    setQuestUserLoading(true);
    try {
      const results = await searchUsers(uid);
      
      setQuestUser(selectedUser);
    } finally {
      setQuestUserLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">ДОСТУП ЗАПРЕЩЕН</h1>
          <p className="text-white/40">Эта область предназначена только для администраторов системы PyQuest.</p>
        </div>
      </div>
    );
  }

  const addLog = (action: string, target: string, value: any, status: 'success' | 'error' = 'success') => {
    const newLog: AdminLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      target,
      value,
      timestamp: Date.now(),
      status
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
  };

  const handleUpdateCoins = async () => {
    const uid = selectedUser?.uid || targetUserId;
    if (!uid) { toast.error('Выберите пользователя'); return; }
    try {
      await adminAddCoins(uid, coinAmount);
      addLog('ADD_COINS', uid, coinAmount);
    } catch (e) {
      addLog('ADD_COINS', uid, coinAmount, 'error');
    }
  };

  const handleUpdateStats = async () => {
    const uid = selectedUser?.uid || targetUserId;
    if (!uid) { toast.error('Выберите пользователя'); return; }
    try {
      await adminUpdateUserStats(uid, { [targetStat]: statValue });
      addLog('UPDATE_STAT', `${uid} (${targetStat})`, statValue);
    } catch (e) {
      addLog('UPDATE_STAT', `${uid} (${targetStat})`, statValue, 'error');
    }
  };

  const handleSetLevel = async () => {
    const uid = selectedUser?.uid || targetUserId;
    if (!uid) { toast.error('Выберите пользователя'); return; }
    try {
      const xp = (targetLevel - 1) * 250;
      await adminSetLevel(uid, targetLevel, xp);
      addLog('SET_LEVEL', uid, targetLevel);
    } catch (e) {
      addLog('SET_LEVEL', uid, targetLevel, 'error');
    }
  };

  const handleMaxOut = async () => {
    const uid = selectedUser?.uid || targetUserId;
    if (!uid) { toast.error('Выберите пользователя'); return; }
    try {
      await adminMaxOut(uid);
      addLog('MAX_OUT', uid, 'ALL');
    } catch (e) {
      addLog('MAX_OUT', uid, 'ALL', 'error');
    }
  };

  const handleCompleteTargetLesson = async (lessonId: string) => {
    const uid = selectedUser?.uid || targetUserId;
    if (!uid) { toast.error('Выберите пользователя'); return; }
    try {
      await adminCompleteLesson(uid, lessonId);
      addLog('COMPLETE_LESSON', uid, lessonId);
    } catch (e) {
      addLog('COMPLETE_LESSON', uid, lessonId, 'error');
    }
  };

  const filteredLessons = LESSONS.filter(l => 
    l.title.toLowerCase().includes(solutionSearch.toLowerCase()) || 
    l.id.toLowerCase().includes(solutionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#050505]">
      {}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                <TextReveal text="Admin God Mode" delay={0.1} />
                <Flame className="w-6 h-6 text-orange-500 animate-bounce" />
              </h1>
              <p className="text-red-500 font-mono text-xs tracking-[0.2em] animate-pulse">SUPREME AUTHORITY GRANTED</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {(['users', 'solutions', 'system', 'events'] as AdminTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'users' && <Users className="w-3 h-3 inline mr-2" />}
                {tab === 'solutions' && <Key className="w-3 h-3 inline mr-2" />}
                {tab === 'system' && <Cpu className="w-3 h-3 inline mr-2" />}
                {tab === 'events' && <Flame className="w-3 h-3 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass rounded-3xl p-6 border border-white/10 space-y-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-red-500" />
                    Поиск игрока
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text"
                      placeholder="Username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-sm focus:border-red-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {searchResults.map(user => (
                      <button
                        key={user.uid}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selectedUser?.uid === user.uid ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div className="text-left font-mono">
                          <p className="text-sm font-bold text-white">{user.username}</p>
                          <p className="text-[9px] text-white/20">{user.uid}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div className="glass rounded-3xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-red-500" />
                    Логи Божества
                  </h2>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {logs.map(log => (
                      <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 font-mono text-[9px] leading-tight">
                        <span className={log.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>
                          [{log.action}]
                        </span>{' '}
                        <span className="text-white/40">{log.target}</span>{' '}
                        <span className="text-brand-primary">{String(log.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {}
              <div className="lg:col-span-8 space-y-6">
                {selectedUser ? (
                  <div className="space-y-6">
                    {}
                    <div className="glass rounded-[2rem] p-8 border border-white/10 bg-gradient-to-br from-red-500/10 via-transparent to-brand-primary/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8">
                         <Ghost className="w-24 h-24 text-white/5" />
                      </div>
                      <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center text-3xl">
                          👤
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-white">{selectedUser.username}</h2>
                          <div className="flex gap-4 mt-2">
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-white/40">UID: {selectedUser.uid}</span>
                            <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-bold text-red-500 uppercase italic">Admin Target</span>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="mb-8 p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-red-400">
                          <Zap className="w-5 h-5" /> Quick Cheats
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          <button 
                            onClick={async () => {
                              await adminMaxOut(selectedUser.uid);
                              toast.success("USER MAXED OUT!");
                            }}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-900/40"
                          >
                            GOD MODE (MAX ALL)
                          </button>
                          <button 
                            onClick={() => adminSetLevel(selectedUser.uid, (selectedUser.level || 1) + 1, 0)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all"
                          >
                            +1 LEVEL
                          </button>
                          <button 
                            onClick={() => adminGiveCoins(selectedUser.uid, 1000000)}
                            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl transition-all"
                          >
                            +1M COINS
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                              onClick={handleMaxOut}
                              className="group relative p-6 bg-red-600 hover:bg-red-500 rounded-3xl text-white transition-all overflow-hidden shadow-2xl shadow-red-600/20"
                            >
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                <Flame className="w-16 h-16" />
                              </div>
                              <div className="relative z-10 text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">DANGEROUS ROOT ACTION</p>
                                <h4 className="text-2xl font-black italic">ULTIMATE MAX OUT</h4>
                                <p className="text-xs text-white/60 mt-2">All-in-one GOD MODE</p>
                              </div>
                            </button>

                            <div className="grid grid-cols-1 gap-4">
                              <button 
                                onClick={() => adminGiveCoins(selectedUser.uid, 100000)}
                                className="p-4 bg-yellow-500 hover:bg-yellow-400 rounded-2xl text-black font-black text-xs flex items-center justify-between transition-all"
                              >
                                <span>UNLIMITED MONEY</span>
                                <Coins className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => adminSetLevel(selectedUser.uid, 100, 25000)}
                                className="p-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl text-white font-black text-xs flex items-center justify-between transition-all"
                              >
                                <span>LEVEL UP (MAX)</span>
                                <Zap className="w-4 h-4" />
                              </button>
                             <button 
                                onClick={() => adminSetStats(selectedUser.uid, { logic: 99, speed: 99, power: 99, intellect: 99, stamina: 99 })}
                                className="p-4 bg-brand-primary hover:bg-brand-secondary rounded-2xl text-white font-black text-xs flex items-center justify-between transition-all"
                              >
                                <span>MAX STATS (99)</span>
                                <Shield className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                         <button 
                           onClick={() => adminUnlockAllLessons(selectedUser.uid)}
                           className="group relative p-6 bg-indigo-600 hover:bg-indigo-500 rounded-3xl text-white transition-all overflow-hidden shadow-2xl shadow-indigo-600/20"
                         >
                           <Unlock className="w-5 h-5 mb-4" />
                           <h4 className="text-lg font-black leading-tight italic">UNLOCK ALL LESSONS</h4>
                         </button>

                         <button 
                           onClick={() => adminAddCoins(selectedUser.uid, 5000)}
                           className="group relative p-6 bg-yellow-600 hover:bg-yellow-500 rounded-3xl text-white transition-all overflow-hidden shadow-2xl shadow-yellow-600/20"
                         >
                           <Coins className="w-5 h-5 mb-4" />
                           <h4 className="text-lg font-black leading-tight italic">+5000 COINS</h4>
                         </button>

                         <button 
                            onClick={() => {
                              setSelectedUser(null);
                              setLogs([]);
                              toast.info('Terminal Cleared');
                            }}
                           className="group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-white transition-all overflow-hidden"
                         >
                           <Trash2 className="w-5 h-5 mb-4 text-white/40" />
                           <h4 className="text-lg font-black leading-tight opacity-40">EXIT TARGET</h4>
                         </button>
                     </div>

                      {}
                      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar mt-4">
                         <button 
                           onClick={() => adminUpdateUserStats(selectedUser.uid, { logic: 99, speed: 99, power: 99, intellect: 99, stamina: 99 })}
                           className="px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-black transition-all shrink-0"
                         >
                            ✨ Max Stats
                         </button>
                         <button 
                           onClick={() => adminSetLevel(selectedUser.uid, (selectedUser?.level || 1) + 1, (selectedUser?.xp || 0) + 1000)}
                           className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all shrink-0"
                         >
                            📈 Level Up +1
                         </button>
                         <button 
                           onClick={() => adminAddCoins(selectedUser.uid, 100000)}
                           className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all shrink-0"
                         >
                            💰 +100k Money
                         </button>
                         <button 
                           onClick={() => adminGiveItem(selectedUser.uid, 'legendary_chest')}
                           className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500 hover:text-white transition-all shrink-0"
                         >
                            🎁 Give Legend Chest
                         </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {}
                      <div className="glass rounded-3xl p-8 border border-white/10 space-y-8">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Coins className="text-yellow-500" /> Ресурсы
                          </h3>
                          <div className="space-y-4">
                            <div className="flex gap-3">
                              <input 
                                type="number"
                                value={coinAmount}
                                onChange={(e) => setCoinAmount(Number(e.target.value))}
                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-yellow-500"
                              />
                              <button onClick={handleUpdateCoins} className="px-8 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-all">ADD</button>
                            </div>
                            <div className="flex gap-3">
                              <input 
                                type="number"
                                value={targetLevel}
                                onChange={(e) => setTargetLevel(Number(e.target.value))}
                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-red-500"
                              />
                              <button onClick={handleSetLevel} className="px-8 bg-red-500 text-white font-black rounded-2xl hover:scale-105 transition-all">SET LVL</button>
                            </div>
                          </div>
                        </div>

                        <div>
                           <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <Package className="text-emerald-500" /> Инвентарь
                          </h3>
                          <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                            {ALL_ITEMS.map(item => (
                              <button
                                key={item.id}
                                onClick={() => adminGiveItem(selectedUser.uid, item.id)}
                                className="aspect-square bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-xl hover:bg-emerald-500/20 hover:border-emerald-500 transition-all active:scale-95"
                                title={item.name}
                              >
                                {item.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="glass rounded-3xl p-8 border border-white/10">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                          <Brain className="text-indigo-400" /> Статистика
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {[
                            { id: 'logic', color: 'text-indigo-400', icon: <Brain /> },
                            { id: 'speed', color: 'text-yellow-400', icon: <Zap /> },
                            { id: 'power', color: 'text-red-400', icon: <Swords /> },
                            { id: 'intellect', color: 'text-blue-400', icon: <Star /> },
                            { id: 'stamina', color: 'text-emerald-400', icon: <Heart /> }
                          ].map(s => (
                            <button
                              key={s.id}
                              onClick={() => setTargetStat(s.id)}
                              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                                targetStat === s.id ? 'bg-indigo-500/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <span className={s.color}>{React.cloneElement(s.icon as any, { className: 'w-4 h-4' })}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">{s.id}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <input 
                            type="number"
                            value={statValue}
                            onChange={(e) => setStatValue(Number(e.target.value))}
                            className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-indigo-500"
                          />
                          <button onClick={handleUpdateStats} className="px-8 bg-indigo-500 text-white font-black rounded-2xl hover:scale-105 transition-all uppercase text-[10px]">Apply</button>
                        </div>
                      </div>

                     {}
                     <div className="glass rounded-3xl p-6 border border-white/10 mt-6">
                       <div className="flex items-center justify-between mb-6">
                         <h3 className="text-xl font-bold flex items-center gap-2">
                           <Target className="w-5 h-5 text-brand-primary" /> Квесты игрока
                         </h3>
                         <button
                           onClick={() => adminCompleteAllQuests(selectedUser.uid)}
                           className="px-4 py-2 bg-brand-primary/20 hover:bg-brand-primary border border-brand-primary/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-white transition-all"
                         >
                           🎯 Все квесты
                         </button>
                       </div>
                       {selectedUser?.dailyQuests && selectedUser.dailyQuests.length > 0 ? (
                         <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                           {selectedUser.dailyQuests.map((quest: any) => (
                             <div
                               key={quest.id}
                               className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                                 quest.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'
                               }`}
                             >
                               <div className="flex-1 min-w-0">
                                 <p className={`text-sm font-bold truncate ${
                                   quest.completed ? 'text-emerald-400' : 'text-white'
                                 }`}>{quest.title}</p>
                                 <div className="flex items-center gap-3 mt-1">
                                   <span className="text-[10px] text-white/30 font-mono">
                                     {quest.current}/{quest.target}
                                   </span>
                                   <span className="text-[10px] text-yellow-500 font-bold">+{quest.reward?.coins || 0} 💰</span>
                                   <span className="text-[10px] text-brand-primary font-bold">+{quest.reward?.xp || 0} XP</span>
                                 </div>
                                 <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                                   <div
                                     className={`h-full rounded-full transition-all ${
                                       quest.completed ? 'bg-emerald-500' : 'bg-brand-primary'
                                     }`}
                                     style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                                   />
                                 </div>
                               </div>
                               {!quest.completed ? (
                                 <button
                                   onClick={() => adminCompleteQuest(selectedUser.uid, quest.id)}
                                   className="shrink-0 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-all"
                                 >
                                   ✅ Выполнить
                                 </button>
                               ) : (
                                 <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                               )}
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-8 text-white/20">
                           <Target className="w-10 h-10 mx-auto mb-2 opacity-20" />
                           <p className="text-xs font-bold uppercase tracking-widest">Нет активных квестов</p>
                           <p className="text-[10px] mt-1 text-white/10">У игрока пока нет суточных квестов</p>
                         </div>
                       )}
                     </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 glass rounded-[3rem] border-2 border-dashed border-white/5">
                    <Database className="w-20 h-20 text-white/5" />
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white/20 uppercase tracking-[0.3em]">No Target Identified</h3>
                       <p className="text-white/10 font-mono text-sm italic">Используйте поиск слева для доступа к данным пользователя</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'solutions' && (
            <motion.div 
              key="solutions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {}
              <div className="lg:col-span-12 space-y-6">
                <div className="glass rounded-[2rem] p-8 border border-white/10 bg-gradient-to-r from-brand-primary/10 to-transparent">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center border border-brand-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                          <BookOpen className="w-8 h-8 text-brand-primary" />
                       </div>
                       <div>
                          <h2 className="text-3xl font-black text-white italic">KNOWLEDGE BROWSER</h2>
                          <p className="text-brand-primary font-mono text-[10px] tracking-widest">COMPLETE ACCESS TO ALL SOLUTIONS</p>
                       </div>
                    </div>
                    <div className="relative w-full md:w-96">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                       <input 
                         type="text"
                         placeholder="Search lessons/challenges..."
                         value={solutionSearch}
                         onChange={(e) => setSolutionSearch(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-brand-primary transition-all"
                       />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`group p-6 rounded-3xl border transition-all text-left relative overflow-hidden ${
                        selectedLesson?.id === lesson.id 
                          ? 'bg-brand-primary/20 border-brand-primary shadow-xl' 
                          : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                              {lesson.id === 'intro' ? '🌱' : '⚡'}
                           </div>
                           <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">{lesson.level}</span>
                        </div>
                        <h4 className="text-lg font-black text-white group-hover:text-brand-primary transition-colors">{lesson.title}</h4>
                        <p className="text-xs text-white/40 mt-2 line-clamp-2">{lesson.description}</p>
                        
                        {}
                        {selectedUser && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleCompleteTargetLesson(lesson.id);
                             }}
                             className="mt-6 w-full py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-black transition-all"
                           >
                             Force Complete
                           </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {}
              <AnimatePresence>
                {selectedLesson && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    onClick={() => setSelectedLesson(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="w-full max-w-4xl bg-[#0a0a0a] rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                       <div className="p-10 space-y-8">
                          <div className="flex justify-between items-start">
                             <div className="flex gap-6">
                                <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-3xl border border-brand-primary/30">
                                   🧩
                                </div>
                                <div className="space-y-1">
                                   <p className="text-brand-primary font-black uppercase text-xs tracking-widest">LESSON DECRYPTION</p>
                                   <h2 className="text-4xl font-black text-white italic">{selectedLesson.title}</h2>
                                </div>
                             </div>
                             <button onClick={() => setSelectedLesson(null)} className="p-4 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-2xl transition-all">
                                <Trash2 className="w-6 h-6" />
                             </button>
                          </div>

                          <div className="grid grid-cols-1 gap-8">
                             {}
                             <div className="space-y-6">
                                {selectedLesson.quiz && (
                                   <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                                      <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                         <Trophy className="w-3 h-3" /> QUIZ ANSWER
                                      </h5>
                                      <div className="p-4 bg-black/40 rounded-xl font-mono text-emerald-400 text-sm border border-emerald-500/10">
                                         ПРАВИЛЬНЫЙ ОТВЕТ: {selectedLesson.quiz.options[selectedLesson.quiz.answer]}
                                      </div>
                                   </div>
                                )}

                                <div className="space-y-4">
                                   <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                                      <Code2 className="w-4 h-4" /> CHALLENGE SOLUTIONS (1-5)
                                   </h5>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                      {(selectedLesson.challenges || (selectedLesson.challenge ? [selectedLesson.challenge] : [])).map((ch: any, idx: number) => {
                                         const solution = ch.code || ch.testCases?.[0]?.input || ch.answer || "# Решение не найдено";
                                         return (
                                            <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4 group hover:border-brand-primary/30 transition-all">
                                               <div className="flex justify-between items-start">
                                                  <div className="px-3 py-1 bg-brand-primary/10 rounded-lg text-[10px] font-black text-brand-primary uppercase">
                                                     Task {idx + 1}
                                                  </div>
                                                  <button 
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(String(solution));
                                                      toast.success(`Task ${idx + 1} solution copied!`);
                                                    }}
                                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
                                                  >
                                                     <Package className="w-3 h-3 text-white/40" />
                                                  </button>
                                               </div>
                                               <div>
                                                  <h6 className="text-sm font-bold text-white">{ch.question}</h6>
                                                  <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{ch.description}</p>
                                               </div>
                                               <div className="p-4 bg-black rounded-2xl border border-white/5 font-mono text-[11px] text-brand-primary/80 overflow-x-auto">
                                                  <pre>{String(solution)}</pre>
                                               </div>
                                            </div>
                                         );
                                      })}
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex justify-end pt-4">
                             <button 
                               onClick={() => setSelectedLesson(null)}
                               className="px-10 py-4 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all"
                             >
                               CLOSE ACCESS
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
               key="system"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="h-[500px] flex items-center justify-center glass rounded-[3rem] border border-white/10"
            >
               <div className="text-center space-y-8 max-w-lg">
                  <div className="w-24 h-24 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto border border-brand-primary/10">
                     <Cpu className="w-12 h-12 text-brand-primary/40 animate-spin-slow" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">System Core v2.4</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total Lessons</p>
                          <p className="text-3xl font-black text-brand-primary">{LESSONS.length}</p>
                       </div>
                       <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Server Status</p>
                          <p className="text-3xl font-black text-emerald-500">OPTIMAL</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button 
                      onClick={async () => {
                        try {
                          const count = await GuildService.seedGuilds();
                          toast.success(`Успешно создано ${count} легендарных гильдий!`);
                        } catch (e: any) {
                          toast.error(`Ошибка сидинга: ${e.message}`);
                        }
                      }}
                      className="px-8 py-4 bg-brand-primary/20 border border-brand-primary/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-black transition-all shadow-[0_0_30px_rgba(139,92,246,0.1)]"
                    >
                      <Rocket className="w-3 h-3 inline mr-2" /> Seed Fake Guilds (World Population)
                    </button>
                    <button className="px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                      Generate Global Analytics
                    </button>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div 
               key="events"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               className="space-y-8"
            >
               <div className="glass rounded-[3rem] p-12 border border-white/10 bg-gradient-to-br from-red-500/10 to-transparent">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-[2rem] flex items-center justify-center border border-red-500/30">
                           <Flame className="w-10 h-10 text-red-500" />
                        </div>
                        <div>
                           <h2 className="text-4xl font-black text-white italic">WORLD EVENTS</h2>
                           <p className="text-red-500 font-mono text-xs tracking-[0.3em]">MANAGE GLOBAL SERVER STATES</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-10 glass rounded-[2.5rem] border border-white/5 space-y-6">
                        <h3 className="text-2xl font-black italic mb-4 flex items-center gap-3"><Swords className="text-red-500" /> Глобальный Босс</h3>
                        <p className="text-white/40 text-sm leading-relaxed">
                           Призовите древний вирус или баг, который весь сервер должен будет победить совместно. 
                           HP босса синхронизируется между всеми игроками в реальном времени.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                           <button 
                             onClick={() => adminSpawnBoss('legacy_boss')}
                             className="p-6 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-lg"
                           >
                             SPAWN LEGACY
                           </button>
                           <button 
                             onClick={() => adminSpawnBoss('omega_ai')}
                             className="p-6 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-lg"
                           >
                             SPAWN OMEGA AI
                           </button>
                        </div>
                        
                        <button 
                          onClick={async () => {
                            const { BossService } = await import('../services/BossService');
                            await BossService.rotateBosses();
                            toast.success('Пул боссов обновлен на текущую неделю!');
                          }}
                          className="w-full py-4 bg-white/5 border border-white/10 text-white/40 font-black rounded-2xl uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all text-[10px]"
                        >
                          <RefreshCw className="w-3 h-3 inline mr-2" /> ОБНОВИТЬ ПУЛ БОССОВ (НЕДЕЛЬНЫЙ)
                        </button>
                     </div>

                     <div className="p-10 glass rounded-[2.5rem] border border-white/5 opacity-50 cursor-not-allowed">
                        <h3 className="text-2xl font-black italic mb-4 flex items-center gap-3"><Users className="text-brand-primary" /> Бонус XP (Soon)</h3>
                        <p className="text-white/40 text-sm leading-relaxed">
                           Включите бонусный множитель опыта для всех игроков на определенное время.
                        </p>
                        <button disabled className="mt-8 w-full py-5 bg-white/5 border border-white/10 text-white/20 font-black rounded-3xl uppercase tracking-widest">
                           ACTIVATE x2 XP
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

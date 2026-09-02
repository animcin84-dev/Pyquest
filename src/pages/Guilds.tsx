import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Trophy, Sparkles, Plus, LogOut, Swords, Star, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GuildService, Guild } from '../services/GuildService';
import { GuildChat } from '../components/GuildChat';
import { toast } from 'sonner';

export const Guilds = () => {
  const { userProfile } = useAuth();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [newGuildIcon, setNewGuildIcon] = useState('🛡️');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGuilds = async () => {
    try {
      const allGuilds = await GuildService.getAllGuilds();
      setGuilds(allGuilds);
      
      if (userProfile?.guildId) {
        const mg = allGuilds.find(g => g.id === userProfile.guildId);
        setMyGuild(mg || null);
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
      toast.error('Ошибка загрузки гильдий');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuilds();
    
    
    let unsub: any;
    if (userProfile?.guildId) {
       unsub = GuildService.subscribeToGuild(userProfile.guildId, (g) => setMyGuild(g));
    }
    return () => {
      if (unsub) unsub();
    };
  }, [userProfile?.guildId]);

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName || !newGuildDesc) return;
    setIsSubmitting(true);
    try {
      await GuildService.createGuild(newGuildName, newGuildDesc, newGuildIcon, 'brand-primary', 5);
      setIsCreateModalOpen(false);
      await fetchGuilds();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания гильдии');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGuild = async (guildId: string) => {
    if (!userProfile) return toast.error('Нужна авторизация');
    try {
      setIsLoading(true);
      await GuildService.joinGuild(guildId);
      await fetchGuilds();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при вступлении');
      setIsLoading(false);
    }
  };

  const handleLeaveGuild = async () => {
    if (!myGuild) return;
    if (confirm('Вы уверены, что хотите покинуть гильдию?')) {
      try {
        setIsLoading(true);
        await GuildService.leaveGuild(myGuild.id);
        setMyGuild(null);
        await fetchGuilds();
      } catch (error: any) {
        toast.error(error.message || 'Ошибка при выходе из гильдии');
        setIsLoading(false);
      }
    }
  };

  if (isLoading && !guilds.length) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-6"
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-[0.3em]">Штаб Гильдий</span>
            </motion.div>
            <h1 className="text-6xl font-display font-black tracking-tighter mb-4">
              Альянсы <span className="text-brand-primary italic serif">Кодеров</span>
            </h1>
            <p className="text-white/40 text-xl font-medium">
              Объединяйтесь с другими программистами, фармите общий XP и участвуйте в глобальных рейдах.
            </p>
          </div>
          
          {!myGuild && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <Plus className="w-5 h-5" /> Создать Гильдию
            </button>
          )}
        </header>

        {myGuild ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[3rem] p-10 border border-brand-primary/30 shadow-2xl shadow-brand-primary/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 text-9xl opacity-5 pointer-events-none">
              {myGuild.icon}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl border border-white/10">
                    {myGuild.icon}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black mb-2">{myGuild.name}</h2>
                    <div className="flex flex-wrap gap-4 text-sm font-bold text-white/40 uppercase tracking-widest">
                      <span className="flex items-center gap-2 text-brand-primary"><Star className="w-4 h-4" /> Уровень {myGuild.level}</span>
                      <span className="flex items-center gap-2 text-emerald-500"><Users className="w-4 h-4" /> {myGuild.memberCount}/50 Участников</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
                  {myGuild.description}
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
                    <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Опыт Гильдии</div>
                    <div className="text-2xl font-black text-brand-primary font-mono">{myGuild.xp} XP</div>
                  </div>
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center">
                    <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Требуемый Уровень</div>
                    <div className="text-2xl font-black">{myGuild.requiredLevel}</div>
                  </div>
                  <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center lg:col-span-2 flex items-center justify-center gap-3">
                    <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                    <div>
                       <div className="text-emerald-500/60 text-[10px] uppercase tracking-widest font-black">Бонус Гильдии</div>
                       <div className="text-emerald-400 font-bold text-sm">+5% Опыта за уроки всем участникам</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">Участники Гильдии</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myGuild.members.map(member => (
                      <div key={member.uid} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${member.role === 'leader' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/10 text-white'}`}>
                            {member.username[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold flex items-center gap-2">{member.username} {member.role === 'leader' && <Trophy className="w-3 h-3 text-yellow-500" />}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block mt-0.5">Вклад: {member.contribution} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-80 space-y-4">
                <button className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-brand-primary/20 hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                  <Swords className="w-4 h-4" /> Рейдовая Комната
                </button>
                <button 
                  onClick={handleLeaveGuild}
                  className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Покинуть Гильдию
                </button>
                <GuildChat guildId={myGuild.id} />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guilds.map((guild, idx) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group p-8 glass rounded-[3rem] border border-white/10 hover:border-brand-primary/30 transition-all text-left relative overflow-hidden flex flex-col h-full"
              >
                <div className="absolute top-0 right-0 p-8 text-7xl opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 pointer-events-none">
                  {guild.icon}
                </div>
                
                <div className="relative z-10 flex-grow">
                  <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl mb-6 border border-white/10 group-hover:border-brand-primary/50 transition-colors">
                    {guild.icon}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 line-clamp-1">{guild.name}</h3>
                  <p className="text-white/40 text-sm leading-relaxed line-clamp-2 h-10 mb-6">{guild.description}</p>
                  
                  <div className="space-y-2 mb-8">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
                      <Star className="w-3.5 h-3.5" /> Уровень {guild.level}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
                      <Shield className="w-3.5 h-3.5" /> Требуется {guild.requiredLevel} ур.
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-500">
                      <Users className="w-3.5 h-3.5" /> {guild.memberCount}/50 Участников
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-6 border-t border-white/10">
                  <button 
                    onClick={() => handleJoinGuild(guild.id)}
                    disabled={isLoading || (userProfile?.level || 0) < guild.requiredLevel}
                    className="w-full py-4 bg-white/5 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-black transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    Вступить <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg glass rounded-[3rem] p-10 border border-brand-primary/30 shadow-2xl"
            >
              <h2 className="text-3xl font-black mb-2">Создать Альянс</h2>
              <p className="text-white/40 text-sm mb-8 font-medium">Станьте лидером и ведите свою команду к вершинам рейтинга.</p>

              <form onSubmit={handleCreateGuild} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-3">Название (Макс. 20 симв.)</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={newGuildName}
                    onChange={e => setNewGuildName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors font-bold"
                    placeholder="Например: Орден Питона"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-3">Стиль (Эмодзи)</label>
                  <div className="flex gap-3">
                    {['🛡️', '🐍', '⚔️', '🦅', '🦁', '🔮'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewGuildIcon(emoji)}
                        className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all border ${newGuildIcon === emoji ? 'bg-brand-primary/20 border-brand-primary' : 'bg-black/40 border-white/10 opacity-50 hover:opacity-100'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-3">Описание (Манифест)</label>
                  <textarea
                    required
                    maxLength={150}
                    value={newGuildDesc}
                    onChange={e => setNewGuildDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors resize-none text-sm"
                    placeholder="Мы учимся писать чистый код и сражаемся с багами..."
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-4 rounded-xl bg-white/5 font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded-xl bg-brand-primary text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Создаем...' : 'Создать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

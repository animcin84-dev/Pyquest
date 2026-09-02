import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Target, Shield, Coins, Flame, Lock, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { PERKS, Perk } from '../constants/perks';
import { playSound } from '../utils/sounds';
import { toast } from 'sonner';

export const SkillTree = React.memo(() => {
  const { userProfile, updateProfile } = useAuth();
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeBranch, setActiveBranch] = useState<string>('all');

  const userPerks = userProfile?.perks || [];
  const skillPoints = userProfile?.skillPoints || 0;

  const branches = [
    { id: 'all', label: 'Все Навыки', icon: Brain },
    { id: 'logic', label: 'Логика', icon: Zap },
    { id: 'speed', label: 'Скорость', icon: Target },
    { id: 'power', label: 'Мощь', icon: Flame },
    { id: 'intellect', label: 'Интеллект', icon: Star },
    { id: 'stamina', label: 'Выносливость', icon: Shield },
  ];

  const filteredPerks = React.useMemo(() => 
    PERKS.filter(perk => 
      activeBranch === 'all' || perk.requirements.some(req => req.stat === activeBranch)
    ), [activeBranch]
  );

  const handlePurchase = React.useCallback(async (perk: Perk) => {
    if (!userProfile) return;
    if (userPerks.includes(perk.id)) return;
    
    
    if (skillPoints < perk.cost) {
      toast.error('Недостаточно очков навыков!');
      return;
    }

    
    const missingReq = perk.requirements.find(req => (userProfile.stats as any)[req.stat] < req.min);
    if (missingReq) {
      toast.error(`Требуется ${missingReq.stat.toUpperCase()} уровня ${missingReq.min}!`);
      return;
    }

    setIsPurchasing(true);
    try {
      await updateProfile({
        perks: [...userPerks, perk.id],
        skillPoints: skillPoints - perk.cost
      });
      toast.success(`Навык "${perk.name}" разблокирован!`);
      playSound('levelUp');
    } catch (error) {
      console.error('Error purchasing perk:', error);
      toast.error('Ошибка при покупке');
    } finally {
      setIsPurchasing(false);
    }
  }, [userProfile, userPerks, skillPoints, updateProfile]);

  return (
    <div className="min-h-screen bg-transparent text-white">
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-6"
            >
              <Brain className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Дерево навыков</span>
            </motion.div>
            <h1 className="text-6xl font-display font-black mb-6 tracking-tighter">
              Перки и <span className="text-brand-primary italic serif">Способности</span>
            </h1>
            <p className="text-white/40 text-xl font-medium">
              Трать свои очки навыков, чтобы открыть пассивные бонусы и новые возможности.
            </p>
          </div>
          
          <div className="flex items-center gap-6 p-6 glass rounded-3xl border border-brand-primary/20 shadow-xl shadow-brand-primary/10">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-brand-primary fill-brand-primary" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Доступные очки</div>
              <div className="text-3xl font-black text-brand-primary font-mono">{skillPoints} SP</div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-3 mb-12">
          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => setActiveBranch(branch.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                activeBranch === branch.id 
                  ? 'bg-brand-primary text-black shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              <branch.icon className="w-4 h-4" />
              {branch.label}
            </button>
          ))}
        </div>

        <div className="grid xl:grid-cols-4 gap-8 items-start">
          <div className="xl:col-span-3 grid md:grid-cols-2 2xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPerks.map((perk, idx) => {
              const isUnlocked = userPerks.includes(perk.id);
              const canAfford = skillPoints >= perk.cost;
              const meetsReqs = perk.requirements.every(req => (userProfile?.stats as any)[req.stat] >= req.min);
              const isLocked = !isUnlocked && !meetsReqs;

              return (
                <motion.div
                  layout
                  key={perk.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setSelectedPerk(perk)}
                  className={`group relative p-6 rounded-[24px] border transition-all duration-300 cursor-pointer overflow-hidden ${
                    selectedPerk?.id === perk.id ? 'ring-2 ring-brand-primary border-brand-primary shadow-[0_0_30px_rgba(99,102,241,0.2)] ' : ''
                  }${
                    isUnlocked 
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60' 
                      : isLocked
                        ? 'bg-black/40 border-white/5 grayscale opacity-50 hover:opacity-80'
                        : 'bg-white/5 border-white/10 hover:border-brand-primary/50 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className={`p-3 rounded-xl transition-all duration-500 ${
                      isUnlocked ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white/60 group-hover:bg-brand-primary/20 group-hover:text-brand-primary'
                    }`}>
                      <perk.icon className="w-5 h-5" />
                    </div>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                        {perk.cost} SP
                      </div>
                    )}
                  </div>

                  <h3 className={`text-lg font-black tracking-tight mb-2 relative z-10 ${isUnlocked ? 'text-emerald-400' : 'text-white'}`}>
                    {perk.name}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-6 line-clamp-2 relative z-10 font-medium">
                    {perk.description}
                  </p>

                  <div className="flex flex-wrap gap-2 relative z-10">
                    {perk.requirements.map(req => (
                      <span key={req.stat} className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                        (userProfile?.stats as any)[req.stat] >= req.min 
                          ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' 
                          : 'border-red-500/20 text-red-500 bg-red-500/5'
                      }`}>
                        {req.stat}: {req.min}
                      </span>
                    ))}
                  </div>

                  {}
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none ${
                    isUnlocked ? 'bg-emerald-500' : 'bg-brand-primary'
                  }`} />
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <AnimatePresence mode="wait">
              {selectedPerk ? (
                <motion.div
                  key={selectedPerk.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="glass rounded-[40px] p-8 2xl:p-10 border border-brand-primary/20 sticky top-32 shadow-2xl shadow-brand-primary/10"
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="p-5 rounded-[24px] bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 border border-brand-primary/30 text-brand-primary shadow-inner">
                      <selectedPerk.icon className="w-8 h-8 2xl:w-10 2xl:h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl 2xl:text-3xl font-black mb-1 tracking-tight leading-none">{selectedPerk.name}</h2>
                      <p className="text-brand-primary/60 font-black uppercase text-[10px] tracking-widest">Пассивная способность</p>
                    </div>
                  </div>

                  <p className="text-white/60 text-lg leading-relaxed mb-8 font-medium">
                    {selectedPerk.description}
                  </p>

                  <div className="space-y-4 mb-10">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Стоимость</span>
                      <span className="text-xl font-black text-brand-primary font-mono">{selectedPerk.cost} SP</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-2">ЭФФЕКТ ПЕРКА</span>
                       <div className="text-xl 2xl:text-2xl font-black text-emerald-400 relative z-10">
                          {selectedPerk.bonus.type === 'coins' && `+${Math.round(selectedPerk.bonus.value * 100)}% Монет`}
                          {selectedPerk.bonus.type === 'xp' && `+${Math.round(selectedPerk.bonus.value * 100)}% XP`}
                          {selectedPerk.bonus.type === 'damage' && `+${Math.round(selectedPerk.bonus.value * 100)}% Урона`}
                          {selectedPerk.bonus.type === 'luck' && selectedPerk.bonus.value === 1.0 ? 'ВТОРОЙ ШАНС' : selectedPerk.bonus.type === 'luck' ? `+${Math.round(selectedPerk.bonus.value * 100)}% Удачи` : ''}
                       </div>
                    </div>
                  </div>

                  {!userPerks.includes(selectedPerk.id) ? (
                    <button
                      onClick={() => handlePurchase(selectedPerk)}
                      disabled={isPurchasing || skillPoints < selectedPerk.cost || !selectedPerk.requirements.every(req => (userProfile?.stats as any)[req.stat] >= req.min)}
                      className="w-full py-4 2xl:py-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black rounded-2xl 2xl:rounded-3xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-xl shadow-brand-primary/20 text-xs 2xl:text-sm"
                    >
                      {isPurchasing ? 'ПОКУПКА...' : 'РАЗБЛОКИРОВАТЬ'}
                    </button>
                  ) : (
                    <div className="w-full py-4 2xl:py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black rounded-2xl 2xl:rounded-3xl uppercase tracking-widest text-center flex items-center justify-center gap-2 text-xs 2xl:text-sm">
                      <CheckCircle2 className="w-5 h-5" /> ИЗУЧЕНО
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="glass rounded-[40px] p-8 border border-dashed border-white/10 text-center flex flex-col items-center justify-center h-full min-h-[400px] opacity-60 sticky top-32">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                    <Brain className="w-10 h-10 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Детали Навыка</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Выберите перк из дерева слева, чтобы узнать его характеристики</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

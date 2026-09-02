import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Zap, Trophy, Star, CheckCircle2, Timer, ArrowRight, Code2, Bug, Eye, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { TextReveal } from '../components/TextReveal';
import { generateDailyChallenge } from '../services/gemini';
import { AIQuestService, AIQuest } from '../services/AIQuestService';
import { CodeEditor } from '../components/CodeEditor';
import { toast } from 'sonner';

export const DailyChallenges = () => {
  const { userProfile, completeDailyChallenge } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [aiChallenge, setAiChallenge] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchQuests = async () => {
      setIsLoadingQuests(true);
      try {
        let quests = await AIQuestService.getDailyQuests();
        
        
        if (quests.length === 0) {
          console.log('No quests found, generating...');
          await AIQuestService.generateDailyQuests();
          quests = await AIQuestService.getDailyQuests();
        }

        const todayStr = AIQuestService.getTodayDateStr();
        const mappedQuests = quests.map(q => ({
          ...q,
          isCompleted: userProfile?.completedDailyChallenges?.includes(`${todayStr}_${q.id}`) || false
        }));
        
        setChallenges(mappedQuests);
      } catch (error) {
        console.error('Error fetching AI quests:', error);
        toast.error('Не удалось загрузить квесты. Попробуйте обновить страницу.');
      } finally {
         setIsLoadingQuests(false);
      }
    };
    fetchQuests();

    
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h}ч ${m}м ${s}с`);
    }, 1000);

    return () => clearInterval(timer);
  }, [userProfile]);

  const handleComplete = async (challenge: any) => {
    if (challenge.isCompleted) return;
    
    const xpReward = challenge.reward?.xp || challenge.reward || 100;
    const coinsReward = challenge.reward?.coins || Math.floor(xpReward / 2);
    
    await completeDailyChallenge(challenge.id, { xp: xpReward, coins: coinsReward });
    
    if (challenge.id === 'ai_daily') {
      setAiChallenge((prev: any) => ({ ...prev, isCompleted: true }));
    } else {
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id ? { ...c, isCompleted: true } : c
      ));
    }
    setActiveChallenge(null);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const challenge = await generateDailyChallenge(userProfile?.level || 1);
      if (challenge) {
        setAiChallenge({
          ...challenge,
          id: 'ai_daily',
          type: 'code',
          difficulty: 'medium',
          isCompleted: userProfile?.completedDailyChallenges?.includes(`${new Date().toDateString()}_ai_daily`) || false
        });
        playSound('success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      
      <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <div className="text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-4"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">Ежедневные квесты</span>
            </motion.div>
            <h1 className="text-5xl font-display font-bold mb-4">
              <TextReveal text="Твой" delay={0.1} /> <span className="text-brand-primary italic serif"><TextReveal text="путь" delay={0.3} /></span> <TextReveal text="мастера" delay={0.5} />
            </h1>
            <p className="text-white/40 text-lg max-w-xl">Выполняй задания каждый день, чтобы получать бонусы и расти быстрее. Квесты генерируются ИИ для всех игроков.</p>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/10 text-center min-w-[240px]">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Timer className="w-4 h-4" /> До обновления
            </div>
            <div className="text-4xl font-mono font-bold text-brand-primary">{timeLeft}</div>
          </div>
        </header>

        <div className="grid gap-6">
          {}
          {!aiChallenge ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[32px] bg-gradient-to-r from-purple-600/20 to-brand-primary/20 border border-purple-500/30 text-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2 relative z-10">Персональное испытание</h3>
              <p className="text-white/60 mb-6 relative z-10">Сгенерируй экстра-задачу специально под твой текущий уровень!</p>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="px-8 py-3 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto relative z-10"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Сгенерировать
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative glass rounded-[32px] p-8 border transition-all duration-500 overflow-hidden ${aiChallenge.isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-purple-500/30 hover:border-purple-500/50'}`}
            >
              <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 text-purple-400 bg-purple-500/10">Personal AI</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{aiChallenge.title}</h3>
                  <p className="text-white/50">{aiChallenge.description}</p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
                  <button
                    onClick={() => setActiveChallenge(aiChallenge)}
                    disabled={aiChallenge.isCompleted}
                    className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${aiChallenge.isCompleted ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-105'}`}
                  >
                    {aiChallenge.isCompleted ? <><CheckCircle2 className="w-5 h-5" /> Выполнено</> : <><Code2 className="w-5 h-5" /> Решить код</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isLoadingQuests ? (
             <div className="py-20 flex flex-col items-center justify-center glass rounded-[32px] border border-white/10">
               <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
               <p className="text-white/60 font-bold tracking-widest uppercase">Загрузка глобальных квестов...</p>
             </div>
          ) : challenges.map((challenge, index) => {
            const xpReward = challenge.reward?.xp || challenge.reward || 100;
            const coinsReward = challenge.reward?.coins || Math.floor(xpReward / 2);

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group relative glass rounded-[32px] p-8 border transition-all duration-500 overflow-hidden ${challenge.isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-brand-primary/30'}`}
              >
                <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] rounded-full transition-opacity duration-500 ${challenge.isCompleted ? 'bg-green-500/10' : 'bg-brand-primary/5 opacity-0 group-hover:opacity-100'}`} />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${challenge.isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-brand-primary group-hover:bg-brand-primary/20'}`}>
                    {challenge.type === 'code' ? <Code2 className="w-10 h-10" /> : <Eye className="w-10 h-10" />}
                  </div>

                  <div className="flex-grow text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${challenge.difficulty === 'easy' ? 'border-green-500/30 text-green-400 bg-green-500/10' : challenge.difficulty === 'medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                        {challenge.difficulty || 'medium'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-white/40">
                        {challenge.type || 'code'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 text-blue-400 bg-blue-500/10">
                        Глобальный ИИ-Квест
                      </span>
                      {challenge.recommendedRank && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 text-purple-400 bg-purple-500/10">
                          Реком. Ранг: {challenge.recommendedRank}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{challenge.title}</h3>
                    <p className="text-white/50">{challenge.description}</p>
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Опыт</div>
                        <div className="text-xl font-bold text-yellow-400">+{xpReward}</div>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Монеты</div>
                        <div className="text-xl font-bold text-brand-primary">+{coinsReward}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveChallenge(challenge)}
                      disabled={challenge.isCompleted}
                      className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${challenge.isCompleted ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-white text-black hover:bg-brand-primary hover:text-white hover:scale-105 shadow-xl'}`}
                    >
                      {challenge.isCompleted ? (
                        <><CheckCircle2 className="w-5 h-5" /> Пройдено</>
                      ) : (
                        <><Code2 className="w-5 h-5" /> Кодить <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          )}
        </div>

        {}
        <AnimatePresence>
          {activeChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-5xl glass rounded-[40px] p-8 md:p-10 border border-brand-primary/30 relative max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-brand-primary/10"
              >
                <button 
                  onClick={() => setActiveChallenge(null)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Закрыть
                </button>
                
                <div className="mb-8 max-w-3xl">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary font-black uppercase tracking-widest text-[10px] rounded-full border border-brand-primary/30">ИИ-Задание</span>
                    <span className={`px-3 py-1 font-black uppercase tracking-widest text-[10px] rounded-full border ${activeChallenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : activeChallenge.difficulty === 'hard' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{activeChallenge.difficulty || 'medium'}</span>
                  </div>
                  <h2 className="text-4xl font-black mb-4">{activeChallenge.title}</h2>
                  <p className="text-white/60 text-lg leading-relaxed">{activeChallenge.description}</p>
                </div>

                <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/60">
                    <CodeEditor
                      initialCode={activeChallenge.initialCode || 'def solve():\n    # Напишите код здесь\n    pass\n\n'}
                      testCases={activeChallenge.testCases || []}
                      onSuccess={() => handleComplete(activeChallenge)}
                      lessonId={activeChallenge.id}
                    />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-12 rounded-[40px] bg-gradient-to-br from-brand-primary/20 to-purple-500/20 border border-white/10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              <TextReveal text="Недельный марафон" delay={0.1} />
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">Выполни все ежедневные глобальные ИИ-задания в течение 7 дней, чтобы получить легендарный сундук с редкими аватарами и званиями!</p>
            <div className="flex justify-center flex-wrap gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-bold shadow-lg ${i < 3 ? 'bg-brand-primary border-brand-primary text-white shadow-brand-primary/20' : 'bg-white/5 border-white/10 text-white/20'}`}>
                  {i < 3 ? <CheckCircle2 className="w-6 h-6 text-black" /> : i + 1}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, MessageSquareCode, GraduationCap, Loader2, X, Terminal, Code2, Lightbulb, Zap, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../utils/sounds';
import { getMentorHint } from '../services/gemini';
import { toast } from 'sonner';

export const MentorCompanion = React.memo(() => {
  const { userProfile, lastCodeResult, currentCode, currentChallenge } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [mentorHint, setMentorHint] = useState('');
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'mentor', content: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'history'>('chat');

  useEffect(() => {
    if (lastCodeResult) {
      if (lastCodeResult.success) {
        setMessage('Отличная работа! Твой код прошел все тесты. Хочешь узнать, как его можно оптимизировать?');
      } else {
        setMessage('Похоже, возникла ошибка. Не волнуйся, я помогу тебе разобраться!');
      }
      
    }
  }, [lastCodeResult]);

  const handleGetHint = async () => {
    if (!currentChallenge) {
      toast.error('Сначала выбери задачу!');
      return;
    }
    
    setIsMentorLoading(true);
    try {
      const hint = await getMentorHint(currentCode, currentChallenge);
      setMentorHint(hint);
      setHistory(prev => [...prev, { role: 'mentor', content: hint }]);
      playSound('success');
    } catch (err) {
      toast.error('Ошибка связи с ИИ-модулем');
    } finally {
      setIsMentorLoading(false);
    }
  };

  const analyzeCode = async () => {
    if (!currentCode || currentCode.trim().length < 5) {
      toast.error('Напиши хотя бы немного кода для анализа!');
      return;
    }

    setIsMentorLoading(true);
    try {
      const analysis = await getMentorHint(currentCode, { 
        title: 'Code Analysis', 
        description: 'Analyze this code for best practices, PEP 8 compliance, and potential optimizations.' 
      } as any);
      setMentorHint(analysis);
      setHistory(prev => [...prev, { role: 'mentor', content: analysis }]);
      playSound('success');
    } catch (err) {
      toast.error('Ошибка анализа');
    } finally {
      setIsMentorLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            className="absolute bottom-24 right-0 w-[450px] glass rounded-[40px] p-0 border border-white/10 shadow-[0_20px_100px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[600px]"
          >
            {}
            <div className="p-8 bg-gradient-to-r from-brand-primary/20 to-purple-500/20 border-b border-white/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
                    <GraduationCap className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">ИИ Ментор</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Онлайн</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>
            </div>

            {}
            <div className="flex border-b border-white/5 p-2 gap-2">
              {[
                { id: 'chat', label: 'Чат', icon: MessageSquareCode },
                { id: 'analysis', label: 'Анализ', icon: BrainCircuit },
                { id: 'history', label: 'История', icon: History }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-white/10 text-brand-primary' : 'text-white/40 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {}
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-6">
              {activeTab === 'chat' && (
                <>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm leading-relaxed text-white/70 font-medium italic">
                    {message || 'Привет! Я твой персональный ИИ-ментор. Я помогу тебе освоить Python, дам подсказки по задачам и проанализирую твой код. С чего начнем?'}
                  </div>

                  {mentorHint && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-brand-primary">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Подсказка</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed font-medium">
                        {mentorHint}
                      </p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleGetHint}
                      disabled={isMentorLoading}
                      className="py-4 bg-brand-primary text-black font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isMentorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Дай подсказку
                    </button>
                    <button 
                      onClick={analyzeCode}
                      disabled={isMentorLoading}
                      className="py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {isMentorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                      Анализ кода
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <Terminal className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400">Статус кода: {!lastCodeResult ? 'Ожидание кода' : lastCodeResult.success ? 'Валиден' : 'Требует правок'}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Рекомендации</h4>
                    {[
                      'Используй более описательные имена переменных',
                      'Добавь комментарии к сложным участкам кода',
                      'Следи за отступами (PEP 8)',
                      'Рассмотри использование генераторов списков'
                    ].map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-black text-brand-primary shrink-0">{i+1}</div>
                        <p className="text-xs text-white/60 font-medium">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-white/20 italic text-sm">История пуста</div>
                  ) : (
                    history.map((item, i) => (
                      <div key={i} className={`p-4 rounded-2xl border ${item.role === 'mentor' ? 'bg-brand-primary/5 border-brand-primary/10' : 'bg-white/5 border-white/5'}`}>
                        <div className="text-[8px] font-black uppercase tracking-widest mb-2 opacity-40">{item.role === 'mentor' ? 'Ментор' : 'Вы'}</div>
                        <p className="text-xs text-white/70 leading-relaxed">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {}
            <div className="p-6 border-t border-white/10 bg-black/20">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Задай вопрос ментору..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-brand-primary/50 transition-all pr-12"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-brand-primary hover:scale-110 transition-all">
                  <Zap className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          playSound('click');
        }}
        className={`w-16 h-16 rounded-full glass border-2 flex items-center justify-center text-3xl shadow-2xl transition-all relative group ${isOpen ? 'border-brand-primary bg-brand-primary/20' : 'border-white/10 hover:border-brand-primary/50'}`}
      >
        <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <GraduationCap className={`w-8 h-8 transition-all ${isOpen ? 'text-brand-primary scale-110' : 'text-white/40'}`} />
        
        {}
        {lastCodeResult && !isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-bg-dark"
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
});

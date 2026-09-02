import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, BrainCircuit, Rocket, Settings2, Heart, Swords, MessageSquareCode, Info, Palette, Eraser, Save, Utensils, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth, InventoryItem } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { playSound } from '../utils/sounds';
import { ALL_ITEMS } from '../pages/Shop';
import { getMentorHint } from '../services/gemini';

export const PetCompanion = React.memo(() => {
  const { userProfile, updateProfile, updateQuestProgress, lastCodeResult, currentCode, currentChallenge } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [message, setMessage] = useState('');
  const [mentorHint, setMentorHint] = useState('');
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [pixels, setPixels] = useState<string[]>(Array(64).fill('transparent'));
  const [currentColor, setCurrentColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(1);
  const [isFeeding, setIsFeeding] = useState(false);
  
  
  const defaultPet = {
    name: 'Bit-Bot',
    type: 'pixel-slime',
    level: 1,
    xp: 0,
    stats: {
      logic: 10,
      speed: 10,
      power: 10,
      intellect: 10
    },
    color: '#6366f1',
    customPixels: Array(64).fill('transparent'),
    lastFed: Date.now()
  };

  const pet = userProfile?.pet || defaultPet;

  
  useEffect(() => {
    if (userProfile?.pet?.customPixels) {
      setPixels(userProfile.pet.customPixels);
    } else {
      setPixels(Array(64).fill('transparent'));
    }
  }, [userProfile?.pet?.customPixels]);

  useEffect(() => {
    if (lastCodeResult) {
      setMessage(lastCodeResult.message);
      
      
      const timer = setTimeout(() => setMessage(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [lastCodeResult]);

  const handleGetHint = async () => {
    if (!currentChallenge) {
      setMessage('Сначала выбери задачу, чтобы я мог помочь!');
      return;
    }

    const baseCost = 50;
    const petLevel = pet.level || 0;
    const finalCost = petLevel >= 10 ? Math.floor(baseCost / 2) : baseCost;

    if ((userProfile?.coins || 0) < finalCost) {
      playSound('error');
      setMessage(`Недостаточно монет! Подсказка стоит ${finalCost} монет.`);
      return;
    }
    
    setIsMentorLoading(true);
    setMentorHint('');
    try {
      const hint = await getMentorHint(currentCode, currentChallenge);
      setMentorHint(hint);
      await updateProfile({ coins: (userProfile?.coins || 0) - finalCost });
      
      if (petLevel >= 10) {
        toast.success(`Аура Логики! Подсказка за ${finalCost} монет (скидка 50%)`, { icon: '🧠' });
      } else {
        toast.info(`Списано ${finalCost} монет за подсказку`);
      }
      
      playSound('success');
    } catch (err) {
      setMessage('Ой, мой ИИ-модуль перегрелся. Попробуй позже!');
    } finally {
      setIsMentorLoading(false);
    }
  };

  const handlePixelClick = (index: number) => {
    const newPixels = [...pixels];
    const row = Math.floor(index / 8);
    const col = index % 8;

    for (let r = 0; r < brushSize; r++) {
      for (let c = 0; c < brushSize; c++) {
        const targetRow = row + r;
        const targetCol = col + c;
        if (targetRow < 8 && targetCol < 8) {
          const targetIdx = targetRow * 8 + targetCol;
          newPixels[targetIdx] = currentColor;
        }
      }
    }
    setPixels(newPixels);
  };

  const clearPixels = () => {
    setPixels(Array(64).fill('transparent'));
  };

  const savePixels = async () => {
    try {
      await updateProfile({
        pet: {
          ...pet,
          customPixels: pixels
        }
      });
      setIsDrawing(false);
      playSound('success');
      setMessage('Рисунок сохранен!');
    } catch (err) {
      console.error("Save pixels error:", err);
      setMessage('Ошибка при сохранении!');
    }
  };

  const handleFeed = async (item: InventoryItem) => {
    if (!userProfile) return;

    const newInventory = (userProfile.inventory || []).filter(i => i.id !== item.id);
    const itemId = item.itemId;
    const itemName = item.name;

    
    let statBoost = { logic: 1, speed: 1, power: 1, intellect: 1 };
    if (itemId.includes('burger')) statBoost = { logic: 0, speed: 0, power: 5, intellect: 0 };
    if (itemId.includes('pizza')) statBoost = { logic: 2, speed: 0, power: 3, intellect: 0 };
    if (itemId.includes('apple')) statBoost = { logic: 5, speed: 0, power: 0, intellect: 0 };
    if (itemId.includes('coffee')) statBoost = { logic: 0, speed: 5, power: 0, intellect: 0 };
    if (itemId.includes('energy')) statBoost = { logic: 0, speed: 8, power: 0, intellect: 0 };
    if (itemId.includes('brain')) statBoost = { logic: 0, speed: 0, power: 0, intellect: 8 };
    if (itemId === 'bit_bot_food') {
      const stats: ('logic'|'speed'|'power'|'intellect')[] = ['logic', 'speed', 'power', 'intellect'];
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      statBoost = { logic: 0, speed: 0, power: 0, intellect: 0, [randomStat]: 10 };
    }

    const updatedPet = {
      ...pet,
      level: pet.level + 1,
      stats: {
        logic: (pet.stats.logic || 10) + statBoost.logic,
        speed: (pet.stats.speed || 10) + statBoost.speed,
        power: (pet.stats.power || 10) + statBoost.power,
        intellect: (pet.stats.intellect || 10) + statBoost.intellect
      },
      lastFed: Date.now()
    };

    await updateProfile({
      inventory: newInventory,
      pet: updatedPet
    });

    updateQuestProgress('pet_feed');
    setIsFeeding(false);
    playSound('levelUp');
    setMessage(`Вкусно! ${itemName.toUpperCase()} дал бонусы к статам!`);
  };

  const foodItems = (userProfile?.inventory || []).filter(item => 
    item.itemId.includes('food') || item.itemId.includes('burger') || item.itemId.includes('pizza') || 
    item.itemId.includes('apple') || item.itemId.includes('coffee') || item.itemId.includes('energy') ||
    item.itemId.includes('brain') || item.itemId === 'bit_bot_food'
  );

  const petTypes = [
    { id: 'pixel-slime', name: 'Слайм', icon: '💧', description: 'Гибкий и адаптивный' },
    { id: 'code-cube', name: 'Куб', icon: '🧊', description: 'Стабильный и мощный' },
    { id: 'bit-spark', name: 'Искра', icon: '⚡', description: 'Быстрый и энергичный' },
    { id: 'logic-owl', name: 'Сова', icon: '🦉', description: 'Мудрый и точный' },
    { id: 'cyber-cat', name: 'Кот', icon: '🐈', description: 'Ловкий и хитрый' },
    { id: 'ghost-shell', name: 'Призрак', icon: '👻', description: 'Неуловимый' },
    { id: 'dragon-bit', name: 'Дракон', icon: '🐲', description: 'Легендарный' }
  ];

  const handleStatBoost = async (stat: 'logic' | 'speed' | 'power') => {
    if ((userProfile?.coins || 0) < 50) {
      playSound('error');
      setMessage('Недостаточно монет для прокачки!');
      return;
    }

    const updatedPet = {
      ...pet,
      stats: {
        ...pet.stats,
        [stat]: pet.stats[stat] + 1
      }
    };

    await updateProfile({
      coins: (userProfile?.coins || 0) - 50,
      pet: updatedPet
    });
    
    playSound('levelUp');
    setMessage(`${stat.toUpperCase()} повышена!`);
  };

  const getPetEmoji = () => {
    if (pet.type.startsWith('emoji:')) {
      return pet.type.replace('emoji:', '') || '🤖';
    }
    return petTypes.find(t => t.id === pet.type)?.icon || '🤖';
  };

  const getPetTier = (level: number) => {
    if (level >= 20) return { id: 3, name: 'Ascended', color: 'text-purple-400', glow: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]', border: 'border-purple-500/50' };
    if (level >= 10) return { id: 2, name: 'Advanced', color: 'text-brand-primary', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.4)]', border: 'border-brand-primary/30' };
    return { id: 1, name: 'Basic', color: 'text-white/40', glow: '', border: 'border-white/10' };
  };

  const currentTier = getPetTier(pet.level);

  return (
    <div className="fixed bottom-8 left-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-24 left-0 w-[500px] glass rounded-[40px] p-12 border border-white/10 shadow-[0_20px_100px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">{pet.name}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                    <span className={`px-3 py-1 rounded-full bg-brand-primary/20 text-brand-primary border ${currentTier.border}`}>LVL {pet.level}</span>
                    <span className={currentTier.color}>{currentTier.name} Tier</span>
                    <span>{pet.xp} / 1000 XP</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsDrawing(!isDrawing); setIsCustomizing(false); }}
                    className={`p-3 rounded-2xl transition-all ${isDrawing ? 'bg-brand-primary text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    title="Рисовать"
                  >
                    <Palette className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => { setIsCustomizing(!isCustomizing); setIsDrawing(false); }}
                    className={`p-3 rounded-2xl transition-all ${isCustomizing ? 'bg-brand-primary text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    title="Настройки"
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isDrawing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-8 gap-1 aspect-square bg-black/40 p-2 rounded-2xl border border-white/10">
                    {pixels.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => handlePixelClick(i)}
                        className="w-full h-full rounded-sm border border-white/5 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2 max-w-[200px]">
                      {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ffffff', 'transparent', '#000000', '#ec4899', '#8b5cf6'].map(c => (
                        <button
                          key={c}
                          onClick={() => setCurrentColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${currentColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: c === 'transparent' ? 'white' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={clearPixels}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                        title="Очистить"
                      >
                        <Eraser className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={savePixels}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-black font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        <Save className="w-4 h-4" /> Сохранить
                      </button>
                    </div>
                  </div>
                </div>
              ) : isCustomizing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {petTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => updateProfile({ pet: { ...pet, type: type.id } })}
                        className={`p-3 rounded-2xl border transition-all ${pet.type === type.id ? 'bg-brand-primary/20 border-brand-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        title={type.name}
                      >
                        <span className="text-xl">{type.icon}</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Вид (Эмодзи)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={pet.type.startsWith('emoji:') ? pet.type.replace('emoji:', '') : ''}
                        onChange={(e) => updateProfile({ pet: { ...pet, type: `emoji:${e.target.value}` } })}
                        className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary"
                        placeholder="Введите эмодзи..."
                        maxLength={2}
                      />
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl border border-white/10">
                        {pet.type.startsWith('emoji:') ? pet.type.replace('emoji:', '') : '🤖'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Имя питомца</label>
                    <input 
                      type="text"
                      value={pet.name}
                      onChange={(e) => updateProfile({ pet: { ...pet, name: e.target.value } })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      placeholder="Имя питомца"
                    />
                  </div>
                  <button 
                    onClick={() => setIsCustomizing(false)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Готово
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-center py-12 relative">
                    <motion.div
                      animate={{ 
                        y: [0, -15, 0],
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative cursor-pointer group"
                      onClick={() => {
                        playSound('click');
                        setMessage('Бип-буп! Я готов к кодингу!');
                      }}
                    >
                      {pet.customPixels && pet.customPixels.some(p => p !== 'transparent') ? (
                        <div className={`grid grid-cols-8 gap-0.5 w-32 h-32 transition-all duration-500 ${currentTier.glow}`}>
                          {pet.customPixels.map((c, i) => (
                            <div key={i} className="w-full h-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          {currentTier.id >= 2 && (
                            <motion.div 
                               animate={{ rotate: 360 }}
                               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                               className={`absolute -inset-8 rounded-full border-2 border-dashed ${currentTier.id === 3 ? 'border-purple-500/20' : 'border-brand-primary/20'}`}
                            />
                          )}
                          <span className={`text-8xl transition-all duration-500 ${currentTier.glow.replace('shadow-', 'drop-shadow-')}`}>
                            {getPetEmoji()}
                          </span>
                        </div>
                      )}
                      
                      {}
                      {currentTier.id >= 2 && (
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                           {pet.level >= 10 && (
                             <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[8px] font-black text-blue-400 uppercase tracking-tighter whitespace-nowrap">
                               Logic Aura Active
                             </div>
                           )}
                           {pet.level >= 20 && (
                             <div className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-[8px] font-black text-yellow-500 uppercase tracking-tighter whitespace-nowrap">
                               Coin Magnet x1.2
                             </div>
                           )}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-8">
                    <button 
                      onClick={() => handleStatBoost('logic')}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group"
                    >
                      <BrainCircuit className="w-4 h-4 text-blue-400 mb-1 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[8px] font-bold text-white/40 uppercase">Logic</div>
                      <div className="text-xs font-black">{pet.stats.logic}</div>
                    </button>
                    <button 
                      onClick={() => handleStatBoost('speed')}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                      <Zap className="w-4 h-4 text-emerald-400 mb-1 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[8px] font-bold text-white/40 uppercase">Speed</div>
                      <div className="text-xs font-black">{pet.stats.speed}</div>
                    </button>
                    <button 
                      onClick={() => handleStatBoost('power')}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all group"
                    >
                      <Swords className="w-4 h-4 text-red-400 mb-1 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[8px] font-bold text-white/40 uppercase">Power</div>
                      <div className="text-xs font-black">{pet.stats.power}</div>
                    </button>
                    <button 
                      onClick={() => handleStatBoost('intellect' as any)}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group"
                    >
                      <BrainCircuit className="w-4 h-4 text-purple-400 mb-1 mx-auto group-hover:scale-110 transition-transform" />
                      <div className="text-[8px] font-bold text-white/40 uppercase">Intellect</div>
                      <div className="text-xs font-black">{pet.stats.intellect || 10}</div>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-brand-primary/10 border border-white/10 flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        <MessageSquareCode className="w-5 h-5 text-brand-primary" />
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-medium">
                        {message || 'Твой верный спутник в мире Python. Прокачивай его, чтобы получать бонусы!'}
                      </p>
                    </div>

                    {mentorHint && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Совет Ментора</p>
                          <p className="text-xs text-white/70 leading-relaxed font-medium">
                            {mentorHint}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          if (foodItems.length === 0) {
                            playSound('error');
                            setMessage('У вас нет еды! Купите её в магазине.');
                          } else {
                            setIsFeeding(true);
                          }
                        }}
                        className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      >
                        <Utensils className="w-4 h-4 text-orange-500" /> Покормить
                      </button>
                      <button 
                        onClick={handleGetHint}
                        disabled={isMentorLoading}
                        className="py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                      >
                        {isMentorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                        Ментор
                      </button>
                    </div>

                    {}
                    <AnimatePresence>
                      {isFeeding && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute inset-x-8 bottom-8 glass rounded-3xl p-6 border border-white/20 z-50 shadow-2xl"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest">Выберите еду</h4>
                            <button onClick={() => setIsFeeding(false)} className="text-white/40 hover:text-white text-[10px] font-bold">Закрыть</button>
                          </div>
                          <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2">
                            {foodItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleFeed(item)}
                                className="aspect-square bg-white/5 hover:bg-brand-primary/20 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 transition-all group"
                              >
                                <span className="text-lg group-hover:scale-110 transition-transform">
                                  {item.itemId.includes('burger') ? '🍔' : 
                                   item.itemId.includes('pizza') ? '🍕' :
                                   item.itemId.includes('apple') ? '🍎' :
                                   item.itemId.includes('coffee') ? '☕' :
                                   item.itemId.includes('energy') ? '⚡' :
                                   item.itemId.includes('brain') ? '🧠' : '🍱'}
                                </span>
                                <span className="text-[8px] font-bold text-white/40 uppercase truncate w-full text-center px-1">
                                  {item.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
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
        className={`w-16 h-16 rounded-full glass border-2 flex items-center justify-center text-3xl shadow-2xl transition-all ${isOpen ? 'border-brand-primary bg-brand-primary/20 rotate-12' : 'border-white/10 hover:border-brand-primary/50'}`}
      >
        {getPetEmoji()}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-bg-dark">
          {pet.level}
        </div>
      </motion.button>
    </div>
  );
});

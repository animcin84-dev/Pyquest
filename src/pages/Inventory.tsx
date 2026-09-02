import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Backpack, Shield, Zap, Swords, Brain, Heart, Star, ShoppingBag, Trash2, Coins, ArrowRight, User, ArrowRightLeft, Search, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ALL_ITEMS } from './Shop';
import { playSound } from '../utils/sounds';
import { toast } from 'sonner';
import { TextReveal } from '../components/TextReveal';

const InventoryItemCard = React.memo(({ item, index, onSelect }: { item: any, index: number, onSelect: (item: any) => void }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(item)}
      className={`aspect-square glass rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 transition-all hover:border-brand-primary/50 group relative ${
        item.rarity === 'legendary' ? 'shadow-[0_0_20px_rgba(234,179,8,0.1)]' : ''
      }`}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
        item.rarity === 'legendary' ? 'from-yellow-400 to-orange-600' :
        item.rarity === 'epic' ? 'from-purple-500 to-pink-600' :
        item.rarity === 'rare' ? 'from-blue-500 to-indigo-600' :
        'from-gray-500 to-gray-700'
      } flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
        {item.icon}
      </div>
      <span className="text-[10px] font-bold text-white/60 text-center line-clamp-1">{item.name}</span>
      
      {item.rarity === 'legendary' && (
        <div className="absolute top-2 right-2">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-pulse" />
        </div>
      )}
    </motion.button>
  );
});

export const Inventory = () => {
  const { userProfile, quickSellItem, listMarketplaceItem, updateProfile, searchUsers, sendTradeRequest, getTradeRequests, acceptTradeRequest, cancelTradeRequest, updateQuestProgress, useItem } = useAuth();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [marketPrice, setMarketPrice] = useState(100);
  const [activeTab, setActiveTab] = useState<'items' | 'trades' | 'quests'>('items');
  
  
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [myTradeItems, setMyTradeItems] = useState<string[]>([]);
  const [theirTradeItems, setTheirTradeItems] = useState<string[]>([]);
  const [pendingTrades, setPendingTrades] = useState<any[]>([]);

  const loadTrades = React.useCallback(async () => {
    const trades = await getTradeRequests();
    setPendingTrades(trades);
  }, [getTradeRequests]);

  useEffect(() => {
    if (activeTab === 'trades') {
      loadTrades();
    }
  }, [activeTab, loadTrades]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
  };

  const handleSendTrade = async () => {
    if (!targetUser) return;
    await sendTradeRequest(targetUser.uid, myTradeItems, theirTradeItems);
    setShowTradeModal(false);
    setTargetUser(null);
    setMyTradeItems([]);
    setTheirTradeItems([]);
    playSound('success');
  };

  const inventoryItems = React.useMemo(() => {
    if (!userProfile) return [];
    return (userProfile.inventory || []).map(invItem => {
      const item = ALL_ITEMS.find(i => i.id === invItem.itemId);
      return item ? { ...item, inventoryId: invItem.id } : null;
    }).filter(Boolean) as any[];
  }, [userProfile]);

  const handleUseItemClick = React.useCallback(async (inventoryId: string) => {
    await useItem(inventoryId);
    setSelectedItem(null);
  }, [useItem]);

  const handleSell = React.useCallback(async () => {
    if (!selectedItem) return;
    const success = await quickSellItem(selectedItem.inventoryId);
    if (success) {
      setSelectedItem(null);
      setShowSellConfirm(false);
    }
  }, [selectedItem, quickSellItem]);

  const handleListOnMarket = React.useCallback(async () => {
    if (!selectedItem) return;
    const success = await listMarketplaceItem(selectedItem.inventoryId, marketPrice);
    if (success) {
      setSelectedItem(null);
      setShowMarketplaceModal(false);
    }
  }, [selectedItem, marketPrice, listMarketplaceItem]);

  const stats = React.useMemo(() => {
    if (!userProfile) return [];
    return [
      { label: 'Логика', value: userProfile.stats?.logic || 1, icon: <Brain className="w-4 h-4 text-indigo-400" />, color: 'from-indigo-500 to-purple-600' },
      { label: 'Скорость', value: userProfile.stats?.speed || 1, icon: <Zap className="w-4 h-4 text-yellow-400" />, color: 'from-yellow-500 to-orange-600' },
      { label: 'Сила', value: userProfile.stats?.power || 1, icon: <Swords className="w-4 h-4 text-red-400" />, color: 'from-red-500 to-pink-600' },
      { label: 'Интеллект', value: userProfile.stats?.intellect || 1, icon: <Star className="w-4 h-4 text-blue-400" />, color: 'from-blue-500 to-cyan-600' },
      { label: 'Выносливость', value: userProfile.stats?.stamina || 1, icon: <Heart className="w-4 h-4 text-green-400" />, color: 'from-green-500 to-emerald-600' },
    ];
  }, [userProfile]);

  const handleSelectItem = React.useCallback((item: any) => {
    setSelectedItem(item);
  }, []);

  if (!userProfile) return null;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-48 h-48 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full p-1 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden border-4 border-white/10">
                      {userProfile.avatar ? (
                        <img src={userProfile.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-24 h-24 text-white/20" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-brand-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-4 border-[#0a0a0a] shadow-xl">
                    {userProfile.level}
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter">{userProfile.username}</h1>
                  <p className="text-brand-primary font-bold uppercase tracking-widest text-xs mt-1">Python Developer</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between group/stat hover:bg-white/5 transition-all cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover/stat:scale-110 transition-transform`}>
                          {stat.icon}
                        </div>
                        <span className="text-sm font-bold text-white/60">{stat.label}</span>
                      </div>
                      <span className="text-xl font-black text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="glass rounded-3xl p-8 border border-white/10 min-h-[600px]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <Backpack className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">
                    <TextReveal text="Инвентарь" delay={0.1} />
                  </h2>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all text-sm ${activeTab === 'items' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                  >
                    Предметы
                  </button>
                  <button
                    onClick={() => setActiveTab('trades')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'trades' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                  >
                    Обмен
                    {pendingTrades.length > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('quests')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'quests' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                  >
                    Квесты
                  </button>
                </div>
              </div>

              {activeTab === 'items' ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-white/40 font-bold text-sm">
                      {inventoryItems.length} / 50 предметов
                    </div>
                    <button
                      onClick={() => setShowTradeModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-primary/20 text-brand-primary rounded-xl border border-brand-primary/30 text-sm font-bold hover:bg-brand-primary/30 transition-all"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Предложить обмен
                    </button>
                  </div>

                  {inventoryItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-white/10" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Пусто...</h3>
                        <p className="text-white/40">У вас пока нет предметов. Загляните в магазин!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {inventoryItems.map((item, idx) => (
                        <InventoryItemCard
                          key={item.inventoryId || idx}
                          item={item}
                          index={idx}
                          onSelect={handleSelectItem}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : activeTab === 'trades' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Входящие предложения</h3>
                    <button 
                      onClick={loadTrades}
                      className="text-xs text-brand-primary font-bold hover:underline"
                    >
                      Обновить
                    </button>
                  </div>

                  {pendingTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <ArrowRightLeft className="w-12 h-12 text-white/10" />
                      <p className="text-white/40">Нет активных предложений обмена</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingTrades.map((trade) => (
                        <div key={trade.id} className="glass rounded-2xl p-6 border border-white/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-brand-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-white/40">Отправитель</p>
                                <p className="font-bold text-white">{trade.senderName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-white/20 uppercase tracking-widest">Предложение</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-white/40 uppercase">Вы получите:</p>
                              <div className="flex flex-wrap gap-2">
                                {trade.senderItems.map((id: string, i: number) => (
                                  <div key={i} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10" title={id}>
                                    {ALL_ITEMS.find(item => item.id === id)?.icon || <Star className="w-4 h-4" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-white/40 uppercase">Вы отдадите:</p>
                              <div className="flex flex-wrap gap-2">
                                {trade.receiverItems.map((id: string, i: number) => (
                                  <div key={i} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10" title={id}>
                                    {ALL_ITEMS.find(item => item.id === id)?.icon || <Star className="w-4 h-4" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => acceptTradeRequest(trade.id).then(loadTrades)}
                              className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-secondary transition-all flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" /> Принять
                            </button>
                            <button
                              onClick={() => cancelTradeRequest(trade.id).then(loadTrades)}
                              className="flex-1 py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" /> Отклонить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Ежедневные Квесты</h3>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] text-white/40 font-mono uppercase tracking-widest">
                      Обновление через: {Math.max(0, 24 - Math.floor((new Date().getTime() - (userProfile.lastQuestUpdate?.toDate().getTime() || 0)) / (1000 * 60 * 60)))}ч
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {userProfile.dailyQuests?.map(quest => (
                      <div key={quest.id} className={`glass rounded-3xl p-6 border transition-all ${quest.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className={`text-lg font-bold ${quest.completed ? 'text-emerald-500' : 'text-white'}`}>{quest.title}</h3>
                              {quest.completed && <div className="px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black uppercase rounded-full">Выполнено</div>}
                            </div>
                            <p className="text-sm text-white/60">{quest.description}</p>
                            
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-1.5">
                                <Coins className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs font-bold text-yellow-500">+{quest.reward.coins}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-brand-primary" />
                                <span className="text-xs font-bold text-brand-primary">+{quest.reward.xp} XP</span>
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-48 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                              <span>Прогресс</span>
                              <span>{quest.current} / {quest.target}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(quest.current / quest.target) * 100}%` }}
                                className={`h-full rounded-full ${quest.completed ? 'bg-emerald-500' : 'bg-brand-primary'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {}
      <AnimatePresence>
        {showTradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass rounded-3xl p-8 border border-white/10 space-y-8 my-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white tracking-tighter">Новое предложение обмена</h3>
                <button onClick={() => setShowTradeModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!targetUser ? (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text"
                      placeholder="Поиск игрока по имени..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:border-brand-primary outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.map((user) => (
                      <button
                        key={user.uid}
                        onClick={() => setTargetUser(user)}
                        className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5 hover:border-brand-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center overflow-hidden border border-white/10">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-brand-primary" />}
                          </div>
                          <span className="font-bold text-white">{user.username}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-brand-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center overflow-hidden">
                        {targetUser.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-brand-primary" />}
                      </div>
                      <span className="font-bold text-white">Обмен с {targetUser.username}</span>
                    </div>
                    <button onClick={() => setTargetUser(null)} className="text-xs text-brand-primary font-bold hover:underline">Изменить</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Ваши предметы ({myTradeItems.length})</h4>
                      <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {inventoryItems.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (myTradeItems.includes(item.id)) {
                                setMyTradeItems(myTradeItems.filter(id => id !== item.id));
                              } else {
                                setMyTradeItems([...myTradeItems, item.id]);
                              }
                            }}
                            className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                              myTradeItems.includes(item.id) ? 'bg-brand-primary/20 border-brand-primary' : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              {item.icon}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Предметы игрока</h4>
                      <p className="text-[10px] text-white/20 italic">Примечание: Вы запрашиваете эти предметы у игрока.</p>
                      <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {ALL_ITEMS.slice(0, 12).map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (theirTradeItems.includes(item.id)) {
                                setTheirTradeItems(theirTradeItems.filter(id => id !== item.id));
                              } else {
                                setTheirTradeItems([...theirTradeItems, item.id]);
                              }
                            }}
                            className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                              theirTradeItems.includes(item.id) ? 'bg-yellow-500/20 border-yellow-500' : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              {item.icon}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSendTrade}
                      disabled={myTradeItems.length === 0 && theirTradeItems.length === 0}
                      className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Отправить предложение
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${
                selectedItem.rarity === 'legendary' ? 'from-yellow-400 to-orange-600' :
                selectedItem.rarity === 'epic' ? 'from-purple-500 to-pink-600' :
                selectedItem.rarity === 'rare' ? 'from-blue-500 to-indigo-600' :
                'from-gray-500 to-gray-700'
              }`} />

              <div className="flex flex-col items-center text-center space-y-6">
                <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${
                  selectedItem.rarity === 'legendary' ? 'from-yellow-400 to-orange-600' :
                  selectedItem.rarity === 'epic' ? 'from-purple-500 to-pink-600' :
                  selectedItem.rarity === 'rare' ? 'from-blue-500 to-indigo-600' :
                  'from-gray-500 to-gray-700'
                } flex items-center justify-center shadow-2xl`}>
                  <div className="w-16 h-16 flex items-center justify-center">
                    {selectedItem.icon}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      selectedItem.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                      selectedItem.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                      selectedItem.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {selectedItem.rarity}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter">{selectedItem.name}</h3>
                  <p className="text-white/60 mt-2">{selectedItem.description}</p>
                </div>

                <div className="w-full grid grid-cols-1 gap-4">
                  {(selectedItem.id.includes('booster') || 
                    selectedItem.id.includes('serum') || 
                    selectedItem.id.includes('gloves') || 
                    selectedItem.id.includes('chip') || 
                    selectedItem.id.includes('drink') ||
                    selectedItem.id.includes('apple') ||
                    selectedItem.id.includes('coffee') ||
                    selectedItem.id.includes('burger') ||
                    selectedItem.id.includes('pizza') ||
                    selectedItem.id.includes('energy') ||
                    selectedItem.id.includes('brain') ||
                    selectedItem.id.includes('scroll') ||
                    selectedItem.id.includes('code_breaker') ||
                    selectedItem.id.includes('logic_staff') ||
                    selectedItem.id.includes('binary_dagger') ||
                    selectedItem.id.includes('compiler_shield') ||
                    selectedItem.id.includes('neural_bow') ||
                    selectedItem.id.includes('data_scythe') ||
                    selectedItem.id.includes('golden_apple') ||
                    selectedItem.id.includes('xp_boost') ||
                    selectedItem.id.includes('guido') ||
                    selectedItem.id === 'data_crystal' ||
                    selectedItem.id === 'coding_manual' ||
                    selectedItem.id === 'mystery_box' ||
                    selectedItem.id === 'quantum_core' ||
                    selectedItem.id === 'neural_link'
                  ) && (
                    <button
                      onClick={() => handleUseItemClick(selectedItem.inventoryId)}
                      className="flex items-center justify-center gap-2 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                      Использовать
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowSellConfirm(true)}
                      className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-500 rounded-2xl border border-white/10 transition-all font-bold group"
                    >
                      <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Продать
                    </button>
                    <button
                      onClick={() => setShowMarketplaceModal(true)}
                      className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-brand-primary/20 text-white/60 hover:text-brand-primary rounded-2xl border border-white/10 transition-all font-bold group"
                    >
                      <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      На рынок
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl font-bold transition-all"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {showSellConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass rounded-3xl p-8 border border-white/10 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Вы уверены?</h3>
                <p className="text-white/60 mt-2">Вы получите <span className="text-yellow-500 font-bold">100 монет</span> за этот предмет.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowSellConfirm(false)}
                  className="py-4 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSell}
                  className="py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all"
                >
                  Продать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {showMarketplaceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass rounded-3xl p-8 border border-white/10 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-10 h-10 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter">Выставить на рынок</h3>
                <p className="text-white/60 mt-2">Укажите цену продажи</p>
              </div>
              
              <div className="relative">
                <input 
                  type="number"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-2xl font-black text-white text-center focus:border-brand-primary outline-none transition-all"
                />
                <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-yellow-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowMarketplaceModal(false)}
                  className="py-4 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleListOnMarket}
                  className="py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all"
                >
                  Выставить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

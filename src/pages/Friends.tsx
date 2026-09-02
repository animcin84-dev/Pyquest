import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Check, X, Search, Loader2, Star, Trophy, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SocialService, FriendRequest } from '../services/SocialService';
import { SocialPanel } from '../components/SocialPanel';
import { toast } from 'sonner';

export const Friends = () => {
  const { userProfile } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatUserId, setChatUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = SocialService.subscribeToIncomingRequests(setRequests);
    return () => unsub();
  }, []);

  const fetchFriends = async () => {
    if (!userProfile?.friends || userProfile.friends.length === 0) {
      setFriends([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const profiles = await SocialService.fetchFriendsProfiles(userProfile.friends);
      setFriends(profiles);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [userProfile?.friends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await SocialService.searchUsersPartial(searchUsername.trim());
      setSearchResults(results);
    } catch (error: any) {
       toast.error(error.message || 'Ошибка поиска');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetId: string, targetUsername: string) => {
    try {
      await SocialService.sendFriendRequest(targetId, targetUsername);
      setSearchResults(prev => prev.filter(u => u.uid !== targetId));
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки запроса');
    }
  };

  const handleAccept = async (req: FriendRequest) => {
    try {
      await SocialService.acceptRequest(req.id, req.senderId);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка принятия заявки');
    }
  };

  const handleDecline = async (reqId: string) => {
    try {
      await SocialService.declineRequest(reqId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('Вы уверены, что хотите удалить пользователя из друзей?')) {
      try {
        await SocialService.removeFriend(friendId);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-6"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-[0.3em]">Социальная Сеть</span>
            </motion.div>
            <h1 className="text-6xl font-display font-black tracking-tighter mb-4">
              Друзья и <span className="text-brand-primary italic serif">Напарники</span>
            </h1>
            <p className="text-white/40 text-xl font-medium">
              Добавляйте друзей, следите за их прогрессом и обменивайтесь опытом.
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass rounded-[3rem] p-10 border border-brand-primary/20 relative overflow-hidden shadow-2xl shadow-brand-primary/5">
               <div className="absolute top-0 right-0 p-8 opacity-5"><UserPlus className="w-32 h-32" /></div>
               <h3 className="text-xl font-black mb-6 relative z-10 flex items-center gap-2">
                 <Search className="w-5 h-5 text-brand-primary" /> Найти напарника
               </h3>
               <form onSubmit={handleSearch} className="relative z-10 space-y-4">
                 <input 
                   type="text" 
                   value={searchUsername}
                   onChange={e => {
                     setSearchUsername(e.target.value);
                     if (!e.target.value.trim()) setSearchResults([]);
                   }}
                   placeholder="Введите никнейм..." 
                   className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors font-bold text-lg"
                 />
                 <button 
                   type="submit" 
                   disabled={isSearching || !searchUsername.trim()}
                   className="w-full py-5 rounded-2xl bg-brand-primary text-black font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-brand-primary/20"
                 >
                   {isSearching ? 'ПОИСК ИГРОКОВ...' : 'НАЙТИ ДРУГА'}
                 </button>
               </form>

               {}
               <AnimatePresence>
                 {searchResults.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="mt-6 space-y-3 relative z-10"
                   >
                     {searchResults.map(user => (
                       <div key={user.uid} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold">
                             {user.avatar || user.username?.[0]?.toUpperCase() || 'U'}
                           </div>
                           <div>
                             <p className="font-bold text-sm text-white">{user.username}</p>
                             <p className="text-[10px] text-white/40 uppercase tracking-widest">Ур. {user.level || 1}</p>
                           </div>
                         </div>
                         <button 
                           onClick={() => handleAddFriend(user.uid, user.username)}
                           className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                           title="Добавить"
                         >
                           <UserPlus className="w-5 h-5" />
                         </button>
                       </div>
                     ))}
                   </motion.div>
                 )}
                 {searchUsername.trim() && searchResults.length === 0 && !isSearching && (
                   <div className="mt-6 text-center text-sm font-bold text-white/40 uppercase tracking-widest relative z-10">
                     Увы, никого нет...
                   </div>
                 )}
               </AnimatePresence>
            </div>

            <AnimatePresence>
              {requests.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 20 }}
                   className="glass rounded-[3rem] p-8 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Users className="w-24 h-24 text-emerald-500" /></div>
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center justify-between relative z-10">
                    <span>Входящие Запросы</span>
                    <span className="bg-emerald-500 text-black px-3 py-1 rounded-lg text-xs shadow-lg">{requests.length}</span>
                  </h3>
                  
                  <div className="space-y-4 relative z-10">
                    {requests.map(req => (
                      <div key={req.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                        <div>
                          <p className="font-bold text-lg text-white">{req.senderName}</p>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Хочет дружить</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(req)} className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all hover:scale-105">
                            <Check className="w-6 h-6" />
                          </button>
                          <button onClick={() => handleDecline(req.id)} className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all hover:scale-105">
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {}
          <div className="lg:col-span-2">
             <div className="glass rounded-[3rem] p-10 border border-white/10 min-h-[600px] flex flex-col">
               <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/5">
                 <h2 className="text-3xl font-black flex items-center gap-4">
                   Список Друзей
                   <span className="text-sm px-4 py-2 rounded-xl bg-white/5 text-brand-primary font-black uppercase tracking-widest border border-brand-primary/20">
                     {friends.length} Всего
                   </span>
                 </h2>
               </div>

               {isLoading ? (
                 <div className="flex-1 flex justify-center items-center">
                   <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
                 </div>
               ) : friends.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center">
                   <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                     <Users className="w-12 h-12 text-white/50" />
                   </div>
                   <p className="text-2xl font-black mb-3 text-white">У вас еще нет друзей</p>
                   <p className="text-xs font-bold text-white/40 uppercase tracking-widest max-w-[250px] leading-relaxed">Используйте поиск слева, чтобы найти напарников для игры</p>
                 </div>
               ) : (
                 <div className="grid md:grid-cols-2 gap-6 flex-1 content-start">
                   {friends.map((friend, idx) => (
                     <motion.div
                       key={friend.uid || idx}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: idx * 0.05 }}
                       className="p-6 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-between group hover:border-brand-primary/50 transition-all cursor-pointer relative overflow-hidden"
                     >
                       <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                       
                       <div className="flex items-center gap-5 relative z-10 w-full">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-2xl font-bold text-brand-primary shadow-inner">
                           {friend.avatar || friend.username?.[0]?.toUpperCase() || 'U'}
                         </div>
                         <div className="flex-1">
                           <div className="font-black text-xl mb-1 text-white group-hover:text-brand-primary transition-colors">{friend.username}</div>
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                             <span className="flex items-center gap-1.5 text-emerald-400">
                               <Star className="w-3.5 h-3.5" /> Уровень {friend.level || 1}
                             </span>
                             <span className="flex items-center gap-1.5 text-yellow-500">
                               <Trophy className="w-3.5 h-3.5" /> Ранг {friend.rank || 'F'}
                             </span>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <button
                             onClick={(e) => { e.stopPropagation(); setChatUserId(friend.uid || friend.__name__); }}
                             className="w-10 h-10 flex-shrink-0 rounded-[1rem] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center justify-center hover:bg-brand-primary hover:text-black transition-all transform hover:scale-105"
                             title="Написать сообщение"
                           >
                             <MessageSquare className="w-5 h-5" />
                           </button>
                           <button
                             onClick={(e) => { e.stopPropagation(); handleRemoveFriend(friend.uid || friend.__name__); }}
                             className="w-10 h-10 flex-shrink-0 rounded-[1rem] bg-red-500/10 text-red-500 border border-red-500/0 flex items-center justify-center opacity-30 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all transform hover:scale-105"
                             title="Удалить друга"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                 </div>
               )}
             </div>
          </div>
          
        </div>
      </div>

      <SocialPanel 
        isOpen={chatUserId !== null} 
        onClose={() => setChatUserId(null)} 
        initialChatUserId={chatUserId} 
      />
    </div>
  );
};

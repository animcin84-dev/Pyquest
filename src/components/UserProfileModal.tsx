import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Star, Zap, Brain, Swords, Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';
import { UserProfile } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: (user: UserProfile) => void;
  onAddFriend?: (user: UserProfile) => void;
  currentUserId?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  onMessage,
  onAddFriend,
  currentUserId
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const stats = [
    { name: 'Логика', value: user.stats?.logic || 0, icon: <Brain className="w-4 h-4 text-indigo-400" /> },
    { name: 'Скорость', value: user.stats?.speed || 0, icon: <Zap className="w-4 h-4 text-yellow-500" /> },
    { name: 'Сила', value: user.stats?.power || 0, icon: <Swords className="w-4 h-4 text-red-500" /> },
    { name: 'Интеллект', value: user.stats?.intellect || 0, icon: <Star className="w-4 h-4 text-blue-400" /> },
    { name: 'Выносливость', value: user.stats?.stamina || 0, icon: <Heart className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-[#0a0a0a] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative"
        >
          {}
          <div className="h-32 bg-brand-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={onClose}
                className="p-2 bg-black/50 text-white hover:text-red-500 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-6 relative -mt-16">
            {}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`} 
                  alt={user.username}
                  className="w-32 h-32 rounded-3xl bg-[#111] border-4 border-[#0a0a0a] shadow-xl p-2"
                />
                <div className="absolute -bottom-2 -right-2 bg-[#0a0a0a] rounded-full p-1">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center font-black text-black text-xs">
                    {user.level}
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white mt-4 flex items-center gap-2">
                {user.username}
                {user.role === 'admin' && (
                  <span title="Admin">
                    <Shield className="w-5 h-5 text-red-500" />
                  </span>
                )}
              </h2>
              <p className="text-brand-primary font-mono text-sm tracking-widest uppercase mt-1">
                {user.xp.toLocaleString()} XP
              </p>
              
              {user.bio && (
                <p className="text-white/40 text-sm mt-4 text-center px-4 max-w-xs italic">
                  "{user.bio}"
                </p>
              )}
            </div>

            {}
            <div className="mt-8">
              <h3 className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-4 px-2">Боевые Характеристики</h3>
              <div className="grid grid-cols-2 gap-2">
                {stats.map(s => (
                  <div key={s.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="p-2 bg-black/40 rounded-xl">
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase font-black">{s.name}</div>
                      <div className="text-sm font-black text-white">{s.value}</div>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center gap-3 p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 col-span-2">
                  <div className="p-2 bg-black/40 rounded-xl">
                    <Trophy className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] text-brand-primary/60 uppercase font-black">Пройдено Уроков</div>
                    <div className="text-sm font-black text-white">{user.completedLessons?.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {}
            {currentUserId && (
              <div className="space-y-3 mt-8">
                {currentUserId !== user.uid && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-private-chat', { detail: { userId: user.uid } }));
                        onClose();
                        onMessage?.(user);
                      }}
                      className="flex-1 py-3 bg-brand-primary text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Написать
                    </button>
                    <button 
                      onClick={() => onAddFriend?.(user)}
                      className="flex-1 py-3 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                    >
                      <UserPlus className="w-4 h-4" />
                      В друзья
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => {
                    navigate(`/u/${user.username}`);
                    onClose();
                  }}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white hover:text-brand-primary hover:border-brand-primary/50 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  Explore Full Profile <Star className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

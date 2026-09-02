import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Navbar } from '../components/Layout';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { UserProfile, useAuth } from '../contexts/AuthContext';
import { TextReveal } from '../components/TextReveal';
import { MagneticButton } from '../components/MagneticButton';
import { UserProfileModal } from '../components/UserProfileModal';

const LeaderboardRow = React.memo(({ user, index, onClick }: { user: UserProfile, index: number, onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-all group cursor-pointer ${
        index < 3 ? 'bg-brand-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <div className="col-span-1 text-center font-mono text-lg font-bold">
        {index === 0 ? (
          <span className="text-yellow-400">🥇</span>
        ) : index === 1 ? (
          <span className="text-gray-400">🥈</span>
        ) : index === 2 ? (
          <span className="text-amber-600">🥉</span>
        ) : (
          <span className="text-white/20">{index + 1}</span>
        )}
      </div>
      
      <div className="col-span-6 flex items-center gap-4">
        <div className="relative">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`}
            alt={user.username}
            className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 p-1 group-hover:scale-110 transition-transform"
            referrerPolicy="no-referrer"
          />
          {index < 3 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-primary flex items-center justify-center">
              <Icons.Star className="w-2 h-2 text-white fill-current" />
            </div>
          )}
        </div>
        <div>
          <div className="font-bold text-lg group-hover:text-brand-primary transition-colors">
            {user.username}
          </div>
          <div className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
            {user.role === 'admin' ? 'Системный Админ' : 'Кодер'}
          </div>
        </div>
      </div>

      <div className="col-span-2 text-center">
        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold">
          Lvl {user.level}
        </span>
      </div>

      <div className="col-span-3 text-right font-mono text-brand-primary font-bold text-xl">
        {user.xp.toLocaleString()}
      </div>
    </motion.div>
  );
});

export const Leaderboard = () => {
  const { currentUser } = useAuth();
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('xp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      setTopUsers(users);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserClick = React.useCallback((user: UserProfile) => {
    setSelectedUser(user);
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-[#050505] text-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-full bg-brand-primary/10 mb-6"
          >
            <Icons.Trophy className="w-12 h-12 text-brand-primary" />
          </motion.div>
          <h1 className="text-5xl font-display font-bold mb-4 tracking-tight">
            <TextReveal text="Зал Славы" delay={0.1} />
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto font-light">
            <TextReveal text="Лучшие кодеры системы. Те, кто превратил байты в искусство." delay={0.3} />
          </p>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Игрок</div>
            <div className="col-span-2 text-center">Уровень</div>
            <div className="col-span-3 text-right">XP</div>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-20 text-center text-white/20 font-mono animate-pulse">
                Загрузка данных из матрицы...
              </div>
            ) : topUsers.length === 0 ? (
              <div className="p-20 text-center text-white/20 font-mono">
                Пока никого нет. Будь первым!
              </div>
            ) : (
              topUsers.map((user, index) => (
                <LeaderboardRow
                  key={user.uid}
                  user={user}
                  index={index}
                  onClick={() => handleUserClick(user)}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-12 p-8 glass rounded-[2rem] border-brand-primary/20 bg-brand-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center">
              <Icons.Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Хочешь попасть сюда?</h3>
              <p className="text-white/50 text-sm">Решай задачи, проходи уроки и зарабатывай XP!</p>
            </div>
          </div>
          <MagneticButton className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-all">
            Начать обучение
          </MagneticButton>
        </div>
      </div>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          currentUserId={currentUser?.uid}
          onMessage={() => alert('Чат в разработке!')}
          onAddFriend={() => alert('Друзья в разработке!')}
        />
      )}
    </div>
  );
};

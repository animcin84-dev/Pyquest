import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, Star, Swords, Zap, Brain, Heart, Trophy, 
  Code2, MessageSquare, Share2, ArrowLeft, Loader2, Calendar,
  ExternalLink, Github, Twitter, Globe
} from 'lucide-react';
import { Navbar } from '../components/Layout';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { playSound } from '../utils/sounds';
import { useAuth } from '../contexts/AuthContext';

interface PublicProfile {
  uid: string;
  username: string;
  avatar?: string;
  rank: string;
  level: number;
  xp: number;
  coins: number;
  stats: {
    logic: number;
    speed: number;
    power: number;
    intellect: number;
  };
  pet?: {
    name: string;
    type: string;
    level: number;
    customPixels?: string[];
  };
  achievements?: string[];
  bio?: string;
  joinDate?: any;
}

interface Snippet {
  id: string;
  title: string;
  description: string;
  stars: number;
  likes: number;
  createdAt: any;
  tags: string[];
}

export const UserProfilePublic = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { userProfile: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('Пользователь не найден');
        setIsLoading(false);
        return;
      }

      const userData = snapshot.docs[0].data() as PublicProfile;
      setProfile({ ...userData, uid: snapshot.docs[0].id });

      
      const snippetsRef = collection(db, 'snippets');
      const sq = query(
        snippetsRef, 
        where('authorName', '==', username), 
        orderBy('createdAt', 'desc'), 
        limit(10)
      );
      const sSnapshot = await getDocs(sq);
      setSnippets(sSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Snippet[]);

    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Ошибка при загрузке профиля');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <User className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white">{error || 'Ошибка'}</h1>
          <button 
            onClick={() => navigate('/community')}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            Вернуться в галерею
          </button>
        </div>
      </div>
    );
  }

  const getRankColor = (rank: string) => {
    if (rank.startsWith('S')) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    if (rank.startsWith('A')) return 'text-purple-400';
    if (rank.startsWith('B')) return 'text-blue-400';
    return 'text-white/60';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-primary selection:text-black">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {}
        <section className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-transparent to-brand-secondary/20 blur-[100px] opacity-30 -z-10" />
          
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-[40px] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
              <div className="w-48 h-48 bg-white/5 border-2 border-white/10 rounded-[40px] flex items-center justify-center text-7xl relative z-10 overflow-hidden shadow-2xl">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  profile.username[0].toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-brand-primary rounded-3xl flex items-center justify-center shadow-xl z-20 border-4 border-[#050505]">
                <Shield className="w-8 h-8 text-black" />
              </div>
            </div>

            <div className="flex-grow pb-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <h1 className="text-6xl font-black tracking-tighter uppercase italic">{profile.username}</h1>
                <div className={`text-4xl font-black italic ${getRankColor(profile.rank)}`}>
                  {profile.rank}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Level {profile.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Joined {profile.joinDate?.toDate ? profile.joinDate.toDate().toLocaleDateString() : 'Недавно'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-brand-primary" />
                  <span>{snippets.reduce((acc, s) => acc + (s.stars || 0), 0)} Stars earned</span>
                </div>
              </div>
              
              <p className="mt-6 text-white/60 max-w-xl text-lg font-medium leading-relaxed">
                {profile.bio || 'Этот мастер кода предпочитает, чтобы его работы говорили сами за себя. Проверьте его шедевры ниже!'}
              </p>
            </div>

            <div className="flex gap-4">
               {profile.uid !== currentUser?.uid && (
                 <button 
                   onClick={() => playSound('click')}
                   className="px-10 py-4 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20"
                 >
                   Challenge Player
                 </button>
               )}
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-12">
          {}
          <aside className="space-y-8">
            {}
            <div className="glass rounded-[40px] p-8 border border-white/10">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Zap className="w-6 h-6 text-brand-primary" /> Player Stats
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Logic', value: profile.stats.logic, icon: <Brain />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                  { label: 'Speed', value: profile.stats.speed, icon: <Zap />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                  { label: 'Power', value: profile.stats.power, icon: <Swords />, color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Intellect', value: profile.stats.intellect, icon: <Star />, color: 'text-blue-400', bg: 'bg-blue-500/10' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2 text-white/40">
                        {React.cloneElement(stat.icon as any, { className: 'w-3 h-3' })}
                        {stat.label}
                      </div>
                      <span className={stat.color}>{stat.value}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stat.value, 100)}%` }}
                        className={`h-full ${stat.bg.replace('/10', '')} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {}
            {profile.pet && (
              <div className="glass rounded-[40px] p-8 border border-white/10 bg-gradient-to-br from-brand-primary/5 to-transparent relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">{profile.pet.name}</h3>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Loyal Companion • LVL {profile.pet.level}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-white/10">
                    {profile.pet.type.startsWith('emoji:') ? profile.pet.type.replace('emoji:', '') : '🤖'}
                  </div>
                </div>
                
                <div className="flex justify-center py-6">
                  {profile.pet.customPixels && profile.pet.customPixels.some(p => p !== 'transparent') ? (
                    <div className="grid grid-cols-8 gap-0.5 w-32 h-32 scale-125">
                      {profile.pet.customPixels.map((c, i) => (
                        <div key={i} className="w-full h-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-8xl drop-shadow-[0_0_30px_rgba(99,102,241,0.4)] animate-bounce-slow">
                      {profile.pet.type.startsWith('emoji:') ? profile.pet.type.replace('emoji:', '') : '🤖'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic">Masterpieces</h3>
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">{snippets.length} Shared Snippets</div>
            </div>

            {snippets.length === 0 ? (
              <div className="h-[400px] glass rounded-[40px] border border-white/10 flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                   <Code2 className="w-10 h-10 text-white/10" />
                </div>
                <h4 className="text-xl font-bold text-white/40 uppercase tracking-widest">No shared code yet</h4>
                <p className="text-white/20 text-sm mt-2 max-w-xs">Этот кодер пока хранит свои секреты в тайне.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {snippets.map(snippet => (
                  <motion.div
                    key={snippet.id}
                    whileHover={{ y: -5 }}
                    onClick={() => navigate(`/community?id=${snippet.id}`)}
                    className="glass rounded-[32px] p-8 border border-white/10 hover:border-brand-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-bold mb-2 group-hover:text-brand-primary transition-colors">{snippet.title}</h4>
                        <p className="text-white/40 text-sm line-clamp-1">{snippet.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-brand-primary">
                          <Star className="w-4 h-4 fill-brand-primary" />
                          <span className="text-xs font-black">{snippet.stars || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-500">
                          <Heart className="w-4 h-4 fill-red-500" />
                          <span className="text-xs font-black">{snippet.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {snippet.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white/5 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                       <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                         Inspect Code <ExternalLink className="w-3 h-3" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, Heart, Share2, Search, Filter, Plus, User, Calendar, MessageSquare, Sparkles, X, Play, Copy, Check, Users, ArrowRight, Loader2, Star } from 'lucide-react';
import { Navbar } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc, increment, limit } from 'firebase/firestore';
import { playSound } from '../utils/sounds';
import { CodeEditor } from '../components/CodeEditor';
import { toast } from 'sonner';

interface Snippet {
  id: string;
  title: string;
  description: string;
  code: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  likes: number;
  stars: number;
  starredBy: string[];
  tags: string[];
  createdAt: any;
  commentCount?: number;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
}

const SnippetCard = React.memo(({ 
  snippet, 
  userProfile, 
  onStar, 
  onLike, 
  onSelect 
}: { 
  snippet: Snippet, 
  userProfile: any, 
  onStar: (id: string) => void, 
  onLike: (id: string) => void, 
  onSelect: (s: Snippet) => void 
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group glass rounded-[32px] p-8 border border-white/10 hover:border-brand-primary/30 transition-all duration-500 flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <a 
          href={`/u/${snippet.authorName}`}
          className="flex items-center gap-3 group/author"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover/author:border-brand-primary transition-colors">
            {snippet.authorPhoto ? (
              <img src={snippet.authorPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white/20" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold group-hover/author:text-brand-primary transition-colors">{snippet.authorName}</div>
            <div className="text-[10px] text-white/30 uppercase font-bold">Автор</div>
          </div>
        </a>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40">
          <Calendar className="w-3 h-3" />
          {snippet.createdAt?.toDate ? snippet.createdAt.toDate().toLocaleDateString() : 'Недавно'}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-3 group-hover:text-brand-primary transition-colors">{snippet.title}</h3>
      <p className="text-white/50 text-sm mb-6 line-clamp-2 leading-relaxed">{snippet.description}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {(snippet.tags || []).map(tag => (
          <span key={tag} className="px-2 py-1 rounded-lg bg-brand-primary/5 border border-brand-primary/10 text-[10px] font-bold text-brand-primary uppercase tracking-wider">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onStar(snippet.id)}
            className={`flex items-center gap-1.5 transition-colors ${
              (snippet.starredBy || []).includes(userProfile?.uid || '') 
                ? 'text-brand-primary' 
                : 'text-white/40 hover:text-brand-primary'
            }`}
          >
            <Star className={`w-5 h-5 ${(snippet.starredBy || []).includes(userProfile?.uid || '') ? 'fill-brand-primary' : ''}`} />
            <span className="text-xs font-bold">{snippet.stars || 0}</span>
          </button>
          <button 
            onClick={() => onLike(snippet.id)}
            className="flex items-center gap-1.5 text-white/40 hover:text-red-400 transition-colors"
          >
            <Heart className={`w-5 h-5 ${snippet.likes > 0 ? 'fill-red-400 text-red-400' : ''}`} />
            <span className="text-xs font-bold">{snippet.likes}</span>
          </button>
          <div className="flex items-center gap-1.5 text-white/40">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-bold">{(snippet as any).commentCount || 0}</span>
          </div>
        </div>
        <button
          onClick={() => onSelect(snippet)}
          className="p-2 rounded-xl bg-white/5 hover:bg-brand-primary hover:text-black transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
});

export const CommunityGallery = () => {
  const { userProfile } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [newSnippet, setNewSnippet] = useState({ title: '', description: '', code: '', tags: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [filter, setFilter] = useState<'latest' | 'trending'>('latest');

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'snippets'), orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const fetchedSnippets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          commentCount: data.commentCount || 0
        };
      }) as unknown as Snippet[];
      setSnippets(fetchedSnippets);
    } catch (error) {
      console.error('Error fetching snippets:', error);
      toast.error('Ошибка при загрузке галереи');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    
    const lessonKeywords = ['lesson_solution', 'challenge_answer']; 
    if (lessonKeywords.some(k => newSnippet.title.toLowerCase().includes(k))) {
      toast.error('Пожалуйста, не публикуйте решения уроков!');
      return;
    }

    if (!newSnippet.title.trim() || !newSnippet.code.trim()) {
      toast.error('Название и код обязательны!');
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'snippets'), {
        title: newSnippet.title.trim(),
        description: newSnippet.description.trim(),
        code: newSnippet.code,
        authorId: userProfile.uid,
        authorName: userProfile.username || 'Аноним',
        authorPhoto: userProfile.avatar || '',
        likes: 0,
        stars: 0,
        starredBy: [],
        commentCount: 0,
        tags: newSnippet.tags.split(',').map(t => t.trim()).filter(t => t),
        createdAt: serverTimestamp()
      });
      
      toast.success('Сниппет опубликован!');
      setIsCreateModalOpen(false);
      setNewSnippet({ title: '', description: '', code: '', tags: '' });
      fetchSnippets();
      playSound('success');
    } catch (error: any) {
      console.error('Error adding snippet:', error);
      const errorMessage = error?.code === 'permission-denied' 
        ? 'Нет доступа (проверьте правила)' 
        : (error?.message || 'Неизвестная ошибка');
      toast.error(`Ошибка при публикации: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = React.useCallback(async (snippetId: string) => {
    try {
      const snippetRef = doc(db, 'snippets', snippetId);
      await updateDoc(snippetRef, {
        likes: increment(1)
      });
      setSnippets(prev => prev.map(s => s.id === snippetId ? { ...s, likes: s.likes + 1 } : s));
      playSound('click');
    } catch (error) {
      console.error('Error liking snippet:', error);
    }
  }, []);

  const handleStar = React.useCallback(async (snippetId: string) => {
    if (!userProfile) {
      toast.error('Войдите, чтобы ставить звезды!');
      return;
    }

    const snippet = snippets.find(s => s.id === snippetId);
    if (!snippet) return;

    const isStarred = (snippet.starredBy || []).includes(userProfile.uid);
    const snippetRef = doc(db, 'snippets', snippetId);

    try {
      if (isStarred) {
        
        await updateDoc(snippetRef, {
          stars: increment(-1),
          starredBy: snippet.starredBy.filter(id => id !== userProfile.uid)
        });
        setSnippets(prev => prev.map(s => s.id === snippetId ? { 
          ...s, 
          stars: s.stars - 1, 
          starredBy: s.starredBy.filter(id => id !== userProfile.uid) 
        } : s));
        toast.success('Звезда убрана');
      } else {
        
        await updateDoc(snippetRef, {
          stars: increment(1),
          starredBy: [...(snippet.starredBy || []), userProfile.uid]
        });
        setSnippets(prev => prev.map(s => s.id === snippetId ? { 
          ...s, 
          stars: (s.stars || 0) + 1, 
          starredBy: [...(s.starredBy || []), userProfile.uid] 
        } : s));
        toast.success('Добавлено в избранное!');
        playSound('success');
      }
    } catch (error) {
      console.error('Error starring snippet:', error);
      toast.error('Ошибка при обновлении звезды');
    }
  }, [userProfile, snippets]);

  useEffect(() => {
    if (selectedSnippet) {
      fetchComments(selectedSnippet.id);
    } else {
      setComments([]);
      setNewComment('');
    }
  }, [selectedSnippet]);

  const fetchComments = async (snippetId: string) => {
    try {
      const q = query(collection(db, `snippets/${snippetId}/comments`), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedSnippet || !newComment.trim()) return;

    setIsPostingComment(true);
    try {
      await addDoc(collection(db, `snippets/${selectedSnippet.id}/comments`), {
        text: newComment.trim(),
        authorId: userProfile.uid,
        authorName: userProfile.username || 'Аноним',
        authorPhoto: userProfile.avatar || '',
        createdAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'snippets', selectedSnippet.id), {
        commentCount: increment(1)
      });
      setSnippets(prev => prev.map(s => s.id === selectedSnippet.id ? { ...s, commentCount: (s as any).commentCount + 1 } : s));
      
      setNewComment('');
      fetchComments(selectedSnippet.id);
      playSound('success');
    } catch (error: any) {
      console.error('Error posting comment:', error);
      const errorMessage = error?.code === 'permission-denied' 
        ? 'Нет доступа (напр. к обновлению счетчика)' 
        : (error?.message || 'Неизвестная ошибка');
      toast.error(`Ошибка при отправке комментария: ${errorMessage}`);
    } finally {
      setIsPostingComment(false);
    }
  };

  const filteredSnippets = React.useMemo(() => {
    return snippets
      .filter(s => 
        s.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.tags || []).some(t => t.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
      .sort((a, b) => {
        if (filter === 'trending') {
          return (b.stars || 0) - (a.stars || 0);
        }
        return 0; 
      });
  }, [snippets, debouncedSearch, filter]);

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
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Сообщество</span>
            </motion.div>
            <h1 className="text-6xl font-display font-black mb-6 tracking-tighter">
              Галерея <span className="text-brand-primary italic serif">Кода</span>
            </h1>
            <p className="text-white/40 text-xl font-medium">
              Делись своими творениями, учись у других и создавай будущее вместе с сообществом.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setFilter('latest')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'latest' ? 'bg-brand-primary text-black' : 'text-white/40 hover:text-white'}`}
              >
                Последние
              </button>
              <button
                onClick={() => setFilter('trending')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'trending' ? 'bg-brand-primary text-black' : 'text-white/40 hover:text-white'}`}
              >
                🔥 Тренды
              </button>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-primary/50 transition-all w-64"
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3.5 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-brand-primary/20"
            >
              <Plus className="w-5 h-5" /> Создать
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Загрузка шедевров...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  userProfile={userProfile}
                  onStar={handleStar}
                  onLike={handleLike}
                  onSelect={setSelectedSnippet}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl glass rounded-[40px] p-10 border border-white/10 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-3xl font-black mb-8">Опубликовать <span className="text-brand-primary italic serif">Код</span></h2>

              <form onSubmit={handleCreateSnippet} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-2">Название</label>
                      <input
                        required
                        type="text"
                        value={newSnippet.title}
                        onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                        placeholder="Напр: Алгоритм сортировки пузырьком"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-primary/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-2">Описание</label>
                      <textarea
                        required
                        rows={3}
                        value={newSnippet.description}
                        onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                        placeholder="Опишите, что делает ваш код..."
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-primary/50 transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-2">Теги (через запятую)</label>
                      <input
                        type="text"
                        value={newSnippet.tags}
                        onChange={(e) => setNewSnippet({ ...newSnippet, tags: e.target.value })}
                        placeholder="python, algorithm, math"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 ml-2">Код (Python)</label>
                    <div className="h-[300px] rounded-2xl overflow-hidden border border-white/10">
                      <CodeEditor
                        initialCode={newSnippet.code}
                        onChange={(code) => setNewSnippet({ ...newSnippet, code })}
                        hideControls
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-xl shadow-brand-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Опубликовать'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {selectedSnippet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-6xl glass rounded-[50px] p-12 border border-white/10 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => {
                  setSelectedSnippet(null);
                  setIsCollaborating(false);
                }}
                className="absolute top-10 right-10 text-white/40 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-black mb-4 tracking-tight">{selectedSnippet.title}</h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                            {selectedSnippet.authorPhoto ? (
                              <img src={selectedSnippet.authorPhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-white/20" />
                            )}
                          </div>
                          <span className="text-sm font-bold text-white/60">{selectedSnippet.authorName}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
                          {selectedSnippet.createdAt?.toDate ? selectedSnippet.createdAt.toDate().toLocaleDateString() : 'Недавно'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleLike(selectedSnippet.id)}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-all group"
                      >
                        <Heart className={`w-6 h-6 ${selectedSnippet.likes > 0 ? 'fill-red-400 text-red-400' : 'text-white/20 group-hover:text-red-400'}`} />
                      </button>
                      <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-primary/50 transition-all group">
                        <Share2 className="w-6 h-6 text-white/20 group-hover:text-brand-primary" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                    <CodeEditor
                      initialCode={selectedSnippet.code}
                      onSuccess={() => toast.success('Код успешно выполнен!')}
                    />
                  </div>

                  {}
                  <div className="glass rounded-[32px] p-8 border border-white/10 mt-8">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-brand-primary" /> Комментарии ({(selectedSnippet as any).commentCount || 0})
                    </h3>

                    <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-sm font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                          Пока нет комментариев. Напишите первым!
                        </div>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {comment.authorPhoto ? (
                                <img src={comment.authorPhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-white/20" />
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm text-white/80">{comment.authorName}</span>
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">
                                  {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Только что'}
                                </span>
                              </div>
                              <p className="text-white/60 text-sm leading-relaxed">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handlePostComment} className="flex gap-3 relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Написать крутой коммент..."
                        className="flex-grow px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-primary/50 transition-all text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isPostingComment || !newComment.trim()}
                        className="px-6 py-4 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[120px]"
                      >
                        {isPostingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Отправить'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass rounded-[32px] p-8 border border-white/10">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-brand-primary" /> Описание
                    </h3>
                    <p className="text-white/60 leading-relaxed font-medium mb-8">
                      {selectedSnippet.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSnippet.tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/40">
                           #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-[32px] p-8 border border-white/10">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <Users className="w-5 h-5 text-brand-primary" /> Совместная работа
                    </h3>
                    <p className="text-white/40 text-sm mb-6">
                      Пригласи друзей для совместного редактирования этого кода в реальном времени.
                    </p>
                    <button
                      onClick={() => setIsCollaborating(true)}
                      className="w-full py-4 bg-brand-primary text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/20"
                    >
                      <Users className="w-5 h-5" /> Создать сессию
                    </button>
                  </div>

                  {isCollaborating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 text-center"
                    >
                      <div className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2">Сессия активна</div>
                      <div className="text-[10px] text-white/40 mb-4">Отправь ссылку другу для входа</div>
                      <div className="flex gap-2">
                        <input 
                          readOnly 
                          value={`${window.location.origin}/sandbox/${selectedSnippet.id}`}
                          className="flex-grow bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white/60"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/sandbox/${selectedSnippet.id}`);
                            toast.success('Ссылка скопирована!');
                          }}
                          className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

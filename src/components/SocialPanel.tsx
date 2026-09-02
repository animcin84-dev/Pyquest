import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, User, Search, MessageCircle, ChevronLeft } from 'lucide-react';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { ChatService, Chat, Message } from '../services/ChatService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { playSound } from '../utils/sounds';

interface SocialPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialChatUserId?: string | null;
}

export const SocialPanel: React.FC<SocialPanelProps> = ({ isOpen, onClose, initialChatUserId }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPartner, setChatPartner] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (!currentUser || !isOpen) return;
    const unsubscribe = ChatService.subscribeToUserChats(currentUser.uid, (fetchedChats) => {
      setChats(fetchedChats);
    });
    return () => unsubscribe();
  }, [currentUser, isOpen]);

  
  useEffect(() => {
    if (initialChatUserId && currentUser && isOpen) {
      const startChat = async () => {
        const id = await ChatService.getOrCreateChat(currentUser.uid, initialChatUserId);
        setActiveChatId(id);
        setView('chat');
      };
      startChat();
    }
  }, [initialChatUserId, currentUser, isOpen]);

  
  useEffect(() => {
    if (!activeChatId || !isOpen) return;
    const unsubscribe = ChatService.subscribeToMessages(activeChatId, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });
    return () => unsubscribe();
  }, [activeChatId, isOpen]);

  
  useEffect(() => {
    const fetchPartner = async () => {
      if (!activeChatId || !currentUser) return;
      const chat = chats.find(c => c.id === activeChatId);
      if (!chat) return;
      
      const partnerId = chat.participants.find(id => id !== currentUser.uid);
      if (!partnerId) return;

      const docSnap = await getDoc(doc(db, 'users', partnerId));
      if (docSnap.exists()) {
        setChatPartner(docSnap.data() as UserProfile);
      }
    };
    fetchPartner();
  }, [activeChatId, chats, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChatId || !currentUser) return;
    const text = newMessage.trim();
    setNewMessage('');
    playSound('click');
    await ChatService.sendMessage(activeChatId, currentUser.uid, text);
    playSound('message');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#050505] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            {}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                {view === 'chat' && (
                  <button 
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all mr-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic tracking-tight">
                    {view === 'list' ? 'СООБЩЕНИЯ' : chatPartner?.username || 'ЧАТ'}
                  </h2>
                  <p className="text-[10px] text-white/20 font-mono tracking-widest uppercase">
                    {view === 'list' ? 'Ваши диалоги' : 'Приватный канал'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {view === 'list' ? (
                <div className="p-4 space-y-2">
                  {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <MessageSquare className="w-12 h-12 text-white/5" />
                      <p className="text-white/20 text-sm font-light">У вас пока нет активных диалогов.<br/>Вы можете начать чат в профиле любого игрока!</p>
                    </div>
                  ) : (
                    chats.map(chat => (
                      <ChatListItem 
                        key={chat.id} 
                        chat={chat} 
                        currentUid={currentUser?.uid || ''} 
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setView('chat');
                          playSound('click');
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full bg-[#030303]">
                  {}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm ${
                          msg.senderId === currentUser?.uid 
                            ? 'bg-brand-primary text-black font-bold rounded-br-none shadow-[0_4px_15px_rgba(139,92,246,0.3)]' 
                            : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {}
                  <div className="p-6 border-t border-white/10 bg-white/5">
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Напишите сообщение..."
                        className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] py-4 pl-6 pr-14 text-white placeholder:text-white/20 outline-none focus:border-brand-primary transition-all shadow-inner"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-brand-primary text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ChatListItem: React.FC<{ chat: Chat, currentUid: string, onClick: () => void }> = ({ chat, currentUid, onClick }) => {
  const [partner, setPartner] = useState<UserProfile | null>(null);

  useEffect(() => {
    const partnerId = chat.participants.find(id => id !== currentUid);
    if (partnerId) {
      getDoc(doc(db, 'users', partnerId)).then(s => s.exists() && setPartner(s.data() as UserProfile));
    }
  }, [chat, currentUid]);

  if (!partner) return null;

  return (
    <button 
      onClick={onClick}
      className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-primary/30 hover:bg-white/10 transition-all flex items-center gap-4 text-left group"
    >
      <div className="relative">
        <img 
          src={partner.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${partner.uid}`} 
          className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 p-1"
          alt={partner.username}
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-white group-hover:text-brand-primary transition-colors truncate">{partner.username}</span>
          <span className="text-[10px] text-white/20 font-mono">
            {chat.updatedAt?.toDate ? new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(chat.updatedAt.toDate()) : ''}
          </span>
        </div>
        <p className="text-xs text-white/40 truncate italic">
          {chat.lastMessage || 'Напишите первым...'}
        </p>
      </div>
    </button>
  );
};

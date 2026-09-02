import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { GuildService } from '../services/GuildService';
import { useAuth } from '../contexts/AuthContext';

export const GuildChat = ({ guildId }: { guildId: string }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = GuildService.subscribeToGuildChat(guildId, setMessages);
    return () => unsub();
  }, [guildId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await GuildService.sendGuildMessage(guildId, newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] glass rounded-3xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-brand-primary" />
        <h3 className="font-black uppercase tracking-widest text-sm">Чат Альянса</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isMe = msg.senderId === userProfile?.uid;
          const time = msg.timestamp?.toDate 
            ? new Date(msg.timestamp.toDate()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) 
            : '';

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{msg.senderName}</span>
                <span className="text-[8px] text-white/20">{time}</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] break-words text-sm ${isMe ? 'bg-brand-primary text-black font-medium rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20 flex items-center gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Сообщение гильдии..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors text-white placeholder:text-white/30"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-primary text-black disabled:opacity-50 hover:scale-105 transition-transform"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

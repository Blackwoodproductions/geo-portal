'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSocket, joinPortalRoom, leavePortalRoom } from '@/lib/socket';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; displayName: string | null; avatarUrl: string | null };
}

interface PortalChatProps {
  portalId: string;
}

export function PortalChat({ portalId }: PortalChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    fetch(`/api/portals/${portalId}/chat?limit=50`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(console.error);
  }, [portalId]);

  // Socket.io realtime messages
  useEffect(() => {
    joinPortalRoom(portalId);
    const socket = getSocket();

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:message', handleMessage);
      leavePortalRoom(portalId);
    };
  }, [portalId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    try {
      await fetch(`/api/portals/${portalId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput('');
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-medium text-sm">Portal Chat</h3>
      </div>

      {/* Messages */}
      <div className="max-h-48 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.user.id === user?.id ? 'justify-end' : ''}`}>
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                msg.user.id === user?.id
                  ? 'bg-purple-600/30 text-purple-100'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <p className="text-xs text-gray-500 mb-0.5">{msg.user.displayName || 'Anon'}</p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {user ? (
        <div className="p-3 border-t border-gray-800 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="p-3 border-t border-gray-800 text-sm text-gray-500 text-center">
          Login to chat
        </p>
      )}
    </div>
  );
}

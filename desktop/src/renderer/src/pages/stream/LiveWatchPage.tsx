import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import HlsPlayer from '../../components/stream/HlsPlayer';
import { Send, Users, Radio, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  ts: number;
}

interface StreamInfo {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  hlsUrl: string | null;
  viewerCount: number;
  teacher: { firstName: string; lastName: string };
}

const LiveWatchPage: React.FC = () => {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch stream info ─────────────────────────────────────
  useEffect(() => {
    if (!streamId) return;
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/streams/${streamId}`);
        setStream(res.data.data);
        setViewerCount(res.data.data.viewerCount ?? 0);
      } catch {
        setError('Stream not found');
      } finally { setLoading(false); }
    };
    fetch();
  }, [streamId]);

  // ── Socket.IO ─────────────────────────────────────────────
  useEffect(() => {
    if (!streamId || !user) return;

    const socket = io('http://localhost:5000', {
      auth: { token: useAuthStore.getState().token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.emit('joinRoom', { streamId });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('stream:viewerCount', (count: number) => {
      setViewerCount(count);
    });

    socket.on('stream:ended', () => {
      setStream(prev => prev ? { ...prev, status: 'ENDED' } : prev);
    });

    return () => {
      socket.emit('leaveRoom', { streamId });
      socket.disconnect();
    };
  }, [streamId, user]);

  // ── Auto-scroll chat ──────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current || !user) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      text: inputText.trim(),
      ts: Date.now(),
    };

    socketRef.current.emit('chat:send', { streamId, ...msg });
    setMessages(prev => [...prev, msg]);
    setInputText('');
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-teal-600 animate-spin" /></div>;

  if (error || !stream) return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="font-semibold text-slate-700">{error || 'Stream not found'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 btn-primary px-6 py-2 text-sm">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-slate-900 text-xl truncate">{stream.title}</h1>
            {stream.status === 'LIVE' && (
              <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE
              </span>
            )}
            {stream.status === 'ENDED' && <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Ended</span>}
            {stream.status === 'SCHEDULED' && <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">Scheduled</span>}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">by {stream.teacher.firstName} {stream.teacher.lastName}</p>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
          <Users className="w-4 h-4" /> {viewerCount} watching
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* Video */}
        <div>
          {stream.status === 'LIVE' && stream.hlsUrl ? (
            <HlsPlayer src={stream.hlsUrl} isLive />
          ) : stream.status === 'SCHEDULED' ? (
            <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-4">
              <Radio className="w-12 h-12 text-slate-600" />
              <p className="text-white font-semibold">Stream hasn't started yet</p>
              <p className="text-slate-400 text-sm">The teacher will go live soon</p>
            </div>
          ) : (
            <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3">
              <p className="text-slate-400 font-medium">This stream has ended</p>
            </div>
          )}
        </div>

        {/* Live Chat */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[520px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-semibold text-slate-800 text-sm">Live Chat</span>
            <span className="ml-auto text-xs text-slate-400">{messages.length} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs mt-1">Be the first to say hi! 👋</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                  {m.name[0]}
                </div>
                <div className={`max-w-[75%] ${m.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <span className="text-xs text-slate-400 mb-0.5 px-1">{m.name}</span>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${m.userId === user?.id ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100">
            {user ? (
              <div className="flex gap-2">
                <input
                  className="input-field flex-1 py-2 text-sm"
                  placeholder="Say something…"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  disabled={stream.status !== 'LIVE'}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || stream.status !== 'LIVE'}
                  className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-center text-slate-400">Log in to chat</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWatchPage;

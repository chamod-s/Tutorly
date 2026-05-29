import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Radio, Plus, X, Copy, Check, Loader2, Calendar, Users, Clock, Settings, Send } from 'lucide-react';

interface Stream {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  viewerCount: number;
  scheduledAt: string | null;
  rtmpKey: string;
  hlsUrl: string | null;
  recordingUrl: string | null;
  createdAt: string;
  description?: string | null;
  isPublic?: boolean;
  isPaused?: boolean;
  chatEnabled?: boolean;
  slowMode?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  ts: number;
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  LIVE:      'bg-red-50 text-red-700',
  ENDED:     'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-slate-100 text-slate-400',
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="ml-2 text-slate-400 hover:text-teal-600 transition-colors">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

interface StreamManageModalProps {
  stream: Stream;
  onClose: () => void;
  onRefresh: () => void;
}

const StreamManageModal: React.FC<StreamManageModalProps> = ({ stream, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [title, setTitle] = useState(stream.title);
  const [description, setDescription] = useState(stream.description || '');
  const [isPublic, setIsPublic] = useState(stream.isPublic !== false);
  const [isPaused, setIsPaused] = useState(stream.isPaused ?? false);
  const [chatEnabled, setChatEnabled] = useState(stream.chatEnabled !== false);
  const [slowMode, setSlowMode] = useState(stream.slowMode ?? false);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [obsData, setObsData] = useState<{ rtmpUrl: string; streamKey: string } | null>(null);
  const [fetchingObs, setFetchingObs] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>(stream.status);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io('http://127.0.0.1:5000', {
      auth: { token: useAuthStore.getState().token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('joinRoom', { streamId: stream.id });
    socket.emit('stream:join', stream.id);

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('stream:viewer_count', (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    return () => {
      socket.emit('stream:leave', stream.id);
      socket.emit('leaveRoom', { streamId: stream.id });
      socket.disconnect();
    };
  }, [stream.id]);

  useEffect(() => {
    if (streamStatus === 'LIVE') {
      fetchObsCredentials();
    }
  }, [streamStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchObsCredentials = async () => {
    setFetchingObs(true);
    try {
      const res = await apiClient.get(`/streams/${stream.id}/credentials`);
      setObsData({
        rtmpUrl: res.data.data.obsSettings.server,
        streamKey: res.data.data.streamKey,
      });
    } catch (err) {
      console.error('Failed to fetch OBS credentials:', err);
    } finally {
      setFetchingObs(false);
    }
  };

  const handleStartStream = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.patch(`/streams/${stream.id}/live`);
      setStreamStatus('LIVE');
      socketRef.current?.emit('stream:status_update', {
        streamId: stream.id,
        status: 'LIVE',
      });
      setSuccess('Live session started! Connect OBS using the settings below.');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start live stream.');
    } finally {
      setSaving(false);
    }
  };

  const handleEndStream = async () => {
    try {
      setSaving(true);
      setError(null);
      await apiClient.patch(`/streams/${stream.id}/end`);
      setStreamStatus('ENDED');
      socketRef.current?.emit('stream:status_update', {
        streamId: stream.id,
        status: 'ENDED',
      });
      setSuccess('Live session ended.');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to end live stream.');
    } finally {
      setSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    const nextPaused = !isPaused;
    try {
      setError(null);
      await apiClient.patch(`/streams/${stream.id}/pause`, { isPaused: nextPaused });
      setIsPaused(nextPaused);
      socketRef.current?.emit('stream:pause_toggle', {
        streamId: stream.id,
        isPaused: nextPaused,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle pause.');
    }
  };

  const handleChatToggle = async () => {
    const nextChat = !chatEnabled;
    try {
      setError(null);
      await apiClient.patch(`/streams/${stream.id}`, { chatEnabled: nextChat });
      setChatEnabled(nextChat);
      socketRef.current?.emit('chat:toggle_active', {
        streamId: stream.id,
        isActive: nextChat,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle chat.');
    }
  };

  const handleSlowModeToggle = async () => {
    const nextSlow = !slowMode;
    try {
      setError(null);
      await apiClient.patch(`/streams/${stream.id}`, { slowMode: nextSlow });
      setSlowMode(nextSlow);
      socketRef.current?.emit('chat:slow_mode', {
        streamId: stream.id,
        isSlowMode: nextSlow,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle slow mode.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await apiClient.patch(`/streams/${stream.id}`, {
        title,
        description,
        isPublic,
      });
      setSuccess('Stream settings saved successfully!');
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save stream settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socketRef.current || !user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      name: `${user.firstName} ${user.lastName} (Teacher)`,
      text: chatInput.trim(),
      ts: Date.now(),
    };
    socketRef.current.emit('chat:send', { streamId: stream.id, ...msg });
    setMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <span className="text-xs font-semibold text-teal-600 tracking-wider uppercase">Live Streams Manager</span>
            <div className="flex items-center gap-3 mt-0.5">
              <h3 className="text-lg font-bold text-slate-900 truncate max-w-md">{stream.title}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[streamStatus]}`}>
                {streamStatus}
              </span>
              {streamStatus === 'LIVE' && (
                <span className="text-xs text-slate-500 font-medium">
                  Viewer Count: {viewerCount}
                </span>
              )}
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Column: Stream Settings & Controls (Scrollable) */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-slate-100 text-left">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-green-50 border border-green-100 rounded-xl text-xs font-medium text-green-700">
                {success}
              </div>
            )}

            {/* Live Controls */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Live Status & Controls</h4>
              <div className="flex flex-wrap gap-3 items-center">
                {streamStatus === 'SCHEDULED' && (
                  <button
                    type="button"
                    onClick={handleStartStream}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <Radio className="w-4 h-4" /> Start Live Class
                  </button>
                )}

                {streamStatus === 'LIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={handlePauseToggle}
                      className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                        isPaused 
                          ? 'bg-amber-650 border-amber-600 hover:bg-amber-700 text-white bg-amber-600' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Radio className={`w-4 h-4 ${isPaused ? '' : 'text-red-500 animate-pulse'}`} />
                      {isPaused ? 'Resume Live' : 'Pause Live'}
                    </button>

                    <button
                      type="button"
                      onClick={handleEndStream}
                      disabled={saving}
                      className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Stop / End Stream
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/live/${stream.id}`)}
                      className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      View watch page
                    </button>
                  </>
                )}

                {streamStatus === 'ENDED' && (
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-xl">
                    This live class has ended.
                  </span>
                )}
              </div>
            </div>

            {/* OBS details */}
            {streamStatus === 'LIVE' && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">OBS Ingestion Credentials</h4>
                  {fetchingObs && <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
                </div>
                
                {obsData ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-xs text-slate-500 mb-1">Server (RTMP URL)</span>
                      <div className="flex items-center bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                        <span className="font-mono text-green-400 text-xs truncate flex-1">{obsData.rtmpUrl}</span>
                        <CopyButton text={obsData.rtmpUrl} />
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 mb-1">Stream Key</span>
                      <div className="flex items-center bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                        <span className="font-mono text-green-400 text-xs truncate flex-1">{obsData.streamKey}</span>
                        <CopyButton text={obsData.streamKey} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Paste these details into OBS Studio under Settings &rarr; Stream &rarr; Custom.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Loading OBS Credentials...</p>
                )}
              </div>
            )}

            {/* Chat Toggles */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Chat Settings</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">Enable Live Chat</span>
                    <span className="block text-xs text-slate-400">Allow students to chat during live stream</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={chatEnabled} 
                      onChange={handleChatToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">Slow Mode</span>
                    <span className="block text-xs text-slate-400">10s delay between student messages</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={slowMode} 
                      onChange={handleSlowModeToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Stream Details & Settings</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Stream Title *</label>
                <input 
                  type="text" 
                  required 
                  disabled={saving}
                  className="input-field" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  rows={3} 
                  disabled={saving}
                  className="input-field resize-none py-2" 
                  placeholder="Describe what will be covered in this stream..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Visibility</label>
                <select 
                  disabled={saving}
                  className="input-field"
                  value={isPublic ? 'true' : 'false'}
                  onChange={e => setIsPublic(e.target.value === 'true')}
                >
                  <option value="true">Public (Visible to All)</option>
                  <option value="false">Private (Enrolled Students Only)</option>
                </select>
              </div>

              <div className="flex justify-end pt-3">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary px-6 py-2 text-sm font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Chat Pane */}
          <div className="w-[380px] flex flex-col bg-slate-50 shrink-0 border-l border-slate-100">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-slate-800 text-sm">Live Class Chat</span>
              <span className="ml-auto text-xs text-slate-400">{messages.length} messages</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs mt-1">Chat is active. Send a message to start!</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                    {m.name[0]}
                  </div>
                  <div className={`max-w-[75%] ${m.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                    <span className="text-xs text-slate-400 mb-0.5 px-1">{m.name}</span>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${m.userId === user?.id ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <input
                  className="input-field flex-1 py-2 text-sm"
                  placeholder="Broadcast a message…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  disabled={streamStatus !== 'LIVE'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || streamStatus !== 'LIVE'}
                  className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {streamStatus !== 'LIVE' && (
                <p className="text-[10px] text-center text-slate-400 mt-1.5">
                  Chat is only available when stream is Live
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const TeacherStreamPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formType, setFormType] = useState<'instant' | 'scheduled'>('instant');
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', isPublic: true, courseId: '' });
  const [managingStream, setManagingStream] = useState<Stream | null>(null);

  const MOCK_STREAMS: Stream[] = [
    { id: 'str1', title: 'Calculus Live — Limits & Derivatives', status: 'SCHEDULED', viewerCount: 0, scheduledAt: '2026-05-10T10:00:00Z', rtmpKey: 'demo-key-123', hlsUrl: null, recordingUrl: null, createdAt: '2026-05-09T12:00:00Z' },
    { id: 'str2', title: 'Python OOP Deep Dive', status: 'ENDED', viewerCount: 0, scheduledAt: '2026-05-08T15:00:00Z', rtmpKey: 'demo-key-456', hlsUrl: null, recordingUrl: 'http://localhost:8000/recordings/demo-key-456.mp4', createdAt: '2026-05-08T10:00:00Z' },
  ];

  const fetchStreams = async () => {
    try {
      const res = await apiClient.get('/streams/my');
      setStreams(res.data.data?.length ? res.data.data : MOCK_STREAMS);
    } catch { setStreams(MOCK_STREAMS); }
    finally { setLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/courses/my/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    fetchStreams();
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (courses.length > 0 && !form.courseId) {
      setForm(f => ({ ...f, courseId: courses[0].id }));
    }
  }, [courses]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.courseId) return;
    if (formType === 'scheduled' && !form.scheduledAt) return;
    setCreating(true);
    try {
      const res = await apiClient.post('/streams', {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        courseId: form.courseId,
        scheduledAt: formType === 'scheduled' ? new Date(form.scheduledAt) : undefined,
        isPublic: form.isPublic,
      });
      let createdStream = res.data.data;

      if (formType === 'instant') {
        const liveRes = await apiClient.patch(`/streams/${createdStream.id}/live`);
        createdStream = {
          ...createdStream,
          status: 'LIVE',
          hlsUrl: liveRes.data.data.hlsUrl
        };
      }

      await fetchStreams();
      setShowCreate(false);
      setForm({ title: '', description: '', scheduledAt: '', isPublic: true, courseId: courses[0]?.id || '' });

      if (formType === 'instant') {
        setManagingStream(createdStream);
      }
    } catch (err) {
      console.error('Failed to create/start live stream:', err);
    } finally {
      setCreating(false);
    }
  };

  const liveClasses = streams.filter(s => s.status === 'LIVE');
  const scheduledClasses = streams.filter(s => s.status === 'SCHEDULED');
  const pastClasses = streams.filter(s => s.status === 'ENDED' || s.status === 'CANCELLED');

  const renderStreamCard = (s: Stream) => (
    <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${s.status === 'LIVE' ? 'border-red-200 shadow-red-50/50' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900">{s.title}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[s.status]}`}>
              {s.status === 'LIVE' && <Radio className="w-3 h-3 inline mr-1 animate-pulse" />}
              {s.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {s.scheduledAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.scheduledAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
            {s.status === 'LIVE' && <span className="flex items-center gap-1 text-red-600 font-medium"><Users className="w-3 h-3" />{s.viewerCount} watching</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {(s.status === 'SCHEDULED' || s.status === 'LIVE') && (
            <button 
              onClick={() => setManagingStream(s)} 
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Manage
            </button>
          )}
          {s.status === 'LIVE' && (
            <button onClick={() => navigate(`/live/${s.id}`)} className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Watch</button>
          )}
          {s.status === 'ENDED' && s.recordingUrl && (
            <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 transition-colors">
              <Clock className="w-3.5 h-3.5" /> Recording
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">
            {liveClasses.length > 0 ? '🔴 Currently live!' : 'Manage your live sessions'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setFormType('instant'); setShowCreate(true); }} 
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200"
          >
            <Radio className="w-4 h-4 animate-pulse" /> Go Live Now
          </button>
          <button 
            onClick={() => { setFormType('scheduled'); setShowCreate(true); }} 
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Schedule Session
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-teal-100 shadow-md p-6 space-y-5 text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-lg">New Live Session</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Form Type Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              type="button"
              onClick={() => setFormType('instant')} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${formType === 'instant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Radio className={`w-3.5 h-3.5 ${formType === 'instant' ? 'text-rose-500 animate-pulse' : ''}`} /> Go Live Now
            </button>
            <button 
              type="button"
              onClick={() => setFormType('scheduled')} 
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${formType === 'scheduled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Schedule for Later
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Title *</label>
              <input className="input-field" placeholder="e.g. Calculus — Limits & Derivatives" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Associated Class *</label>
              <select 
                className="input-field" 
                value={form.courseId} 
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              >
                {courses.length === 0 ? (
                  <option value="">No classes available</option>
                ) : (
                  courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                )}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea rows={2} className="input-field resize-none" placeholder="What will you cover?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {formType === 'scheduled' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Scheduled Date & Time *</label>
                <input type="datetime-local" className="input-field" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
            ) : (
              <div className="sm:col-span-2 bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm">
                <Radio className="w-5 h-5 shrink-0 text-rose-500 animate-pulse mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900">Instant Live Session</p>
                  <p className="text-slate-600 mt-1">
                    This stream will go live immediately. After clicking "Go Live Now", you will be shown the OBS credentials and live chat layout to start broadcasting.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            {formType === 'instant' ? (
              <button 
                onClick={handleCreate} 
                disabled={creating || !form.title.trim() || !form.courseId} 
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4 animate-pulse" />}
                Go Live Now
              </button>
            ) : (
              <button 
                onClick={handleCreate} 
                disabled={creating || !form.title.trim() || !form.courseId || !form.scheduledAt} 
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Schedule Session
              </button>
            )}
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Stream Cards by Group */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white p-12">
          <Radio className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="font-semibold text-slate-700 text-lg">No Live Sessions Yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">Start an instant live stream now or schedule one for later.</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => { setFormType('instant'); setShowCreate(true); }} 
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200"
            >
              <Radio className="w-4 h-4 animate-pulse" /> Go Live Now
            </button>
            <button 
              onClick={() => { setFormType('scheduled'); setShowCreate(true); }} 
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Schedule Session
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-left">
          {/* Ongoing Live Classes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" /> Ongoing Live Classes ({liveClasses.length})
            </h3>
            {liveClasses.length > 0 ? (
              <div className="grid gap-4">
                {liveClasses.map(s => renderStreamCard(s))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
                <p className="text-sm font-medium text-slate-500">No classes are currently live</p>
                <p className="text-xs text-slate-400 mt-1">Start an instant session or launch a scheduled stream to go live.</p>
              </div>
            )}
          </div>

          {/* Scheduled Live Classes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Scheduled Live Classes ({scheduledClasses.length})
            </h3>
            {scheduledClasses.length > 0 ? (
              <div className="grid gap-4">
                {scheduledClasses.map(s => renderStreamCard(s))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
                <p className="text-sm font-medium text-slate-500">No upcoming live classes scheduled</p>
                <p className="text-xs text-slate-400 mt-1">Plan ahead and schedule classes for your enrolled students.</p>
              </div>
            )}
          </div>

          {/* Past Live Classes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Past Live Classes ({pastClasses.length})
            </h3>
            {pastClasses.length > 0 ? (
              <div className="grid gap-4">
                {pastClasses.map(s => renderStreamCard(s))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
                <p className="text-sm font-medium text-slate-500">No past live classes yet</p>
                <p className="text-xs text-slate-400 mt-1">Once you complete a stream, its details and recordings will show up here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {managingStream && (
        <StreamManageModal 
          stream={managingStream} 
          onClose={() => setManagingStream(null)} 
          onRefresh={fetchStreams} 
        />
      )}
    </div>
  );
};

export default TeacherStreamPage;

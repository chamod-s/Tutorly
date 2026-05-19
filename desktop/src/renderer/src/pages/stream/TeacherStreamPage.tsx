import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Radio, Plus, X, Copy, Check, Loader2, Calendar, Users, Clock } from 'lucide-react';

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
}

interface Credentials { rtmpUrl: string; streamKey: string; obsSettings: { server: string; streamKey: string } }

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

const TeacherStreamPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '', isPublic: true });
  const [credentials, setCredentials] = useState<{ streamId: string; data: Credentials } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const MOCK_STREAMS: Stream[] = [
    { id: 'str1', title: 'Calculus Live — Limits & Derivatives', status: 'SCHEDULED', viewerCount: 0, scheduledAt: '2026-05-10T10:00:00Z', rtmpKey: 'demo-key-123', hlsUrl: null, recordingUrl: null, createdAt: '2026-05-09T12:00:00Z' },
    { id: 'str2', title: 'Python OOP Deep Dive', status: 'ENDED', viewerCount: 0, scheduledAt: '2026-05-08T15:00:00Z', rtmpKey: 'demo-key-456', hlsUrl: null, recordingUrl: 'http://localhost:8000/recordings/demo-key-456.mp4', createdAt: '2026-05-08T10:00:00Z' },
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/streams/my');
        setStreams(res.data.data?.length ? res.data.data : MOCK_STREAMS);
      } catch { setStreams(MOCK_STREAMS); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const res = await apiClient.post('/streams', { ...form, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : undefined });
      setStreams(prev => [res.data.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', scheduledAt: '', isPublic: true });
    } catch { /* show error */ }
    finally { setCreating(false); }
  };

  const handleGoLive = async (streamId: string) => {
    setActionLoading(streamId);
    try {
      await apiClient.patch(`/streams/${streamId}/live`);
      setStreams(prev => prev.map(s => s.id === streamId ? { ...s, status: 'LIVE' } : s));
      // Fetch credentials
      const cRes = await apiClient.get(`/streams/${streamId}/credentials`);
      setCredentials({ streamId, data: cRes.data.data });
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const handleEndStream = async (streamId: string) => {
    setActionLoading(streamId);
    try {
      await apiClient.patch(`/streams/${streamId}/end`);
      setStreams(prev => prev.map(s => s.id === streamId ? { ...s, status: 'ENDED' } : s));
      if (credentials?.streamId === streamId) setCredentials(null);
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {/* OBS Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Radio className="w-5 h-5 text-red-600 animate-pulse" /> Stream is LIVE!</h3>
              <button onClick={() => setCredentials(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 space-y-3 text-sm mb-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">OBS Studio Settings</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Server</span>
                  <div className="flex items-center">
                    <span className="font-mono text-green-400 text-xs">{credentials.data.obsSettings.server}</span>
                    <CopyButton text={credentials.data.obsSettings.server} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stream Key</span>
                  <div className="flex items-center">
                    <span className="font-mono text-green-400 text-xs">{credentials.data.streamKey}</span>
                    <CopyButton text={credentials.data.streamKey} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 mb-5">
              Open OBS → Settings → Stream → Select "Custom" → Paste the server and stream key above.
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate(`/live/${credentials.streamId}`)} className="flex-1 btn-primary py-2.5 text-sm">Watch Stream</button>
              <button onClick={() => handleEndStream(credentials.streamId)} className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium">End Stream</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">{streams.filter(s => s.status === 'LIVE').length > 0 ? '🔴 Currently live!' : 'Manage your live sessions'}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">New Live Session</h3>
            <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Title *</label>
            <input className="input-field" placeholder="e.g. Calculus — Limits & Derivatives" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={2} className="input-field resize-none" placeholder="What will you cover?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Scheduled Date & Time</label>
            <input type="datetime-local" className="input-field" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={handleCreate} disabled={creating || !form.title.trim()} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Schedule
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Stream Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Radio className="w-12 h-12 mx-auto mb-4" />
          <p className="font-medium">No live sessions yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 btn-primary px-6 py-2 text-sm">Schedule your first session</button>
        </div>
      ) : (
        <div className="space-y-4">
          {streams.map(s => {
            const isActing = actionLoading === s.id;
            return (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${s.status === 'LIVE' ? 'border-red-200 shadow-red-100' : 'border-slate-100'}`}>
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
                    {s.status === 'SCHEDULED' && (
                      <button onClick={() => handleGoLive(s.id)} disabled={isActing} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                        Go Live
                      </button>
                    )}
                    {s.status === 'LIVE' && (
                      <>
                        <button onClick={() => navigate(`/live/${s.id}`)} className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">Watch</button>
                        <button onClick={() => handleEndStream(s.id)} disabled={isActing} className="flex items-center gap-1.5 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">
                          {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'End'}
                        </button>
                      </>
                    )}
                    {s.status === 'ENDED' && s.recordingUrl && (
                      <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50">
                        <Clock className="w-3 h-3" /> Recording
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherStreamPage;

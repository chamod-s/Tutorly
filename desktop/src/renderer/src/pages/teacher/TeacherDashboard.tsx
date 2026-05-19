import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, BookOpen, Radio, Video, DollarSign, Users, Plus, X, Upload, Play, TrendingUp, Star, ChevronRight, Check } from 'lucide-react';

type Tab = 'overview' | 'classes' | 'live' | 'videos' | 'earnings' | 'students';

const CLASSES = [
  { id: '1', title: 'A/L Mathematics Complete Course', students: 312, lessons: 48, published: true, rating: 4.9, revenue: 1404000 },
  { id: '2', title: 'Python Programming Zero to Hero', students: 187, lessons: 36, published: true, rating: 4.7, revenue: 559130 },
  { id: '3', title: 'Physics for O/L Students', students: 94, lessons: 28, published: false, rating: 0, revenue: 0 },
];

const STUDENTS = [
  { id: '1', name: 'Kasun Silva', email: 'kasun@email.com', course: 'A/L Mathematics', progress: 72, joined: '2026-04-01' },
  { id: '2', name: 'Dilini Perera', email: 'dilini@email.com', course: 'Python Programming', progress: 45, joined: '2026-04-15' },
  { id: '3', name: 'Nimal Fernando', email: 'nimal@email.com', course: 'A/L Mathematics', progress: 91, joined: '2026-03-20' },
  { id: '4', name: 'Sachini Madushani', email: 'sachini@email.com', course: 'Python Programming', progress: 28, joined: '2026-05-01' },
];

const EARNINGS = [
  { month: 'Jan', amount: 85000 }, { month: 'Feb', amount: 120000 },
  { month: 'Mar', amount: 98000 }, { month: 'Apr', amount: 145000 },
  { month: 'May', amount: 167000 },
];

const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>
);

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${value}%` }} />
  </div>
);

// ── Overview ──────────────────────────────────────────────────
const Overview: React.FC<{ name: string; onTab: (t: Tab) => void }> = ({ name, onTab }) => (
  <div className="space-y-8">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white">
      <div className="relative z-10">
        <p className="text-slate-400 text-sm mb-1">Welcome back,</p>
        <h2 className="text-3xl font-bold mb-3">{name} 👋</h2>
        <div className="flex gap-3">
          <button onClick={() => onTab('live')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Radio className="w-4 h-4" /> Go Live Now
          </button>
          <button onClick={() => onTab('classes')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Class
          </button>
        </div>
      </div>
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total Students', value: '593', icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
        { label: 'Revenue (May)', value: 'Rs. 167k', icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
        { label: 'Avg Rating', value: '4.8 ★', icon: <Star className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
        { label: 'Active Courses', value: '2', icon: <BookOpen className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
          <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-900">My Courses</h3>
          <button onClick={() => onTab('classes')} className="text-sm text-teal-600 font-medium flex items-center gap-1">All courses <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {CLASSES.filter(c => c.published).map(c => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                <p className="text-xs text-slate-500">{c.students} students · ★ {c.rating}</p>
              </div>
              <span className="text-sm font-bold text-teal-700 shrink-0">Rs. {(c.revenue / 1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-900">Revenue Trend</h3>
          <Badge color="bg-green-50 text-green-600"><TrendingUp className="w-3 h-3 inline mr-1" />+15%</Badge>
        </div>
        <div className="flex items-end gap-3 h-32">
          {EARNINGS.map(e => {
            const max = Math.max(...EARNINGS.map(x => x.amount));
            const h = Math.round((e.amount / max) * 100);
            return (
              <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-500">{(e.amount/1000).toFixed(0)}k</span>
                <div className="w-full bg-teal-500 rounded-t-md transition-all" style={{ height: `${h}%` }} />
                <span className="text-xs text-slate-400">{e.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

// ── Classes Tab ───────────────────────────────────────────────
const ClassesTab: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Manage Classes</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">New Class</h3>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Course Title</label><input className="input-field" placeholder="e.g. A/L Chemistry 2025" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label><input className="input-field" placeholder="e.g. Science" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Price (LKR)</label><input type="number" className="input-field" placeholder="4500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select className="input-field"><option>SUBSCRIPTION</option><option>ONE_TIME</option></select>
            </div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label><textarea rows={3} className="input-field resize-none" placeholder="Describe your course…" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary px-6 py-2 text-sm">Create Course</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {CLASSES.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-slate-900 truncate">{c.title}</p>
                <Badge color={c.published ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>{c.published ? 'Published' : 'Draft'}</Badge>
              </div>
              <p className="text-sm text-slate-500">{c.students} students · {c.lessons} lessons {c.rating > 0 && `· ★ ${c.rating}`}</p>
              {c.revenue > 0 && <p className="text-sm font-semibold text-teal-700 mt-1">Rs. {c.revenue.toLocaleString()} earned</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Edit</button>
              <button className="text-sm px-3 py-1.5 border border-teal-200 rounded-lg hover:bg-teal-50 text-teal-700">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Live Tab ──────────────────────────────────────────────────
const LiveTab: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900">Live Sessions</h2>

      <div className={`rounded-2xl border-2 p-6 text-center transition-all ${isLive ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 ${isLive ? 'bg-red-100 animate-pulse' : 'bg-slate-100'}`}>
          <Radio className={`w-10 h-10 ${isLive ? 'text-red-600' : 'text-slate-500'}`} />
        </div>
        {isLive ? (
          <>
            <p className="text-xl font-bold text-red-700 mb-1">🔴 You are LIVE</p>
            <p className="text-sm text-slate-500 mb-6">42 students watching</p>
            <button onClick={() => setIsLive(false)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
              End Stream
            </button>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-slate-900 mb-1">Start a Live Class</p>
            <p className="text-sm text-slate-500 mb-6">Your students will be notified immediately</p>
            <button onClick={() => setIsLive(true)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors">
              <Radio className="w-5 h-5" /> Go Live Now
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Schedule a Session</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Session Title</label><input className="input-field" placeholder="e.g. Calculus — Limits" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
            <select className="input-field">{CLASSES.map(c => <option key={c.id}>{c.title}</option>)}</select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label><input type="date" className="input-field" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label><input type="time" className="input-field" /></div>
        </div>
        <button onClick={() => setScheduled(true)} className="btn-primary px-6 py-2 text-sm">
          Schedule Session
        </button>
        {scheduled && <p className="text-sm text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> Session scheduled! Students will be notified.</p>}
      </div>
    </div>
  );
};

// ── Videos Tab ────────────────────────────────────────────────
const VideosTab: React.FC = () => {
  const [dragging, setDragging] = useState(false);
  const VIDS = [
    { id: '1', title: 'Introduction to Limits', course: 'A/L Mathematics', duration: '45m', views: 312, status: 'PUBLISHED' },
    { id: '2', title: 'Python Variables & Types', course: 'Python Programming', duration: '32m', views: 187, status: 'PUBLISHED' },
    { id: '3', title: 'Advanced Integration', course: 'A/L Mathematics', duration: '1h 8m', views: 0, status: 'PROCESSING' },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Video Library</h2>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragging ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-300 hover:bg-slate-50'}`}
      >
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Drop video files here or click to upload</p>
        <p className="text-sm text-slate-400 mt-1">MP4, MOV — up to 2GB</p>
        <button className="mt-4 btn-primary px-6 py-2 text-sm">Choose Files</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">Uploaded Videos</div>
        <div className="divide-y divide-slate-50">
          {VIDS.map(v => (
            <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{v.title}</p>
                <p className="text-xs text-slate-500">{v.course} · {v.duration}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge color={v.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>{v.status}</Badge>
                {v.views > 0 && <p className="text-xs text-slate-400 mt-1">{v.views} views</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Earnings Tab ──────────────────────────────────────────────
const EarningsTab: React.FC = () => {
  const total = EARNINGS.reduce((s, e) => s + e.amount, 0);
  const max = Math.max(...EARNINGS.map(e => e.amount));
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Earnings Analytics</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Earned', value: `Rs. ${(total / 1000).toFixed(0)}k` },
          { label: 'This Month', value: 'Rs. 167k' },
          { label: 'Pending Payout', value: 'Rs. 45k' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-6">Monthly Revenue</h3>
        <div className="flex items-end gap-4 h-40">
          {EARNINGS.map(e => (
            <div key={e.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-teal-700">Rs. {(e.amount / 1000).toFixed(0)}k</span>
              <div className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg" style={{ height: `${Math.round((e.amount / max) * 140)}px` }} />
              <span className="text-xs text-slate-400 font-medium">{e.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Revenue by Course</h3>
        <div className="space-y-4">
          {CLASSES.filter(c => c.revenue > 0).map(c => (
            <div key={c.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700 truncate">{c.title}</span>
                <span className="font-bold text-teal-700 shrink-0 ml-4">Rs. {(c.revenue / 1000).toFixed(0)}k</span>
              </div>
              <ProgressBar value={Math.round((c.revenue / 1963130) * 100)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Students Tab ──────────────────────────────────────────────
const StudentsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
      <Badge color="bg-slate-100 text-slate-600">{STUDENTS.length} students</Badge>
    </div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Student', 'Course', 'Progress', 'Joined', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {STUDENTS.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">{s.name[0]}</div>
                    <div><p className="font-semibold text-slate-900">{s.name}</p><p className="text-xs text-slate-400">{s.email}</p></div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600 max-w-xs truncate">{s.course}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20"><ProgressBar value={s.progress} /></div>
                    <span className="text-xs font-medium text-teal-700">{s.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-500">{new Date(s.joined).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                <td className="px-5 py-4"><button className="text-xs text-teal-600 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-50">Message</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────
const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',   icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'classes',  label: 'Classes',    icon: <BookOpen className="w-4 h-4" /> },
  { id: 'live',     label: 'Go Live',    icon: <Radio className="w-4 h-4" /> },
  { id: 'videos',   label: 'Videos',     icon: <Video className="w-4 h-4" /> },
  { id: 'earnings', label: 'Earnings',   icon: <DollarSign className="w-4 h-4" /> },
  { id: 'students', label: 'Students',   icon: <Users className="w-4 h-4" /> },
];

const TeacherDashboard: React.FC = () => {
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState<Tab>('overview');
  const name = user ? `${user.firstName} ${user.lastName}` : 'Teacher';

  return (
    <div className="flex h-full gap-0">
      <aside className="w-52 shrink-0 pr-6">
        <nav className="space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === n.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              {n.icon}<span>{n.label}</span>
              {n.id === 'live' && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          ))}
        </nav>
        <div className="mt-8 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white">
          <p className="text-xs text-slate-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold">593</p>
          <p className="text-xs text-green-400 mt-1">↑ 12 this week</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {tab === 'overview' && <Overview name={name} onTab={setTab} />}
        {tab === 'classes'  && <ClassesTab />}
        {tab === 'live'     && <LiveTab />}
        {tab === 'videos'   && <VideosTab />}
        {tab === 'earnings' && <EarningsTab />}
        {tab === 'students' && <StudentsTab />}
      </div>
    </div>
  );
};

export default TeacherDashboard;

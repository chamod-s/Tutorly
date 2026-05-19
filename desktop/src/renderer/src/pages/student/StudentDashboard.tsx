import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  BookOpen, Video, CreditCard, Bell, User, LayoutDashboard,
  PlayCircle, Clock, Award, Calendar, CheckCircle2, AlertCircle,
  ChevronRight, Loader2, Star, Lock
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
type Tab = 'overview' | 'classes' | 'videos' | 'payments' | 'notifications' | 'profile';

// ─── Mock Data ────────────────────────────────────────────────
const MOCK_ENROLLMENTS = [
  { id: '1', title: 'A/L Mathematics Complete Course', teacher: 'Nimesh Perera', progress: 72, totalLessons: 48, completedLessons: 35, thumbnail: null },
  { id: '2', title: 'Python Programming Zero to Hero', teacher: 'Nimesh Perera', progress: 40, totalLessons: 36, completedLessons: 14, thumbnail: null },
  { id: '3', title: 'English Communication Skills', teacher: 'Saman Silva', progress: 90, totalLessons: 24, completedLessons: 22, thumbnail: null },
];

const MOCK_LIVE = [
  { id: '1', title: 'Calculus Live Session — Limits & Derivatives', course: 'A/L Mathematics', teacher: 'Nimesh Perera', date: '2026-05-10', time: '10:00 AM', status: 'SCHEDULED' },
  { id: '2', title: 'Python OOP Deep Dive', course: 'Python Programming', teacher: 'Nimesh Perera', date: '2026-05-12', time: '3:00 PM', status: 'SCHEDULED' },
];

const MOCK_VIDEOS = [
  { id: '1', title: 'Introduction to Pure Mathematics', course: 'A/L Mathematics', duration: '45m', thumbnail: null },
  { id: '2', title: 'Variables and Data Types', course: 'Python Programming', duration: '32m', thumbnail: null },
  { id: '3', title: 'Building Your First Project', course: 'Python Programming', duration: '1h 12m', thumbnail: null },
];

const MOCK_PAYMENTS = [
  { id: '1', description: 'A/L Mathematics Complete Course', amount: 4500, currency: 'LKR', status: 'SUCCESS', date: '2026-04-01' },
  { id: '2', description: 'Python Programming Zero to Hero', amount: 2990, currency: 'LKR', status: 'SUCCESS', date: '2026-04-15' },
  { id: '3', description: 'English Communication Skills', amount: 1800, currency: 'LKR', status: 'SUCCESS', date: '2026-05-01' },
];

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Live class starting soon!', body: 'Calculus session starts in 30 minutes.', read: false, date: '2026-05-09' },
  { id: '2', title: 'Welcome to TUTORLY! 🎓', body: 'Start exploring courses and begin your learning journey today.', read: true, date: '2026-04-01' },
  { id: '3', title: 'New lesson uploaded', body: 'A new lesson was added to Python Programming.', read: false, date: '2026-05-08' },
];

// ─── Reusable Badge ───────────────────────────────────────────
const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>
);

// ─── Progress Bar ─────────────────────────────────────────────
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-teal-500' }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
  </div>
);

// ─── Tab Navigation ───────────────────────────────────────────
const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',       icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'classes',        label: 'My Classes',      icon: <BookOpen className="w-4 h-4" /> },
  { id: 'videos',         label: 'Videos',          icon: <Video className="w-4 h-4" /> },
  { id: 'payments',       label: 'Payments',        icon: <CreditCard className="w-4 h-4" /> },
  { id: 'notifications',  label: 'Notifications',   icon: <Bell className="w-4 h-4" /> },
  { id: 'profile',        label: 'Profile',         icon: <User className="w-4 h-4" /> },
];

// ─── Overview Tab ─────────────────────────────────────────────
const OverviewTab: React.FC<{ user: { firstName: string; lastName: string; email: string } }> = ({ user }) => (
  <div className="space-y-8">
    {/* Hero */}
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-8 text-white">
      <div className="relative z-10">
        <p className="text-teal-100 text-sm font-medium mb-1">Welcome back,</p>
        <h2 className="text-3xl font-bold mb-2">{user.firstName} {user.lastName}</h2>
        <p className="text-teal-100 text-sm">Keep up your momentum — you're doing great!</p>
      </div>
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-12 -right-4 w-56 h-56 bg-white/5 rounded-full" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Active Courses', value: 3, icon: <BookOpen className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
        { label: 'Hours Learned', value: '28.5', icon: <Clock className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Certificates', value: 1, icon: <Award className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
        { label: 'Live Sessions', value: 2, icon: <Calendar className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
          <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Continue Learning */}
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">Continue Learning</h3>
      <div className="space-y-3">
        {MOCK_ENROLLMENTS.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{c.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.teacher} · {c.completedLessons}/{c.totalLessons} lessons</p>
              <div className="mt-2"><ProgressBar value={c.progress} /></div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-teal-600">{c.progress}%</p>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors ml-auto mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Upcoming Live */}
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Live Classes</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {MOCK_LIVE.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <Badge color="bg-red-50 text-red-600">🔴 Live Soon</Badge>
              <span className="text-xs text-slate-500">{s.date}</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm leading-snug">{s.title}</p>
            <p className="text-xs text-slate-500 mt-1">{s.course} · {s.time}</p>
            <button className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              Join Session
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Classes Tab ──────────────────────────────────────────────
const ClassesTab: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-slate-900">Enrolled Classes</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {MOCK_ENROLLMENTS.map((c) => (
        <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="h-36 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <PlayCircle className="w-12 h-12 text-white opacity-80" />
          </div>
          <div className="p-5">
            <h3 className="font-bold text-slate-900 leading-snug mb-1">{c.title}</h3>
            <p className="text-sm text-slate-500 mb-4">by {c.teacher}</p>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{c.completedLessons} of {c.totalLessons} lessons</span>
              <span className="font-semibold text-teal-600">{c.progress}%</span>
            </div>
            <ProgressBar value={c.progress} />
            <button className="mt-4 w-full border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm font-medium py-2 rounded-lg transition-colors">
              Continue →
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Videos Tab ───────────────────────────────────────────────
const VideosTab: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-slate-900">Purchased Videos</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {MOCK_VIDEOS.map((v) => (
        <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center relative">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{v.duration}</span>
          </div>
          <div className="p-4">
            <p className="font-semibold text-slate-900 text-sm leading-snug">{v.title}</p>
            <p className="text-xs text-slate-500 mt-1">{v.course}</p>
          </div>
        </div>
      ))}
      {/* Locked preview */}
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm overflow-hidden opacity-60">
        <div className="h-40 bg-slate-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <div className="p-4">
          <p className="font-semibold text-slate-500 text-sm">Unlock more videos</p>
          <p className="text-xs text-slate-400 mt-1">Enroll in a course to access</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Payments Tab ─────────────────────────────────────────────
const PaymentsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
      <Badge color="bg-slate-100 text-slate-600">{MOCK_PAYMENTS.length} transactions</Badge>
    </div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left p-4 font-semibold text-slate-600">Description</th>
              <th className="text-left p-4 font-semibold text-slate-600">Date</th>
              <th className="text-left p-4 font-semibold text-slate-600">Status</th>
              <th className="text-right p-4 font-semibold text-slate-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{p.description}</td>
                <td className="p-4 text-slate-500">{new Date(p.date).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                <td className="p-4">
                  <Badge color="bg-green-50 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1 inline" /> {p.status}
                  </Badge>
                </td>
                <td className="p-4 text-right font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={3} className="p-4 font-semibold text-slate-700">Total Spent</td>
              <td className="p-4 text-right font-bold text-teal-700 text-base">
                Rs. {MOCK_PAYMENTS.reduce((s, p) => s + p.amount, 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
);

// ─── Notifications Tab ────────────────────────────────────────
const NotificationsTab: React.FC = () => {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const unread = items.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
        {unread > 0 && (
          <button onClick={() => setItems(items.map(n => ({ ...n, read: true })))} className="text-sm text-teal-600 hover:text-teal-800 font-medium">
            Mark all as read
          </button>
        )}
      </div>
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} onClick={() => setItems(items.map(i => i.id === n.id ? { ...i, read: true } : i))}
            className={`relative flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
              n.read ? 'bg-white border-slate-100' : 'bg-teal-50 border-teal-100 shadow-sm'
            }`}>
            {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-500" />}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-100' : 'bg-teal-100'}`}>
              <Bell className={`w-5 h-5 ${n.read ? 'text-slate-400' : 'text-teal-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
              <p className="text-xs text-slate-400 mt-1.5">{n.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Profile Tab ──────────────────────────────────────────────
const ProfileTab: React.FC<{ user: { firstName: string; lastName: string; email: string } }> = ({ user }) => {
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: '', grade: '' });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API call
    setSaved(true);
    setIsSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-xl space-y-8">
      <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <button className="mt-2 text-sm text-teal-600 hover:text-teal-800 font-medium">Change photo</button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-slate-800">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
            <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
            <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
          <input className="input-field" placeholder="+94 77 123 4567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade / Level</label>
          <input className="input-field" placeholder="e.g. A/L 2025" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-70">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-3">
        <h3 className="font-semibold text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Danger Zone</h3>
        <p className="text-sm text-slate-500">Permanently delete your account and all associated data.</p>
        <button className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  const u = user ?? { firstName: 'Student', lastName: '', email: '' };

  return (
    <div className="flex h-full gap-0">
      {/* Side Nav */}
      <aside className="w-52 shrink-0 pr-6">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className={`ml-auto text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick stats */}
        <div className="mt-8 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-teal-700">Learning Streak</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">7 Days 🔥</p>
          <p className="text-xs text-teal-600 mt-0.5">Keep it up!</p>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === 'overview'       && <OverviewTab user={u} />}
        {activeTab === 'classes'        && <ClassesTab />}
        {activeTab === 'videos'         && <VideosTab />}
        {activeTab === 'payments'       && <PaymentsTab />}
        {activeTab === 'notifications'  && <NotificationsTab />}
        {activeTab === 'profile'        && <ProfileTab user={u} />}
      </div>
    </div>
  );
};

export default StudentDashboard;

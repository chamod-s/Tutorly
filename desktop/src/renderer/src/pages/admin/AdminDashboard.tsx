import React, { useState } from 'react';
import { LayoutDashboard, Users, CheckCircle2, XCircle, DollarSign, BarChart2, FileText, RefreshCw, Shield, TrendingUp, AlertTriangle, Eye } from 'lucide-react';

type Tab = 'overview' | 'teachers' | 'users' | 'payments' | 'analytics' | 'reports';



const Stat: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; color: string }> = ({ label, value, sub, icon, color }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
  </div>
);

const PENDING_TEACHERS = [
  { userId: 'u1', name: 'Sachith Bandara', email: 'sachith@email.com', subjects: ['Chemistry', 'Biology'], exp: 8, submitted: '2026-05-08' },
  { userId: 'u2', name: 'Priya Wijesinghe', email: 'priya@email.com', subjects: ['English', 'Literature'], exp: 5, submitted: '2026-05-09' },
];

const ALL_USERS = [
  { id: '1', name: 'Kasun Silva', email: 'kasun@tutorly.lk', role: 'STUDENT', status: 'Active', joined: '2026-04-01' },
  { id: '2', name: 'Nimesh Perera', email: 'nimesh@tutorly.lk', role: 'TEACHER', status: 'Active', joined: '2026-03-15' },
  { id: '3', name: 'Dilini Perera', email: 'dilini@tutorly.lk', role: 'STUDENT', status: 'Active', joined: '2026-04-15' },
  { id: '4', name: 'Nimal Fernando', email: 'nimal@tutorly.lk', role: 'STUDENT', status: 'Suspended', joined: '2026-03-20' },
];

const PAYMENTS = [
  { id: 'p1', student: 'Kasun Silva', course: 'A/L Mathematics', amount: 4500, status: 'SUCCESS', date: '2026-05-01' },
  { id: 'p2', student: 'Dilini Perera', course: 'Python Programming', amount: 2990, status: 'SUCCESS', date: '2026-05-03' },
  { id: 'p3', student: 'Nimal Fernando', course: 'A/L Mathematics', amount: 4500, status: 'REFUNDED', date: '2026-05-05' },
  { id: 'p4', student: 'Sachini M.', course: 'English Skills', amount: 1800, status: 'PENDING', date: '2026-05-09' },
];

// ── Overview ──────────────────────────────────────────────────
const OverviewTab: React.FC<{ onTab: (t: Tab) => void }> = ({ onTab }) => (
  <div className="space-y-8">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-purple-900 p-8 text-white">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-violet-300" /><span className="text-violet-200 text-sm font-medium">Admin Control Panel</span></div>
        <h2 className="text-3xl font-bold mb-1">TUTORLY Admin</h2>
        <p className="text-violet-200 text-sm">Platform overview and management</p>
      </div>
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat label="Total Users" value="1,842" sub="↑ 24 this week" icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
      <Stat label="Revenue (MTD)" value="Rs. 612k" sub="↑ 18% vs last month" icon={<DollarSign className="w-5 h-5" />} color="bg-green-50 text-green-600" />
      <Stat label="Pending Approvals" value="2" icon={<CheckCircle2 className="w-5 h-5" />} color="bg-amber-50 text-amber-600" />
      <Stat label="Active Courses" value="18" sub="3 pending review" icon={<BarChart2 className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-900">Pending Teacher Approvals</h3>
          <button onClick={() => onTab('teachers')} className="text-sm text-violet-600 font-medium">View all →</button>
        </div>
        {PENDING_TEACHERS.map(t => (
          <div key={t.userId} className="flex items-center justify-between py-3 border-b last:border-0 border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm">{t.name[0]}</div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                <p className="text-xs text-slate-500">{t.subjects.join(', ')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
              <button className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-5">Recent Transactions</h3>
        <div className="space-y-3">
          {PAYMENTS.slice(0, 3).map(p => (
            <div key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.student}</p>
                <p className="text-xs text-slate-500">{p.course}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</p>
                <span className={`text-xs font-medium ${p.status === 'SUCCESS' ? 'text-green-600' : p.status === 'REFUNDED' ? 'text-orange-600' : 'text-slate-400'}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onTab('payments')} className="mt-4 w-full text-sm text-center text-violet-600 hover:text-violet-800 font-medium">View all payments →</button>
      </div>
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-900">Action Required</p>
        <p className="text-sm text-amber-700 mt-0.5">2 teacher applications are awaiting review. 1 payment dispute needs attention.</p>
      </div>
    </div>
  </div>
);

// ── Teachers Approval ─────────────────────────────────────────
const TeachersTab: React.FC = () => {
  const [apps, setApps] = useState(PENDING_TEACHERS);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const approve = (userId: string) => setApps(a => a.filter(t => t.userId !== userId));
  const reject = () => { if (rejectId) { setApps(a => a.filter(t => t.userId !== rejectId)); setRejectId(null); setReason(''); } };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Teacher Approval Queue</h2>

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 mb-2">Reject Application</h3>
            <textarea rows={4} className="input-field resize-none mb-4 w-full" placeholder="Provide a reason for rejection…" value={reason} onChange={e => setReason(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectId(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={reject} disabled={reason.length < 10} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">All applications reviewed!</p>
        </div>
      ) : apps.map(t => (
        <div key={t.userId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700">{t.name[0]}</div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{t.name}</h3>
                <p className="text-sm text-slate-500">{t.email}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400">Submitted {t.submitted}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div><span className="text-slate-500">Subjects: </span><span className="font-medium text-slate-800">{t.subjects.join(', ')}</span></div>
            <div><span className="text-slate-500">Experience: </span><span className="font-medium text-slate-800">{t.exp} years</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => approve(t.userId)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => setRejectId(t.userId)} className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-xl text-sm font-semibold transition-colors">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Users ─────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = ALL_USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">User Management</h2>
        <input className="input-field w-64" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">{u.name[0]}</div>
                    <div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : u.role === 'TEACHER' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{u.status}</span>
                </td>
                <td className="px-5 py-4 text-slate-500">{new Date(u.joined).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><XCircle className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Payments ──────────────────────────────────────────────────
const PaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState(PAYMENTS);
  const handleRefund = (id: string) => setPayments(p => p.map(x => x.id === id ? { ...x, status: 'REFUNDED' } : x));

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Payment & Refund Management</h2>
        <div className="text-sm font-semibold text-slate-700">Total: <span className="text-green-700">Rs. {payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0).toLocaleString()}</span></div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{['Student', 'Course', 'Date', 'Amount', 'Status', 'Action'].map(h => <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-semibold text-slate-900">{p.student}</td>
                <td className="px-5 py-4 text-slate-600">{p.course}</td>
                <td className="px-5 py-4 text-slate-500">{p.date}</td>
                <td className="px-5 py-4 font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : p.status === 'REFUNDED' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'}`}>{p.status}</span>
                </td>
                <td className="px-5 py-4">
                  {p.status === 'SUCCESS' && (
                    <button onClick={() => handleRefund(p.id)} className="flex items-center gap-1 text-xs text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-50 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Analytics & Reports ───────────────────────────────────────
const AnalyticsTab: React.FC = () => {
  const MONTHLY = [{ m: 'Jan', r: 380000, u: 180 }, { m: 'Feb', r: 420000, u: 210 }, { m: 'Mar', r: 395000, u: 195 }, { m: 'Apr', r: 510000, u: 280 }, { m: 'May', r: 612000, u: 310 }];
  const maxR = Math.max(...MONTHLY.map(x => x.r));
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 'Rs. 2.3M', icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { label: 'Total Students', value: '1,592', icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active Teachers', value: '24', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
          { label: 'Courses Published', value: '18', icon: <BarChart2 className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
        ].map(s => <Stat key={s.label} {...s} />)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-6">Monthly Revenue</h3>
        <div className="flex items-end gap-5 h-44">
          {MONTHLY.map(e => (
            <div key={e.m} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-violet-700">Rs. {(e.r / 1000).toFixed(0)}k</span>
              <div className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg" style={{ height: `${Math.round((e.r / maxR) * 160)}px` }} />
              <span className="text-xs text-slate-400 font-medium">{e.m}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Top Performing Courses</h3>
        {[{ t: 'A/L Mathematics', students: 312, rev: 1404000 }, { t: 'Python Programming', students: 187, rev: 559130 }, { t: 'English Communication', students: 94, rev: 169200 }].map((c, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0 border-slate-50">
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
            <div className="flex-1"><p className="font-semibold text-slate-900 text-sm">{c.t}</p><p className="text-xs text-slate-500">{c.students} students</p></div>
            <span className="font-bold text-green-700 text-sm">Rs. {(c.rev / 1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsTab: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-slate-900">Reports</h2>
    <div className="grid sm:grid-cols-2 gap-4">
      {[
        { title: 'Revenue Report', desc: 'Monthly and yearly revenue breakdown by course and teacher', icon: <DollarSign className="w-6 h-6" /> },
        { title: 'Student Report', desc: 'Enrollment trends, completion rates, and engagement metrics', icon: <Users className="w-6 h-6" /> },
        { title: 'Teacher Performance', desc: 'Ratings, revenue, and student satisfaction per teacher', icon: <TrendingUp className="w-6 h-6" /> },
        { title: 'Payment Audit', desc: 'Complete transaction log including refunds and disputes', icon: <FileText className="w-6 h-6" /> },
      ].map(r => (
        <div key={r.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4 group cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0 group-hover:bg-violet-100 transition-colors">{r.icon}</div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">{r.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
            <button className="mt-3 text-sm text-violet-600 font-medium hover:text-violet-800">Download CSV →</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────
const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'teachers',  label: 'Approvals',   icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'users',     label: 'Users',       icon: <Users className="w-4 h-4" /> },
  { id: 'payments',  label: 'Payments',    icon: <DollarSign className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics',   icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'reports',   label: 'Reports',     icon: <FileText className="w-4 h-4" /> },
];

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="flex h-full gap-0">
      <aside className="w-52 shrink-0 pr-6">
        <nav className="space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === n.id ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              {n.icon}<span>{n.label}</span>
              {n.id === 'teachers' && <span className={`ml-auto text-xs rounded-full px-1.5 font-bold ${tab === 'teachers' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>2</span>}
            </button>
          ))}
        </nav>
        <div className="mt-8 p-4 bg-gradient-to-br from-violet-700 to-purple-900 rounded-xl text-white">
          <div className="flex items-center gap-1.5 mb-2"><Shield className="w-4 h-4 text-violet-300" /><span className="text-xs text-violet-200">System Health</span></div>
          <p className="text-lg font-bold">All Systems ✓</p>
          <p className="text-xs text-violet-300 mt-1">99.9% uptime</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {tab === 'overview'  && <OverviewTab onTab={setTab} />}
        {tab === 'teachers'  && <TeachersTab />}
        {tab === 'users'     && <UsersTab />}
        {tab === 'payments'  && <PaymentsTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'reports'   && <ReportsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;

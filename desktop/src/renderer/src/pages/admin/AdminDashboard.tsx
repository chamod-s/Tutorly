import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CheckCircle2, XCircle, DollarSign, BarChart2, FileText, RefreshCw, Shield, TrendingUp, AlertTriangle, Loader2, Award, Lock, Unlock, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type Tab = 'overview' | 'teachers' | 'users' | 'payments' | 'analytics' | 'reports';

const Stat: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode; color: string }> = ({ label, value, sub, icon, color }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
  </div>
);

interface OverviewTabProps {
  onTab: (t: Tab) => void;
  apps: any[];
  isLoading: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
  analyticsData: any;
  isAnalyticsLoading: boolean;
}

// ── Overview ──────────────────────────────────────────────────
const OverviewTab: React.FC<OverviewTabProps> = ({ onTab, apps, isLoading, onApprove, onReject, analyticsData, isAnalyticsLoading }) => (
  <div className="space-y-8 animate-fade-in">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-purple-900 p-8 text-white">
      <div className="relative z-10 text-left">
        <div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-violet-300" /><span className="text-violet-200 text-sm font-medium">Admin Control Panel</span></div>
        <h2 className="text-3xl font-bold mb-1">TUTORLY Admin</h2>
        <p className="text-violet-200 text-sm">Platform overview and management</p>
      </div>
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat label="Total Users" value={isAnalyticsLoading ? '...' : (analyticsData?.overview?.totalUsers || 0).toLocaleString()} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
      <Stat label="Total Revenue" value={isAnalyticsLoading ? '...' : `Rs. ${(analyticsData?.overview?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="bg-green-50 text-green-600" />
      <Stat label="Pending Approvals" value={isLoading ? '...' : apps.length.toString()} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-amber-50 text-amber-600" />
      <Stat label="Active Courses" value={isAnalyticsLoading ? '...' : (analyticsData?.overview?.totalCourses || 0).toString()} icon={<BarChart2 className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-900">Pending Teacher Approvals</h3>
          <button onClick={() => onTab('teachers')} className="text-sm text-violet-600 font-medium">View all →</button>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
          </div>
        ) : apps.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No pending teacher approvals.</p>
        ) : (
          apps.slice(0, 3).map(t => {
            const fullName = `${t.user.firstName} ${t.user.lastName}`;
            return (
              <div key={t.userId} className="flex items-center justify-between py-3 border-b last:border-0 border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm">{t.user.firstName[0]}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{fullName}</p>
                    <p className="text-xs text-slate-500">{t.subjects?.join(', ') || 'No subjects'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(t.userId)} className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                  <button onClick={() => onReject(t.userId, 'Profile details require updates. Please review qualifications.')} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left">
        <h3 className="font-bold text-slate-900 mb-5">Recent Transactions</h3>
        <div className="space-y-3">
          {isAnalyticsLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
            </div>
          ) : !analyticsData?.recentPayments || analyticsData.recentPayments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No successful transactions yet.</p>
          ) : (
            analyticsData.recentPayments.slice(0, 3).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown Student'}</p>
                  <p className="text-xs text-slate-500">{p.metadata?.courseName || p.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</p>
                  <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{p.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <button onClick={() => onTab('payments')} className="mt-4 w-full text-sm text-center text-violet-600 hover:text-violet-800 font-medium">View all payments →</button>
      </div>
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 text-left">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-900">Action Required</p>
        <p className="text-sm text-amber-700 mt-0.5">
          {isLoading ? (
            'Checking pending approvals...'
          ) : apps.length > 0 ? (
            `${apps.length} teacher application${apps.length !== 1 ? 's' : ''} awaiting review. Please check the Approvals tab.`
          ) : (
            'All teacher applications are reviewed. No actions required.'
          )}
        </p>
      </div>
    </div>
  </div>
);

interface TeachersTabProps {
  apps: any[];
  isLoading: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
}

// ── Teachers Approval ─────────────────────────────────────────
const TeachersTab: React.FC<TeachersTabProps> = ({ apps, isLoading, onApprove, onReject }) => {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    await onApprove(userId);
    setActionLoading(null);
  };

  const handleRejectConfirm = async () => {
    if (rejectId) {
      setActionLoading(rejectId);
      await onReject(rejectId, reason);
      setActionLoading(null);
      setRejectId(null);
      setReason('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <h2 className="text-xl font-bold text-slate-900">Teacher Approval Queue</h2>

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-slate-900 mb-2">Reject Application</h3>
            <textarea
              rows={4}
              className="input-field resize-none mb-4 w-full"
              placeholder="Provide a reason for rejection (min 10 characters)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setRejectId(null)} 
                disabled={!!actionLoading}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectConfirm} 
                disabled={reason.length < 10 || !!actionLoading} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">All applications reviewed!</p>
        </div>
      ) : apps.map(t => {
        const fullName = `${t.user.firstName} ${t.user.lastName}`;
        const isActing = actionLoading === t.userId;
        return (
          <div key={t.userId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700">{t.user.firstName[0]}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{fullName}</h3>
                  <p className="text-sm text-slate-500">{t.user.email}</p>
                  {t.user.phone && <p className="text-xs text-slate-400 mt-0.5">{t.user.phone}</p>}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                Submitted {t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex gap-2">
                <span className="text-slate-500 font-semibold shrink-0">Subjects:</span>
                <div className="flex flex-wrap gap-1.5">
                  {t.subjects?.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 font-semibold shrink-0">Qualifications:</span>
                <div className="space-y-1">
                  {t.qualifications?.map((q: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Award className="w-3.5 h-3.5 text-violet-600" /> {q}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Experience: </span>
                <span className="font-medium text-slate-800">{t.experience} years</span>
              </div>
              {t.bio && (
                <div>
                  <span className="text-slate-500 font-semibold">Bio: </span>
                  <p className="font-medium text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100/60 mt-1">"{t.bio}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleApprove(t.userId)} 
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
              </button>
              <button 
                onClick={() => setRejectId(t.userId)} 
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Users ─────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data.data ?? []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await apiClient.patch(`/users/${id}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: res.data.data.isActive } : u));
    } catch (err) {
      console.error('Failed to toggle user status', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? All their enrollment, course, and payment data will be removed permanently.')) return;
    setActionLoadingId(id);
    try {
      await apiClient.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = users.filter(u => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900">User Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="input-field py-2 text-xs w-32"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input className="input-field w-full sm:w-64" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl text-slate-400">
          No users match your criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const fullName = `${u.firstName} ${u.lastName}`;
                const isSelf = u.id === currentUser?.id;
                const isActing = actionLoadingId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">{u.firstName[0]}</div>
                        <div><p className="font-semibold text-slate-900">{fullName}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : u.role === 'TEACHER' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{u.isActive ? 'Active' : 'Suspended'}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {isSelf ? (
                          <span className="text-xs text-slate-400 italic">Self</span>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleToggleActive(u.id)}
                              disabled={isActing}
                              className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'} disabled:opacity-50`}
                              title={u.isActive ? "Deactivate User" : "Activate User"}
                            >
                              {isActing && actionLoadingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={isActing}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors disabled:opacity-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Payments ──────────────────────────────────────────────────
const PaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/payments');
      setPayments(res.data.data ?? []);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefund = async (id: string) => {
    if (!window.confirm('Are you sure you want to refund this payment? The student will lose active enrollment access to this course immediately.')) return;
    setRefundingId(id);
    try {
      await apiClient.post(`/payments/${id}/refund`);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'REFUNDED' } : p));
    } catch (err) {
      console.error('Failed to process refund', err);
    } finally {
      setRefundingId(null);
    }
  };

  const activeTotal = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5 text-left">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Payment & Refund Management</h2>
        <div className="text-sm font-semibold text-slate-700 bg-green-50 px-3.5 py-1.5 rounded-xl border border-green-100">
          Total Net Revenue: <span className="text-green-700 font-bold">Rs. {activeTotal.toLocaleString()}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl text-slate-400">
          No system payments recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{['Student', 'Course/Item', 'Date', 'Amount', 'Status', 'Action'].map(h => <th key={h} className="px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(p => {
                const isRefunding = refundingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900">{p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown Student'}</td>
                    <td className="px-5 py-4 text-slate-600">{p.metadata?.courseName || p.type}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 
                        p.status === 'REFUNDED' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      {p.status === 'SUCCESS' && (
                        <button 
                          onClick={() => handleRefund(p.id)} 
                          disabled={isRefunding}
                          className="flex items-center gap-1 text-xs font-semibold text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                          {isRefunding ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface AnalyticsTabProps {
  analyticsData: any;
  isLoading: boolean;
}

// ── Analytics & Reports ───────────────────────────────────────
const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analyticsData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
      </div>
    );
  }

  const overview = analyticsData?.overview || {};
  const monthlyRevenue = analyticsData?.monthlyRevenue || [];
  const topCourses = analyticsData?.topCourses || [];
  const maxR = Math.max(...monthlyRevenue.map((x: any) => x.revenue), 1);

  return (
    <div className="space-y-6 text-left">
      <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Revenue" value={`Rs. ${(overview.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="bg-green-50 text-green-600" />
        <Stat label="Total Students" value={(overview.totalStudents || 0).toLocaleString()} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
        <Stat label="Active Teachers" value={(overview.totalTeachers || 0).toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} color="bg-violet-50 text-violet-600" />
        <Stat label="Courses Published" value={(overview.totalCourses || 0).toLocaleString()} icon={<BarChart2 className="w-5 h-5" />} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-6">Monthly Revenue Breakdown</h3>
        <div className="flex items-end gap-5 h-44 pt-4">
          {monthlyRevenue.length === 0 ? (
            <p className="text-xs text-slate-400 w-full text-center py-10">No monthly revenue data recorded yet.</p>
          ) : (
            monthlyRevenue.map((e: any) => (
              <div key={e.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-violet-700">Rs. {(e.revenue / 1000).toFixed(0)}k</span>
                <div className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all duration-300" style={{ height: `${Math.round((e.revenue / maxR) * 120)}px` }} />
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{e.month}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Top Performing Courses</h3>
        {topCourses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No enrollment statistics found.</p>
        ) : (
          topCourses.map((c: any, i: number) => {
            const count = c._count?.enrollments || 0;
            const revenue = count * c.price;
            return (
              <div key={c.id} className="flex items-center gap-4 py-3 border-b last:border-0 border-slate-50">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{c.title}</p>
                  <p className="text-xs text-slate-500">{count} student{count !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-bold text-green-700 text-sm">Rs. {revenue.toLocaleString()}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface ReportsTabProps {
  currentUser: any;
}

// ── Reports Tab ───────────────────────────────────────────────
const ReportsTab: React.FC<ReportsTabProps> = ({ currentUser }) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async (reportType: string) => {
    setSelectedReport(reportType);
    setIsLoading(true);
    try {
      const res = await apiClient.get('/analytics/admin/reports');
      setReportsData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reports data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportsData || !selectedReport) return;
    const doc = new jsPDF();
    
    // Styled Title & Header
    doc.setFontSize(22);
    doc.setTextColor(109, 40, 217); // Violet-700
    doc.text(`TUTORLY - ${selectedReport}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated on: ${new Date().toLocaleString('en-LK')}`, 14, 28);
    doc.text(`Administrator: ${currentUser?.firstName} ${currentUser?.lastName}`, 14, 34);
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 38, 196, 38);

    let summaryMetrics: any[] = [];
    let tableHeaders: string[] = [];
    let tableRows: any[][] = [];

    if (selectedReport === 'Revenue Report') {
      const revData = reportsData.revenueReport;
      summaryMetrics = [
        { label: 'Total Accumulated Revenue', value: `Rs. ${revData.totalRevenue.toLocaleString()}` },
        { label: 'Revenue Sources Count', value: revData.revenueByCourse.length.toString() }
      ];
      tableHeaders = ['Course / Item', 'Payment Type', 'Total Sales', 'Total Revenue'];
      tableRows = revData.revenueByCourse.map((c: any) => [
        c.course,
        c.type,
        c.salesCount.toString(),
        `Rs. ${c.revenue.toLocaleString()}`
      ]);
    } else if (selectedReport === 'Student Report') {
      const studData = reportsData.studentReport;
      summaryMetrics = [
        { label: 'Total Registered Students', value: studData.totalStudents.toString() },
        { label: 'Total Course Enrollments', value: studData.totalEnrollments.toString() },
        { label: 'Active Enrollments', value: studData.activeEnrollments.toString() },
        { label: 'Cancelled Enrollments', value: studData.cancelledEnrollments.toString() }
      ];
      tableHeaders = ['Student Name', 'Email', 'Course Enrolled', 'Status', 'Enrollment Date'];
      tableRows = studData.enrollments.map((e: any) => [
        e.studentName,
        e.studentEmail,
        e.courseTitle,
        e.status,
        new Date(e.enrolledAt).toLocaleDateString('en-LK')
      ]);
    } else if (selectedReport === 'Teacher Performance') {
      const teachData = reportsData.teacherPerformance;
      summaryMetrics = [
        { label: 'Total Registered Teachers', value: teachData.totalTeachers.toString() }
      ];
      tableHeaders = ['Teacher Name', 'Email', 'Rating', 'Exp (Yrs)', 'Courses', 'Total Students', 'Total Earnings'];
      tableRows = teachData.teachers.map((t: any) => [
        t.name,
        t.email,
        t.rating.toFixed(1),
        t.experience.toString(),
        t.coursesCount.toString(),
        t.studentsCount.toString(),
        `Rs. ${t.earnings.toLocaleString()}`
      ]);
    } else if (selectedReport === 'Payment Audit') {
      const payData = reportsData.paymentAudit;
      summaryMetrics = [
        { label: 'Total Payments Recorded', value: payData.totalPayments.toString() }
      ];
      tableHeaders = ['Student', 'Email', 'OrderId / Reference', 'Type', 'Amount', 'Status', 'Date'];
      tableRows = payData.payments.map((p: any) => [
        p.studentName,
        p.studentEmail,
        p.payhereOrderId,
        p.type,
        `Rs. ${p.amount.toLocaleString()}`,
        p.status,
        new Date(p.createdAt).toLocaleDateString('en-LK')
      ]);
    }

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate-700
    let yPos = 46;
    summaryMetrics.forEach((metric: any) => {
      doc.text(`${metric.label}: ${metric.value}`, 14, yPos);
      yPos += 6;
    });

    (doc as any).autoTable({
      startY: yPos + 4,
      head: [tableHeaders],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255] }, // Violet-700
      styles: { fontSize: 8.5 },
    });

    doc.save(`${selectedReport.toLowerCase().replace(/ /g, '_')}_${Date.now()}.pdf`);
  };

  if (!selectedReport) {
    return (
      <div className="space-y-6 text-left">
        <h2 className="text-xl font-bold text-slate-900">Reports Control Center</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Revenue Report', desc: 'Live monthly and course-wise revenue breakdown', icon: <DollarSign className="w-6 h-6" /> },
            { title: 'Student Report', desc: 'Enrollment stats, completion metrics, and user analytics', icon: <Users className="w-6 h-6" /> },
            { title: 'Teacher Performance', desc: 'Ratings, experience, courses count, and teacher earnings', icon: <TrendingUp className="w-6 h-6" /> },
            { title: 'Payment Audit', desc: 'Full list of system payments, refunds, order IDs, and statuses', icon: <FileText className="w-6 h-6" /> },
          ].map(r => (
            <div 
              key={r.title} 
              onClick={() => fetchReports(r.title)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4 group cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0 group-hover:bg-violet-100 transition-colors">{r.icon}</div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{r.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
                <button className="mt-3 text-sm text-violet-600 font-semibold hover:text-violet-850">View & Generate PDF →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={() => { setSelectedReport(null); setReportsData(null); setSearchQuery(''); }} className="text-xs font-semibold text-violet-600 hover:underline mb-1 flex items-center gap-1">
            ← Back to Report selection
          </button>
          <h2 className="text-xl font-bold text-slate-900">{selectedReport}</h2>
        </div>
        {reportsData && !isLoading && (
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" /> Download PDF Report
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-100 rounded-2xl">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        </div>
      ) : !reportsData ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl text-slate-400">
          Failed to retrieve report data.
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Summary KPIs */}
          {selectedReport === 'Revenue Report' && (
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Total Accumulated Revenue" value={`Rs. ${reportsData.revenueReport.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="bg-green-50 text-green-600" />
              <Stat label="Revenue Sources Count" value={reportsData.revenueReport.revenueByCourse.length.toString()} icon={<BarChart2 className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
            </div>
          )}
          {selectedReport === 'Student Report' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Total Registered Students" value={reportsData.studentReport.totalStudents.toLocaleString()} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
              <Stat label="Total Enrollments" value={reportsData.studentReport.totalEnrollments.toLocaleString()} icon={<BarChart2 className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
              <Stat label="Active Enrollments" value={reportsData.studentReport.activeEnrollments.toLocaleString()} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-green-50 text-green-600" />
              <Stat label="Cancelled Enrollments" value={reportsData.studentReport.cancelledEnrollments.toLocaleString()} icon={<XCircle className="w-5 h-5" />} color="bg-rose-50 text-rose-600" />
            </div>
          )}
          {selectedReport === 'Teacher Performance' && (
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Total Registered Teachers" value={reportsData.teacherPerformance.totalTeachers.toLocaleString()} icon={<Users className="w-5 h-5" />} color="bg-violet-50 text-violet-600" />
            </div>
          )}
          {selectedReport === 'Payment Audit' && (
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Total System Payments" value={reportsData.paymentAudit.totalPayments.toLocaleString()} icon={<DollarSign className="w-5 h-5" />} color="bg-green-50 text-green-600" />
            </div>
          )}

          {/* Search bar inside the online viewer */}
          <div className="flex justify-between items-center pt-2">
            <h3 className="font-bold text-slate-800 text-sm">Detailed Entries</h3>
            <input 
              className="input-field w-64 text-xs py-1.5" 
              placeholder="Search entries..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* Report Data Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {selectedReport === 'Revenue Report' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Course / Item Name', 'Payment Type', 'Total Sales count', 'Total Revenue'].map(h => <th key={h} className="px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportsData.revenueReport.revenueByCourse
                    .filter((c: any) => c.course.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{c.course}</td>
                        <td className="px-5 py-4 text-slate-600 text-xs font-semibold uppercase">{c.type}</td>
                        <td className="px-5 py-4 text-slate-500 font-bold">{c.salesCount}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">Rs. {c.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'Student Report' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Student', 'Email', 'Course Enrolled', 'Status', 'Date'].map(h => <th key={h} className="px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportsData.studentReport.enrollments
                    .filter((e: any) => e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || e.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) || e.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{e.studentName}</td>
                        <td className="px-5 py-4 text-slate-500">{e.studentEmail}</td>
                        <td className="px-5 py-4 text-slate-700">{e.courseTitle}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            e.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                          }`}>{e.status}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{new Date(e.enrolledAt).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'Teacher Performance' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Teacher', 'Email', 'Rating', 'Exp', 'Courses', 'Students', 'Accumulated Earnings'].map(h => <th key={h} className="px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportsData.teacherPerformance.teachers
                    .filter((t: any) => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{t.name}</td>
                        <td className="px-5 py-4 text-slate-500">{t.email}</td>
                        <td className="px-5 py-4 font-bold text-violet-750 text-violet-700">★ {t.rating.toFixed(1)}</td>
                        <td className="px-5 py-4 text-slate-600">{t.experience} yrs</td>
                        <td className="px-5 py-4 text-slate-500 font-bold">{t.coursesCount}</td>
                        <td className="px-5 py-4 text-slate-500 font-bold">{t.studentsCount}</td>
                        <td className="px-5 py-4 font-bold text-green-700">Rs. {t.earnings.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'Payment Audit' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Student', 'Email', 'Order Reference', 'Payment Type', 'Amount', 'Status', 'Date'].map(h => <th key={h} className="px-5 py-3 font-semibold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportsData.paymentAudit.payments
                    .filter((p: any) => p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || p.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) || p.payhereOrderId.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{p.studentName}</td>
                        <td className="px-5 py-4 text-slate-500">{p.studentEmail}</td>
                        <td className="px-5 py-4 text-slate-400 text-xs font-mono">{p.payhereOrderId}</td>
                        <td className="px-5 py-4 text-slate-600 text-xs font-bold uppercase">{p.type}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            p.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 
                            p.status === 'REFUNDED' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [apps, setApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/teachers/admin/pending');
      setApps(res.data.data ?? []);
    } catch (err) {
      console.error('Failed to load pending applications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await apiClient.get('/analytics/admin');
      setAnalyticsData(res.data.data);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchPending(), fetchAnalytics()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await apiClient.post(`/teachers/admin/${userId}/approve`);
      setApps((prev) => prev.filter((a) => a.userId !== userId));
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to approve teacher', err);
    }
  };

  const handleReject = async (userId: string, reason: string) => {
    try {
      await apiClient.post(`/teachers/admin/${userId}/reject`, { reason });
      setApps((prev) => prev.filter((a) => a.userId !== userId));
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to reject teacher', err);
    }
  };

  return (
    <div className="flex h-full gap-0">
      <aside className="w-52 shrink-0 pr-6 text-left">
        <nav className="space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === n.id ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              {n.icon}<span>{n.label}</span>
              {n.id === 'teachers' && apps.length > 0 && (
                <span className={`ml-auto text-xs rounded-full px-1.5 font-bold ${tab === 'teachers' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                  {apps.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-8 p-4 bg-gradient-to-br from-violet-700 to-purple-900 rounded-xl text-white">
          <div className="flex items-center gap-1.5 mb-2"><Shield className="w-4 h-4 text-violet-300" /><span className="text-xs text-violet-200">System Health</span></div>
          <p className="text-lg font-bold font-sans">All Systems ✓</p>
          <p className="text-xs text-violet-300 mt-1">99.9% uptime</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 text-left">
        {tab === 'overview'  && (
          <OverviewTab 
            onTab={setTab} 
            apps={apps} 
            isLoading={isLoading} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            analyticsData={analyticsData}
            isAnalyticsLoading={isAnalyticsLoading}
          />
        )}
        {tab === 'teachers'  && (
          <TeachersTab 
            apps={apps} 
            isLoading={isLoading} 
            onApprove={handleApprove} 
            onReject={handleReject} 
          />
        )}
        {tab === 'users'     && <UsersTab />}
        {tab === 'payments'  && <PaymentsTab />}
        {tab === 'analytics' && <AnalyticsTab analyticsData={analyticsData} isLoading={isAnalyticsLoading} />}
        {tab === 'reports'   && <ReportsTab currentUser={currentUser} />}
      </div>
    </div>
  );
};

export default AdminDashboard;

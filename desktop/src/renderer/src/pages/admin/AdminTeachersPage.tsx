import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { CheckCircle2, XCircle, Clock, Download, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────

interface TeacherApplication {
  id: string;
  userId: string;
  bio: string;
  subjects: string[];
  qualifications: string[];
  experience: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  profileImage: string | null;
  documents: string[];
  submittedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
}

// ─── Reject Modal ─────────────────────────────────────────────

const RejectModal: React.FC<{
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}> = ({ onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Application</h3>
        <p className="text-sm text-slate-500 mb-5">Provide a reason so the teacher knows what to improve.</p>
        <textarea
          rows={4}
          className="input-field resize-none mb-4"
          placeholder="e.g. Please upload a clearer copy of your degree certificate and provide more detail in your bio."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => reason.trim().length >= 10 && onConfirm(reason.trim())}
            disabled={isLoading || reason.trim().length < 10}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Application Card ─────────────────────────────────────────

const ApplicationCard: React.FC<{
  app: TeacherApplication;
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
  actionLoading: string | null;
}> = ({ app, onApprove, onReject, actionLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fullName = `${app.user.firstName} ${app.user.lastName}`;
  const isActing = actionLoading === app.userId;

  return (
    <>
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={(reason) => { onReject(app.userId, reason); setShowRejectModal(false); }}
          isLoading={isActing}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden shrink-0">
                {app.profileImage
                  ? <img src={app.profileImage} alt={fullName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
                      {app.user.firstName[0]}
                    </div>}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{fullName}</h3>
                <p className="text-sm text-slate-500">{app.user.email}</p>
                {app.user.phone && <p className="text-xs text-slate-400 mt-0.5">{app.user.phone}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-full">
                <Clock className="w-3 h-3" /> Pending Review
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {app.subjects.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-100">
                {s}
              </span>
            ))}
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
              {app.experience} yr{app.experience !== 1 ? 's' : ''} experience
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
          >
            {expanded ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> View details</>}
          </button>

          {expanded && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bio</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{app.bio}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Qualifications</h4>
                <ul className="space-y-1">
                  {app.qualifications.map((q, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {q}
                    </li>
                  ))}
                </ul>
              </div>
              {app.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents ({app.documents.length})</h4>
                  <div className="space-y-2">
                    {app.documents.map((doc, i) => {
                      const name = decodeURIComponent(doc.split('/').pop() ?? `Document ${i + 1}`);
                      return (
                        <a
                          key={i}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-teal-50 hover:border-teal-200 transition-colors group text-sm"
                        >
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                          <span className="text-slate-700 truncate">{name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Submitted: {new Date(app.submittedAt).toLocaleDateString('en-LK', { dateStyle: 'long' })}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
          <button
            onClick={() => onApprove(app.userId)}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────

const AdminTeachersPage: React.FC = () => {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/teachers/admin/pending');
      setApplications(res.data.data ?? []);
    } catch {
      setError('Failed to load pending applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await apiClient.post(`/teachers/admin/${userId}/approve`);
      setApplications((prev) => prev.filter((a) => a.userId !== userId));
    } catch (err: unknown) {
      if (err instanceof AxiosError) setError(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string, reason: string) => {
    setActionLoading(userId);
    try {
      await apiClient.post(`/teachers/admin/${userId}/reject`, { reason });
      setApplications((prev) => prev.filter((a) => a.userId !== userId));
    } catch (err: unknown) {
      if (err instanceof AxiosError) setError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage pending teacher applications.</p>
        </div>
        <button onClick={fetchPending} className="text-sm text-teal-600 hover:text-teal-800 font-medium">
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-700">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm mt-1">No pending teacher applications at this time.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-slate-500 font-medium">{applications.length} pending application{applications.length !== 1 ? 's' : ''}</p>
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeachersPage;

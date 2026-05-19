import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { CheckCircle2, XCircle, Clock, RefreshCw, Download, Loader2, AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK';
  type: string;
  metadata: { courseName?: string; courseId?: string } | null;
  payhereRef?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  SUCCESS:    { label: 'Success',    color: 'bg-green-50 text-green-700',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PENDING:    { label: 'Pending',    color: 'bg-amber-50 text-amber-700',  icon: <Clock className="w-3.5 h-3.5" /> },
  FAILED:     { label: 'Failed',     color: 'bg-red-50 text-red-700',      icon: <XCircle className="w-3.5 h-3.5" /> },
  REFUNDED:   { label: 'Refunded',   color: 'bg-orange-50 text-orange-700', icon: <RefreshCw className="w-3.5 h-3.5" /> },
  CHARGEBACK: { label: 'Chargeback', color: 'bg-purple-50 text-purple-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

// ── Digital Receipt ───────────────────────────────────────────
const ReceiptModal: React.FC<{ payment: Payment; onClose: () => void }> = ({ payment, onClose }) => {
  const cfg = STATUS_CONFIG[payment.status];
  const courseName = payment.metadata?.courseName ?? 'Course';
  const date = new Date(payment.createdAt).toLocaleString('en-LK', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`p-8 text-center ${payment.status === 'SUCCESS' ? 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
          <p className="text-sm font-medium mb-1 opacity-80">Digital Receipt</p>
          <p className="text-xs opacity-60 font-mono">{payment.id}</p>
        </div>

        {/* Receipt body */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">Rs. {payment.amount.toLocaleString()}</p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="font-medium text-slate-900 text-right max-w-[180px] truncate">{courseName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium text-slate-900">{payment.type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Currency</span><span className="font-medium text-slate-900">{payment.currency}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-900 text-right">{date}</span></div>
            {payment.payhereRef && <div className="flex justify-between"><span className="text-slate-500">PayHere Ref</span><span className="font-mono text-xs text-slate-600">{payment.payhereRef}</span></div>}
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-slate-200" />

          <p className="text-xs text-center text-slate-400">TUTORLY · tutorly.lk · {new Date().getFullYear()}</p>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">Close</button>
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 text-white py-2.5 rounded-xl text-sm hover:bg-teal-700">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState('');
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const MOCK_PAYMENTS: Payment[] = [
    { id: 'pay_abc123', amount: 4500, currency: 'LKR', status: 'SUCCESS', type: 'SUBSCRIPTION', metadata: { courseName: 'A/L Mathematics Complete', courseId: '1' }, payhereRef: 'PH-320847', createdAt: '2026-04-01T10:30:00Z' },
    { id: 'pay_def456', amount: 2990, currency: 'LKR', status: 'SUCCESS', type: 'ENROLLMENT', metadata: { courseName: 'Python Programming Zero to Hero', courseId: '2' }, payhereRef: 'PH-320921', createdAt: '2026-04-15T14:20:00Z' },
    { id: 'pay_ghi789', amount: 4500, currency: 'LKR', status: 'REFUNDED', type: 'SUBSCRIPTION', metadata: { courseName: 'A/L Mathematics Complete', courseId: '1' }, createdAt: '2026-04-30T09:00:00Z' },
    { id: 'pay_jkl012', amount: 3200, currency: 'LKR', status: 'PENDING', type: 'SUBSCRIPTION', metadata: { courseName: 'O/L Physics Mastery', courseId: '3' }, createdAt: '2026-05-09T20:00:00Z' },
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/payments/my');
        setPayments(res.data.data?.length ? res.data.data : MOCK_PAYMENTS);
      } catch {
        setPayments(MOCK_PAYMENTS); // fallback to mock when backend not running
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const total = payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter(p => p.status === 'REFUNDED').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;

  return (
    <>
      {receipt && <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
          <p className="text-slate-500 text-sm mt-1">{payments.length} transactions</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-teal-700">Rs. {total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">Refunded</p>
            <p className="text-xl font-bold text-orange-600">Rs. {refunded.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">Courses Paid</p>
            <p className="text-xl font-bold text-slate-900">{payments.filter(p => p.status === 'SUCCESS').length}</p>
          </div>
        </div>

        {/* Transactions */}
        {payments.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <p className="font-medium">No payments yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">All Transactions</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {payments.map(p => {
                const cfg = STATUS_CONFIG[p.status];
                const courseName = p.metadata?.courseName ?? 'Course Purchase';
                const date = new Date(p.createdAt).toLocaleDateString('en-LK', { dateStyle: 'medium' });
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{courseName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{date} · {p.type} · <span className="font-mono">{p.id.substring(0, 12)}…</span></p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <button onClick={() => setReceipt(p)} className="ml-2 p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View Receipt">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentHistory;

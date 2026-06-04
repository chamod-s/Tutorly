import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Lock, CreditCard, CheckCircle2, AlertCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { apiClient } from '../../api/client';
import { AxiosError } from 'axios';

// PayHere redirects to an external URL in a real integration.
// In sandbox/dev mode we simulate the flow in-app.

interface LocationState {
  courseId: string;
  courseTitle: string;
  price: number;
  type: 'SUBSCRIPTION' | 'ONE_TIME';
  teacherName: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [step, setStep] = useState<'review' | 'processing' | 'success' | 'failed'>('review');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [testMode, setTestMode] = useState<'simulator' | 'portal'>('simulator');
  const [isLoading, setIsLoading] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  if (!state) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="font-semibold text-slate-700">No payment information found.</p>
        <button onClick={() => navigate('/student/classes')} className="mt-4 btn-primary px-6 py-2 text-sm">Browse Classes</button>
      </div>
    );
  }

  const { courseId, courseTitle, price, type, teacherName } = state;

  const handlePay = async () => {
    setStep('processing');
    setError('');
    setIsLoading(true);
    try {
      const res = await apiClient.post('/payments/initiate', { courseId });
      const { orderId: oid, checkoutUrl, params } = res.data.data;
      setOrderId(oid);

      // Construct PayHere checkout query URL
      const queryParams = new URLSearchParams(params).toString();
      const fullUrl = `${checkoutUrl}?${queryParams}`;
      
      // Open the PayHere checkout page in default system browser
      window.open(fullUrl, '_blank');

      // Start polling the backend for payment status
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await apiClient.get(`/payments/${oid}/status`);
          const paymentStatus = statusRes.data.data.status;
          
          if (paymentStatus === 'SUCCESS') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setStep('success');
            setIsLoading(false);
          } else if (paymentStatus === 'FAILED') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setError('Payment transaction was marked as failed.');
            setStep('failed');
            setIsLoading(false);
          }
        } catch (pollErr) {
          console.error('Error polling payment status:', pollErr);
        }
      }, 3000);

    } catch (err: unknown) {
      setError(err instanceof AxiosError ? (err.response?.data?.message || 'Payment initiation failed') : 'Network error');
      setStep('failed');
      setIsLoading(false);
    }
  };

  // Helper to simulate webhook success (dev-mode bypass)
  const handleSimulateSuccess = async () => {
    try {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (!orderId) {
        setError('No active order ID to simulate.');
        setStep('failed');
        return;
      }
      await apiClient.post('/payments/simulate-webhook', { orderId, status: 'SUCCESS' });
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof AxiosError ? (err.response?.data?.message || 'Dev simulation enrollment failed') : 'Network error');
      setStep('failed');
    }
  };

  const handleSimulatePayment = async (status: 'SUCCESS' | 'FAILED') => {
    setIsLoading(true);
    setError('');
    try {
      // Step 1: Initiate payment to get orderId
      const initiateRes = await apiClient.post('/payments/initiate', { courseId });
      const { orderId: oid } = initiateRes.data.data;
      setOrderId(oid);

      setStep('processing');

      // Step 2: Call simulation endpoint to simulate the webhook callback
      await apiClient.post('/payments/simulate-webhook', { orderId: oid, status });

      // Step 3: Start polling the status to simulate client detection
      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          const statusRes = await apiClient.get(`/payments/${oid}/status`);
          const paymentStatus = statusRes.data.data.status;
          attempts++;

          if (paymentStatus === 'SUCCESS') {
            clearInterval(interval);
            setStep('success');
            setIsLoading(false);
          } else if (paymentStatus === 'FAILED') {
            clearInterval(interval);
            setError(status === 'FAILED' ? 'Simulated payment failure.' : 'Payment transaction failed.');
            setStep('failed');
            setIsLoading(false);
          } else if (attempts > 10) {
            clearInterval(interval);
            if (status === 'SUCCESS') {
              setStep('success');
            } else {
              setError('Webhook simulation timeout.');
              setStep('failed');
            }
            setIsLoading(false);
          }
        } catch (pollErr) {
          console.error('Error polling simulated status:', pollErr);
        }
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof AxiosError ? (err.response?.data?.message || 'Simulation failed') : 'Network error');
      setStep('failed');
      setIsLoading(false);
    }
  };

  // ── Success ───────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-10 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Payment Successful!</h2>
            <p className="text-green-100 text-sm">You're now enrolled in the course.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="font-semibold text-slate-900 text-right max-w-xs">{courseTitle}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Instructor</span><span className="font-semibold text-slate-900">{teacherName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-bold text-green-700">Rs. {price.toLocaleString()}{type === 'SUBSCRIPTION' ? '/mo' : ''}</span></div>
              {orderId && <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span className="font-mono text-xs text-slate-600">{orderId}</span></div>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/student')} className="flex-1 btn-primary py-2.5 text-sm">Go to Dashboard</button>
              <button onClick={() => navigate('/student/classes')} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Browse More</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed ────────────────────────────────────────────────
  if (step === 'failed') {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-10 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Payment Failed</h2>
            <p className="text-red-100 text-sm">{error || 'Something went wrong. Please try again.'}</p>
          </div>
          <div className="p-6 flex gap-3">
            <button onClick={() => setStep('review')} className="flex-1 btn-primary py-2.5 text-sm">Try Again</button>
            <button onClick={() => navigate('/student/classes')} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing ────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Waiting for PayHere confirmation...</h2>
          <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed text-left space-y-3">
            <p>1. We have initiated the transaction and are awaiting verification.</p>
            <p>2. If you opened the external PayHere Sandbox portal, please complete it there.</p>
            <p>3. Do not close this app window. The dashboard will automatically update once the transaction succeeds.</p>
          </div>
          
          {/* Dev-Mode Simulate Success Button */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <p className="text-xs text-slate-400">Running in Sandbox Mode? You can manually simulate the server-to-server webhook callback below:</p>
            <button
              onClick={handleSimulateSuccess}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-sm py-2.5 rounded-xl font-semibold transition-colors"
            >
              Simulate Webhook Success (Local API Callback)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review ────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Complete Payment</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <h3 className="font-semibold text-slate-800 mb-4">Order Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="font-medium text-slate-900 text-right max-w-xs">{courseTitle}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Instructor</span><span className="font-medium text-slate-900">{teacherName}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Payment Type</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${type === 'SUBSCRIPTION' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
              {type === 'SUBSCRIPTION' ? 'Monthly Subscription' : 'One-Time Payment'}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between">
            <span className="font-semibold text-slate-700">Total {type === 'SUBSCRIPTION' ? '(per month)' : ''}</span>
            <span className="text-xl font-bold text-teal-700">Rs. {price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* PayHere Info */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-5 text-white mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><CreditCard className="w-5 h-5" /></div>
          <div>
            <p className="font-bold text-sm">PayHere · Secure Payment</p>
            <p className="text-teal-100 text-xs">Sri Lanka's trusted payment gateway</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {['Visa & Mastercard', 'Mobile Payments', 'Internet Banking', 'Cash Deposits'].map(m => (
            <div key={m} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-teal-300" />{m}
            </div>
          ))}
        </div>
      </div>

      {/* Sandbox Testing Mode Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          PayHere Sandbox Testing Mode
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Select a method to test the payment process in this demo application.
        </p>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-4">
          <button
            onClick={() => setTestMode('simulator')}
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              testMode === 'simulator'
                ? 'bg-white text-teal-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            Local Webhook Simulator
          </button>
          <button
            onClick={() => setTestMode('portal')}
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              testMode === 'portal'
                ? 'bg-white text-teal-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            PayHere Sandbox Portal
          </button>
        </div>

        {testMode === 'simulator' ? (
          <div className="space-y-3">
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-800 leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Recommended for Local Demo:</strong> Simulates the server-to-server webhook callback locally.
                Tests signature validation, databases, enrollment records, and notifications.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Portal Redirect:</strong> Opens PayHere's sandbox checkout in your browser.
                Note that PayHere cannot deliver webhooks to localhost without a public HTTPS tunnel (like Ngrok).
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 mb-6 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-green-500" /> SSL Encrypted</span>
        <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-blue-500" /> PCI Compliant</span>
        <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5 text-slate-400" /> PayHere Verified</span>
      </div>

      {testMode === 'simulator' ? (
        <div className="flex gap-3">
          <button
            onClick={() => handleSimulatePayment('SUCCESS')}
            disabled={isLoading}
            className="flex-1 btn-primary py-4 text-base font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Simulate Success
              </>
            )}
          </button>
          <button
            onClick={() => handleSimulatePayment('FAILED')}
            disabled={isLoading}
            className="border border-red-200 hover:bg-red-50 text-red-700 py-4 px-6 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            Simulate Fail
          </button>
        </div>
      ) : (
        <button
          onClick={handlePay}
          disabled={isLoading}
          className="w-full btn-primary py-4 text-base font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Lock className="w-5 h-5" /> Pay Rs. {price.toLocaleString()} Securely
            </>
          )}
        </button>
      )}

      <button onClick={() => navigate(-1)} className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 py-2">Cancel</button>
    </div>
  );
};

export default PaymentPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../api/auth.service';
import { KeyRound, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if accessed without email state
  useEffect(() => {
    if (!email) {
      navigate('/auth/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.verifyOtp(email, code);
      // Redirect to reset password page with email and code in state
      navigate('/auth/reset-password', { state: { email, code } });
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.message || 'Invalid OTP code');
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Verify OTP</h2>
        <p className="text-slate-500">
          We've sent a 6-digit code to <span className="font-medium text-slate-900">{email}</span>.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">6-Digit OTP</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              required
              maxLength={6}
              disabled={isLoading}
              className="input-field pl-10 tracking-[0.5em] font-mono text-center disabled:opacity-50 disabled:bg-slate-50"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // only digits
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || code.length !== 6}
          className="w-full btn-primary flex justify-center items-center py-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Verify Code
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        Didn't receive the code?{' '}
        <button 
          onClick={() => authService.forgotPassword(email)}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Resend OTP
        </button>
      </div>
      
      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-slate-500 hover:text-slate-700">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default VerifyOtp;

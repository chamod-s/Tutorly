import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../api/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import { KeyRound, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';

const VerifyAccount: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  
  const email = location.state?.email as string || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if accessed without email state
  useEffect(() => {
    if (!email) {
      navigate('/auth/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.verifyAccount(email, code);
      
      setIsSuccess(true);
      
      // Store tokens and user in Zustand
      login(response.user, response.tokens.accessToken);

      // Delay redirect slightly to show success state
      setTimeout(() => {
        if (response.user.role === 'ADMIN') navigate('/admin');
        else if (response.user.role === 'TEACHER') navigate('/teacher');
        else navigate('/student');
      }, 1500);
      
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

  if (isSuccess) {
    return (
      <div className="w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Account Verified!</h2>
        <p className="text-slate-500 mb-8">
          Welcome to TUTORLY. Your account has been verified successfully. Redirecting you to your dashboard...
        </p>
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Verify your account</h2>
        <p className="text-slate-500">
          We've sent a 6-digit verification code to <span className="font-semibold text-slate-900">{email}</span>.
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              required
              maxLength={6}
              disabled={isLoading}
              className="input-field pl-10 tracking-[0.5em] font-mono text-center text-lg"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Check your email (or backend console) for the 6-digit code.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || code.length !== 6}
          className="w-full btn-primary flex justify-center items-center py-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Verify & Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        Didn't receive the code?{' '}
        <button 
          onClick={() => authService.register({ ...location.state })} // Simple way to resend is to call register again (backend handles existing)
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Resend OTP
        </button>
      </div>
      
      <div className="mt-4 text-center text-sm">
        <Link to="/auth/register" className="text-slate-500 hover:text-slate-700">
          Back to registration
        </Link>
      </div>
    </div>
  );
};

export default VerifyAccount;

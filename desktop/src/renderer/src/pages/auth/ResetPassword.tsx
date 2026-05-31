import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../api/auth.service';
import { Lock, ArrowRight, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string || '';
  const code = location.state?.code as string || '';

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if accessed without state
  useEffect(() => {
    if (!email || !code) {
      navigate('/auth/forgot-password');
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.resetPassword(email, code, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data.message || 'Failed to reset password');
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Password Reset!</h2>
        <p className="text-slate-500 mb-8">
          Your password has been successfully reset. You can now login with your new password.
        </p>
        <Link to="/auth/login" className="w-full btn-primary flex justify-center items-center py-2.5">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create New Password</h2>
        <p className="text-slate-500">Please enter a strong, new password.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              disabled={isLoading}
              className="input-field pl-10 pr-10 disabled:opacity-50 disabled:bg-slate-50"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Must be at least 8 characters, contain one uppercase letter and one number.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full btn-primary flex justify-center items-center py-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Reset Password
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

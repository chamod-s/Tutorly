import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../api/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Mail, Lock, Phone, GraduationCap, ArrowRight, AlertCircle, Loader2, BookOpen, Award, Briefcase, FileText, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';

const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'A/L 2025', 'A/L 2026', 'A/L 2027'
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    grade: 'Grade 11',
    bio: '',
    subjectsRaw: '',
    qualificationsRaw: '',
    experience: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Password Match check
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payload
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: activeTab,
      };

      if (activeTab === 'STUDENT') {
        payload.grade = formData.grade;
      } else {
        payload.bio = formData.bio;
        payload.subjects = formData.subjectsRaw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        payload.qualifications = formData.qualificationsRaw
          .split(',')
          .map((q) => q.trim())
          .filter((q) => q.length > 0);
        payload.experience = parseInt(formData.experience) || 0;
      }

      const response = await authService.register(payload);
      
      // Save login state in store
      login(response.user, response.tokens.accessToken);
      
      // Redirect immediately based on role
      if (response.user.role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
      
    } catch (err: unknown) {
      console.error('Registration error:', err);
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data;
        if (data.errors && data.errors.length > 0) {
          setError(data.errors[0].message);
        } else {
          const msg = data.message;
          setError(Array.isArray(msg) ? msg[0].message : (msg || 'Registration failed'));
        }
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create an account</h2>
        <p className="text-slate-500">Join the TUTORLY platform to start learning or teaching.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => { setActiveTab('STUDENT'); setError(''); }}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'STUDENT'
              ? 'border-primary-500 text-primary-655 text-teal-600 border-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Student Registration
          </div>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('TEACHER'); setError(''); }}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'TEACHER'
              ? 'border-primary-500 text-primary-655 text-teal-600 border-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            Teacher Registration
          </div>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-2 border-b pb-2 flex items-center gap-2">
          {activeTab === 'STUDENT' ? (
            <><GraduationCap className="w-5 h-5 text-teal-600" /> Student Profile</>
          ) : (
            <><BookOpen className="w-5 h-5 text-teal-600" /> Teacher Application</>
          )}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">First name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                required
                disabled={isLoading}
                className="input-field pl-9"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Last name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                required
                disabled={isLoading}
                className="input-field pl-9"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                disabled={isLoading}
                className="input-field pl-10"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="tel"
                required
                disabled={isLoading}
                className="input-field pl-10"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                disabled={isLoading}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Conditional Student Fields */}
        {activeTab === 'STUDENT' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Grade / Level</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GraduationCap className="h-5 w-5 text-slate-400" />
              </div>
              <select
                required={activeTab === 'STUDENT'}
                disabled={isLoading}
                className="input-field pl-10 bg-white"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Conditional Teacher Fields */}
        {activeTab === 'TEACHER' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Biography / Bio</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                  required={activeTab === 'TEACHER'}
                  disabled={isLoading}
                  rows={3}
                  className="input-field pl-10 pt-2.5 resize-none"
                  placeholder="Tell students about your teaching methodology..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subjects (comma-separated)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required={activeTab === 'TEACHER'}
                    disabled={isLoading}
                    className="input-field pl-10"
                    placeholder="e.g. Mathematics, Physics"
                    value={formData.subjectsRaw}
                    onChange={(e) => setFormData({...formData, subjectsRaw: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    required={activeTab === 'TEACHER'}
                    disabled={isLoading}
                    className="input-field pl-10"
                    placeholder="e.g. 5"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualifications & Degrees (comma-separated)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Award className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required={activeTab === 'TEACHER'}
                  disabled={isLoading}
                  className="input-field pl-10"
                  placeholder="e.g. BSc in Mathematics, PGDE"
                  value={formData.qualificationsRaw}
                  onChange={(e) => setFormData({...formData, qualificationsRaw: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full btn-primary flex justify-center items-center py-2.5 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {activeTab === 'STUDENT' ? 'Sign Up as Student' : 'Submit Approval Request'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 text-teal-600">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;

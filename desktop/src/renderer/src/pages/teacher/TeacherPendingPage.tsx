import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, ShieldAlert, LogOut, Edit3, CheckCircle2, BookOpen, Award, Briefcase } from 'lucide-react';

const TeacherPendingPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const profile = user?.teacherProfile;
  const status = profile?.approvalStatus || 'PENDING';
  const reason = profile?.rejectionReason;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
      <div className="w-full max-w-2xl bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header styling based on approval status */}
        <div className={`p-8 text-white relative overflow-hidden ${
          status === 'REJECTED' 
            ? 'bg-gradient-to-br from-rose-600 to-red-700' 
            : 'bg-gradient-to-br from-amber-500 to-amber-600'
        }`}>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-white/80 text-xs font-bold tracking-wider uppercase">Teacher Verification</span>
              <h2 className="text-2xl font-bold mt-1 flex items-center gap-2">
                {status === 'REJECTED' ? (
                  <><ShieldAlert className="w-6 h-6 animate-pulse" /> Profile Requires Attention</>
                ) : (
                  <><Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} /> Application Under Review</>
                )}
              </h2>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
        </div>

        {/* Content area */}
        <div className="p-8 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-bold text-slate-800 text-lg">Hello, {user?.firstName}!</h3>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">
              {status === 'REJECTED' ? (
                'Your teacher profile application could not be approved as submitted. Please see the administrator feedback below and update your details.'
              ) : (
                'Thank you for signing up as a teacher on TUTORLY. To ensure high-quality learning, our team reviews all instructor profiles manually. You will receive access to your dashboard as soon as your account is approved.'
              )}
            </p>
          </div>

          {/* Rejection Feedback Alert box */}
          {status === 'REJECTED' && reason && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-rose-900 font-bold text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Rejection Feedback
              </p>
              <p className="text-rose-700 text-sm mt-1 leading-relaxed font-medium">
                "{reason}"
              </p>
            </div>
          )}

          {/* Details submitted display */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted Details</h4>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Experience</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{profile?.experience} years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Subjects</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {profile?.subjects && profile.subjects.length > 0 ? (
                      profile.subjects.map((sub, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-800 text-xs font-medium rounded-full">
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">None listed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Qualifications</p>
                  <ul className="space-y-1 mt-1.5">
                    {profile?.qualifications && profile.qualifications.length > 0 ? (
                      profile.qualifications.map((qual, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" /> {qual}
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 text-xs italic">None listed</li>
                    )}
                  </ul>
                </div>
              </div>

              {profile?.bio && (
                <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Bio</p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{profile.bio}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-2">
            {status === 'REJECTED' ? (
              <button
                onClick={() => navigate('/teacher/profile')}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-2xl text-sm font-semibold transition-colors duration-150 shadow-md shadow-rose-600/10"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile & Resubmit
              </button>
            ) : (
              <div className="flex-1 flex items-center gap-2 justify-center p-3.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                Your application details are currently locked. If you need to make changes, please wait for review or contact support.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherPendingPage;

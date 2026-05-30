import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import HlsPlayer from '../../components/stream/HlsPlayer';
import {
  BookOpen, Video, CreditCard, User, LayoutDashboard,
  PlayCircle, Clock, Award, Calendar, CheckCircle2,
  ChevronRight, Loader2, Star, X, Camera
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
type Tab = 'overview' | 'classes' | 'videos' | 'payments' | 'profile';

// ─── Reusable Badge ───────────────────────────────────────────
const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>
);

// ─── Progress Bar ─────────────────────────────────────────────
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-teal-500' }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
  </div>
);

// ─── Navigation Items ─────────────────────────────────────────
const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'classes', label: 'My Classes', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'videos', label: 'Videos', icon: <Video className="w-4 h-4" /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
];

// ─── Overview Tab ─────────────────────────────────────────────
interface OverviewTabProps {
  user: any;
  enrolledCourses: any[];
  liveStreams: any[];
  onSelectCourse: (course: any) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ user, enrolledCourses, liveStreams, onSelectCourse }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-8 text-white">
        <div className="relative z-10">
          <p className="text-teal-100 text-sm font-medium mb-1">Welcome back,</p>
          <h2 className="text-3xl font-bold mb-2">{user.firstName} {user.lastName}</h2>
          <p className="text-teal-100 text-sm">Keep up your momentum — you're doing great!</p>
        </div>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-12 -right-4 w-56 h-56 bg-white/5 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Courses', value: enrolledCourses.length, icon: <BookOpen className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Hours Learned', value: '28.5', icon: <Clock className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Certificates', value: 1, icon: <Award className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Live Sessions', value: liveStreams.length, icon: <Calendar className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Continue Learning</h3>
        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 text-sm">
            No courses enrolled yet. Go to Browse Classes to find courses!
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledCourses.map((c) => (
              <div 
                key={c.id} 
                onClick={() => onSelectCourse(c)}
                className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.teacherName} · {c.totalLessons} lessons</p>
                  <div className="mt-2"><ProgressBar value={c.progress} /></div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-teal-600">{c.progress}%</p>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors ml-auto mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Live */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Live Classes</h3>
        {liveStreams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 text-sm">
            No live classes scheduled at the moment.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {liveStreams.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <Badge color={s.status === 'LIVE' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}>
                      {s.status === 'LIVE' ? '🔴 Live Now' : '📅 Scheduled'}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm leading-snug">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    by {s.teacher?.firstName} {s.teacher?.lastName}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/live/${s.id}`)}
                  className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Join Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Classes Tab ──────────────────────────────────────────────
interface ClassesTabProps {
  enrolledCourses: any[];
  allCourses: any[];
  onSelectCourse: (course: any) => void;
  onNavigateToPayment: (course: any) => void;
}

const ClassesTab: React.FC<ClassesTabProps> = ({ enrolledCourses, allCourses, onSelectCourse, onNavigateToPayment }) => {
  const navigate = useNavigate();
  const availableClasses = allCourses.filter(
    (c) => c.type === 'SUBSCRIPTION' && !enrolledCourses.some((e) => e.id === c.id)
  );

  return (
    <div className="space-y-10">
      {/* Enrolled Classes Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Enrolled Classes</h2>
          <button 
            onClick={() => navigate('/student/classes')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            + Add Class
          </button>
        </div>
        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500 text-sm">
            You are not enrolled in any classes.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledCourses.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
                <div className="h-36 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white opacity-80" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 leading-snug mb-1 truncate">{c.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{c.teacherName}</p>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Lessons: {c.totalLessons}</span>
                    <span className="font-semibold text-teal-600">{c.progress}%</span>
                  </div>
                  <ProgressBar value={c.progress} />
                  <button 
                    onClick={() => onSelectCourse(c)}
                    className="mt-4 w-full border border-teal-200 text-teal-700 hover:bg-teal-50 text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Classes Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Classes You Can Enroll In</h2>
        {availableClasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500 text-sm">
            No other classes available for enrollment at the moment.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableClasses.map((c) => {
              const teacherName = c.teacher
                ? `${c.teacher.user?.firstName} ${c.teacher.user?.lastName}`
                : 'Unknown Instructor';
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all flex flex-col">
                  <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                    <BookOpen className="w-10 h-10 text-slate-400" />
                    <span className="absolute top-3 right-3 bg-blue-505 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                      Subscription
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{c.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">by {teacherName}</p>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{c.description || 'Interactive online class sessions.'}</p>
                    
                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="font-bold text-teal-700 text-base">Rs. {c.price.toLocaleString()}/mo</span>
                      <button 
                        onClick={() => onNavigateToPayment(c)}
                        className="btn-primary py-1.5 px-4 text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Videos Tab ───────────────────────────────────────────────
interface VideosTabProps {
  enrolledCourses: any[];
  allCourses: any[];
  videos: any[];
  onNavigateToPayment: (course: any) => void;
}

const VideosTab: React.FC<VideosTabProps> = ({ enrolledCourses, allCourses, videos, onNavigateToPayment }) => {
  const [playingVideo, setPlayingVideo] = useState<any | null>(null);

  // Purchased video series (ONE_TIME courses that are enrolled)
  const purchased = allCourses.filter(c => c.type === 'ONE_TIME' && enrolledCourses.some(e => e.id === c.id));
  
  // Available video series (ONE_TIME courses not enrolled yet)
  const available = allCourses.filter(c => c.type === 'ONE_TIME' && !enrolledCourses.some(e => e.id === c.id));

  return (
    <div className="space-y-8">
      {/* Dynamic Class Lectures & Videos */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Class Lectures & Videos</h2>
        {videos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 text-sm">
            No class lectures or uploaded videos are shared with you yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((vid) => (
              <div 
                key={vid.id} 
                onClick={() => setPlayingVideo(vid)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 bg-gradient-to-br from-teal-900 to-slate-900 flex items-center justify-center relative">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                    {vid.course && (
                      <span className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {vid.course.title}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {vid.duration || 'N/A'}
                    </span>
                  </div>
                  <div className="p-4 space-y-1 text-left">
                    <p className="font-semibold text-slate-900 text-sm leading-snug truncate">{vid.title}</p>
                    <p className="text-xs text-slate-500">by {vid.teacher?.firstName} {vid.teacher?.lastName}</p>
                    {vid.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">{vid.description}</p>
                    )}
                  </div>
                </div>
                <div className="p-4 pt-0 text-left">
                  <button className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 group-hover:bg-teal-50 group-hover:border-teal-200 group-hover:text-teal-700 py-2 rounded-lg text-slate-600 transition-colors text-center">
                    Watch Lecture
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchased */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">My Purchased Videos</h2>
        {purchased.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-sm">
            You haven't purchased any video series yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchased.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center relative">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900 text-sm leading-snug truncate">{v.title}</p>
                  <p className="text-xs text-slate-500">by {v.teacher?.user?.firstName} {v.teacher?.user?.lastName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available to Buy */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Explore Video Series to Buy</h2>
        {available.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-sm">
            No other video series available for purchase at the moment.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {available.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all flex flex-col">
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                  <BookOpen className="w-12 h-12 text-slate-400" />
                  <span className="absolute top-3 right-3 bg-teal-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Video Series
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{v.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">by {v.teacher?.user?.firstName} {v.teacher?.user?.lastName}</p>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">{v.description || 'Complete pre-recorded video lessons.'}</p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="font-bold text-teal-700 text-base">Rs. {v.price.toLocaleString()}</span>
                    <button 
                      onClick={() => onNavigateToPayment(v)}
                      className="btn-primary py-1.5 px-4 text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Now Playing</span>
                <h3 className="text-base font-bold truncate mt-0.5">{playingVideo.title}</h3>
              </div>
              <button 
                onClick={() => setPlayingVideo(null)} 
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-black flex items-center justify-center">
              <video 
                src={playingVideo.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="p-6 bg-slate-950 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Uploaded by: <strong className="text-slate-200">{playingVideo.teacher?.firstName} {playingVideo.teacher?.lastName}</strong></span>
                {playingVideo.course && <span className="bg-teal-900/50 text-teal-400 px-2 py-0.5 rounded font-semibold">{playingVideo.course.title}</span>}
              </div>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {playingVideo.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Payments Tab ─────────────────────────────────────────────
interface PaymentsTabProps {
  payments: any[];
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ payments }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
      <Badge color="bg-slate-100 text-slate-600">{payments.length} transactions</Badge>
    </div>
    {payments.length === 0 ? (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500 text-sm">
        No payment history found.
      </div>
    ) : (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left p-4 font-semibold text-slate-600">Description</th>
                <th className="text-left p-4 font-semibold text-slate-600">Date</th>
                <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                <th className="text-right p-4 font-semibold text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{p.metadata?.courseName || 'Class Enrollment'}</td>
                  <td className="p-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                  <td className="p-4">
                    <Badge color={p.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> {p.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={3} className="p-4 font-semibold text-slate-700">Total Spent</td>
                <td className="p-4 text-right font-bold text-teal-700 text-base">
                  Rs. {payments.reduce((s, p) => p.status === 'SUCCESS' ? s + p.amount : s, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )}
  </div>
);

// ─── Profile Tab ──────────────────────────────────────────────
interface ProfileTabProps {
  user: any;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user }) => {
  const [form, setForm] = useState({ 
    firstName: user.firstName || '', 
    lastName: user.lastName || '', 
    phone: user.phone || '', 
    grade: user.studentProfile?.grade || '' 
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Profile image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      grade: user.studentProfile?.grade || ''
    });
    setImagePreview(user.avatar || null);
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('phone', form.phone);
      formData.append('grade', form.grade);

      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const res = await apiClient.put('/users/me/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = res.data.data;

      // Synchronize in Zustand store so updates propagate to overview & header
      updateUser({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        studentProfile: updatedUser.studentProfile
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full border border-slate-100 bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden shadow-inner">
            {imagePreview ? (
              <img src={imagePreview} alt="Student Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-semibold">Change</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
        <div>
          <p className="font-bold text-slate-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-slate-800">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
            <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
            <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
          <input className="input-field" placeholder="+94 77 123 4567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade / Level</label>
          <input className="input-field" placeholder="e.g. A/L 2025" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-70">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Course Detail Viewer Component ───────────────────────────
interface CourseDetailViewProps {
  course: any;
  onBack: () => void;
}

const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, onBack }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await apiClient.get(`/courses/${course.id}/lessons`);
        const fetchedLessons = res.data.data ?? [];
        setLessons(fetchedLessons);
        if (fetchedLessons.length > 0) {
          setActiveLesson(fetchedLessons[0]);
        }
      } catch (err) {
        console.error('Failed to fetch lessons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [course.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center"
        >
          &larr; Back to Dashboard
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{course.title}</h2>
          <p className="text-xs text-slate-500">Instructor: {course.teacherName}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Side: Video Player */}
        <div className="space-y-4">
          {activeLesson ? (
            <div className="bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <div className="relative">
                <HlsPlayer src={activeLesson.hlsUrl || activeLesson.videoUrl} isLive={false} />
              </div>
              <div className="p-5 bg-white border-t border-slate-100 text-left">
                <h3 className="font-bold text-slate-900 text-lg">{activeLesson.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{activeLesson.description || 'No description available.'}</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3">
              {loading ? (
                <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
              ) : (
                <p className="text-slate-400 font-medium">No lessons available in this course.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Lessons List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[520px]">
          <div className="px-4 py-3 border-b border-slate-100 text-left">
            <span className="font-bold text-slate-800 text-sm">Course Content ({lessons.length} lessons)</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-3 text-left ${activeLesson?.id === lesson.id ? 'bg-teal-50 border border-teal-100/50' : ''}`}
              >
                <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0 mt-0.5">
                  {lesson.order || 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{Math.floor(lesson.duration / 60)} mins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab;
  const activeTab = (tabParam && ['overview', 'classes', 'videos', 'payments', 'profile'].includes(tabParam)) ? tabParam : 'overview';

  const setActiveTab = (newTab: Tab) => {
    setSearchParams({ tab: newTab });
  };
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  const navigate = useNavigate();
  const u = user ?? { firstName: 'Student', lastName: '', email: '' };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch enrollments
      const enrollmentsRes = await apiClient.get('/enrollments/my');
      const enrolls = enrollmentsRes.data.data || [];
      const mappedEnrolled = enrolls.map((e: any, idx: number) => ({
        id: e.course.id,
        title: e.course.title,
        teacherName: `${e.course.teacher.user.firstName} ${e.course.teacher.user.lastName}`,
        progress: idx === 0 ? 72 : 40, // mock progress
        totalLessons: e.course._count.lessons,
        completedLessons: idx === 0 ? 35 : 14,
        thumbnail: e.course.thumbnail
      }));
      setEnrolledCourses(mappedEnrolled);

      // Fetch payments
      const paymentsRes = await apiClient.get('/payments/my');
      setPayments(paymentsRes.data.data || []);

      // Fetch all courses
      const coursesRes = await apiClient.get('/courses');
      setAllCourses(coursesRes.data.data || []);

      // Fetch student videos
      const videosRes = await apiClient.get('/videos').catch(() => ({ data: { data: [] } }));
      setVideos(videosRes.data.data || []);

      // Fetch active/scheduled streams
      const streamsRes = await apiClient.get('/streams');
      const streams = streamsRes.data.data || [];
      const enrolledCourseIds = mappedEnrolled.map((c: any) => c.id);
      const filteredStreams = streams.filter((s: any) => {
        const isLiveOrScheduled = s.status === 'LIVE' || s.status === 'SCHEDULED';
        if (!isLiveOrScheduled) return false;
        if (s.courseId) {
          return enrolledCourseIds.includes(s.courseId);
        }
        return true;
      });
      setLiveStreams(filteredStreams);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    setSelectedCourse(null);
  }, [activeTab]);

  const onNavigateToPayment = (course: any) => {
    navigate('/student/payment', {
      state: {
        courseId: course.id,
        courseTitle: course.title,
        price: course.price,
        type: course.type,
        teacherName: `${course.teacher?.user?.firstName} ${course.teacher?.user?.lastName}`
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  // Render course details viewer directly if selected
  if (selectedCourse) {
    return (
      <CourseDetailView 
        course={selectedCourse} 
        onBack={() => {
          setSelectedCourse(null);
          fetchDashboardData(); // Refresh enrollments in case of updates
        }}
      />
    );
  }

  return (
    <div className="flex h-full gap-0">
      {/* Side Nav */}
      <aside className="w-52 shrink-0 pr-6">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick stats */}
        <div className="mt-8 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-teal-700">Learning Streak</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">7 Days 🔥</p>
          <p className="text-xs text-teal-600 mt-0.5">Keep it up!</p>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === 'overview' && (
          <OverviewTab 
            user={u} 
            enrolledCourses={enrolledCourses} 
            liveStreams={liveStreams} 
            onSelectCourse={setSelectedCourse} 
          />
        )}
        {activeTab === 'classes' && (
          <ClassesTab 
            enrolledCourses={enrolledCourses} 
            allCourses={allCourses}
            onSelectCourse={setSelectedCourse} 
            onNavigateToPayment={onNavigateToPayment}
          />
        )}
        {activeTab === 'videos' && (
          <VideosTab 
            enrolledCourses={enrolledCourses} 
            allCourses={allCourses} 
            videos={videos}
            onNavigateToPayment={onNavigateToPayment} 
          />
        )}
        {activeTab === 'payments' && <PaymentsTab payments={payments} />}
        {activeTab === 'profile' && <ProfileTab user={u} />}
      </div>
    </div>
  );
};

export default StudentDashboard;

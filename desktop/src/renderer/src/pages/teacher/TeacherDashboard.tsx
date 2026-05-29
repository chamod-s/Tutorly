import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, BookOpen, Radio, Video, DollarSign, Users, Plus, Upload, Play, TrendingUp, Star, ChevronRight, Check, Loader2, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import { LessonManagerModal } from '../../components/teacher/LessonManagerModal';
import { CourseForm, DeleteModal, EMPTY } from './TeacherClasses';

type Tab = 'overview' | 'classes' | 'live' | 'videos' | 'earnings' | 'students';

const STUDENTS = [
  { id: '1', name: 'Kasun Silva', email: 'kasun@email.com', course: 'A/L Mathematics', progress: 72, joined: '2026-04-01' },
  { id: '2', name: 'Dilini Perera', email: 'dilini@email.com', course: 'Python Programming', progress: 45, joined: '2026-04-15' },
  { id: '3', name: 'Nimal Fernando', email: 'nimal@email.com', course: 'A/L Mathematics', progress: 91, joined: '2026-03-20' },
  { id: '4', name: 'Sachini Madushani', email: 'sachini@email.com', course: 'Python Programming', progress: 28, joined: '2026-05-01' },
];

const EARNINGS = [
  { month: 'Jan', amount: 85000 }, { month: 'Feb', amount: 120000 },
  { month: 'Mar', amount: 98000 }, { month: 'Apr', amount: 145000 },
  { month: 'May', amount: 167000 },
];

const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>
);

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5">
    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${value}%` }} />
  </div>
);

// ── Overview ──────────────────────────────────────────────────
const Overview: React.FC<{ name: string; onTab: (t: Tab) => void; courses: any[]; liveStreams: any[] }> = ({ name, onTab, courses, liveStreams }) => {
  const activeCoursesCount = courses.filter(c => c.isPublished).length;
  const totalStudentsCount = courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + (c._count?.enrollments || 0) * c.price, 0);

  const upcomingStreams = liveStreams.filter(s => s.status === 'SCHEDULED' || s.status === 'LIVE');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white">
        <div className="relative z-10">
          <p className="text-slate-400 text-sm mb-1">Welcome back,</p>
          <h2 className="text-3xl font-bold mb-3">{name} 👋</h2>
          <div className="flex gap-3">
            <button onClick={() => onTab('live')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Radio className="w-4 h-4" /> Go Live Now
            </button>
            <button onClick={() => onTab('classes')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> New Class
            </button>
          </div>
        </div>
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: totalStudentsCount.toLocaleString(), icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { label: 'Avg Rating', value: '4.8 ★', icon: <Star className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Active Courses', value: activeCoursesCount.toString(), icon: <BookOpen className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-505 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-900">My Courses</h3>
            <button onClick={() => onTab('classes')} className="text-sm text-teal-600 font-medium flex items-center gap-1">All courses <ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No classes created yet.</p>
            ) : (
              courses.filter(c => c.isPublished).map(c => {
                const students = c._count?.enrollments || 0;
                const revenue = students * c.price;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="text-xs text-slate-500">{students} students</p>
                    </div>
                    <span className="text-sm font-bold text-teal-700 shrink-0">Rs. {revenue.toLocaleString()}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-900">Revenue Trend</h3>
            <Badge color="bg-green-50 text-green-600"><TrendingUp className="w-3 h-3 inline mr-1" />+15%</Badge>
          </div>
          <div className="flex items-end gap-3 h-32">
            {EARNINGS.map(e => {
              const max = Math.max(...EARNINGS.map(x => x.amount));
              const h = Math.round((e.amount / max) * 100);
              return (
                <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{(e.amount/1000).toFixed(0)}k</span>
                  <div className="w-full bg-teal-500 rounded-t-md transition-all" style={{ height: `${h}%` }} />
                  <span className="text-xs text-slate-400">{e.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Live Sessions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-5">Upcoming Live Sessions</h3>
        {upcomingStreams.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No live sessions scheduled.</p>
        ) : (
          <div className="space-y-4">
            {upcomingStreams.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.status === 'LIVE' ? 'bg-red-100 animate-pulse text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }) : 'As Scheduled'}
                    </p>
                  </div>
                </div>
                <button onClick={() => onTab('live')} className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm text-slate-700">
                  {s.status === 'LIVE' ? 'View stream' : 'Manage stream'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Classes Tab ───────────────────────────────────────────────
interface ClassesTabProps {
  courses: any[];
  fetchMyCourses: () => void;
  loading: boolean;
}

const ClassesTab: React.FC<ClassesTabProps> = ({ courses, fetchMyCourses, loading }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manageCourse, setManageCourse] = useState<{ id: string; title: string } | null>(null);

  const handleCreate = async (data: any) => {
    try {
      await apiClient.post('/courses', {
        title: data.title,
        shortDesc: data.shortDesc,
        description: data.description,
        price: data.price,
        monthlyPrice: data.type === 'SUBSCRIPTION' ? data.price : undefined,
        type: data.type,
        level: data.level,
        language: data.language,
        category: data.category,
        tags: data.tags,
        isPublished: true, // Default to published so it instantly appears for students
      });
      fetchMyCourses();
      setShowCreate(false);
    } catch (err) {
      console.error('Failed to create course:', err);
    }
  };

  const handleEdit = async (data: any) => {
    try {
      await apiClient.put(`/courses/${editId}`, {
        title: data.title,
        shortDesc: data.shortDesc,
        description: data.description,
        price: data.price,
        monthlyPrice: data.type === 'SUBSCRIPTION' ? data.price : undefined,
        type: data.type,
        level: data.level,
        language: data.language,
        category: data.category,
        tags: data.tags,
      });
      fetchMyCourses();
      setEditId(null);
    } catch (err) {
      console.error('Failed to update course:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/courses/${deleteId}`);
      fetchMyCourses();
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const togglePublish = async (id: string) => {
    try {
      await apiClient.patch(`/courses/${id}/publish`);
      fetchMyCourses();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const editingCourse = courses.find(c => c.id === editId);
  const deletingCourse = courses.find(c => c.id === deleteId);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showCreate && (
        <CourseForm 
          title="Create New Class" 
          initial={EMPTY} 
          categoriesList={courses.map(c => c.category).filter((c): c is string => !!c)}
          onSave={handleCreate} 
          onCancel={() => setShowCreate(false)} 
        />
      )}
      {editId && editingCourse && (
        <CourseForm 
          title="Edit Class" 
          categoriesList={courses.map(c => c.category).filter((c): c is string => !!c)}
          initial={{
            title: editingCourse.title || '',
            shortDesc: editingCourse.shortDesc || '',
            description: editingCourse.description || '',
            price: editingCourse.price || 0,
            type: editingCourse.type || 'SUBSCRIPTION',
            level: editingCourse.level || 'BEGINNER',
            language: editingCourse.language || 'Sinhala',
            category: editingCourse.category || '',
            tags: editingCourse.tags || [],
          } as any} 
          onSave={handleEdit} 
          onCancel={() => setEditId(null)} 
        />
      )}
      {deleteId && deletingCourse && <DeleteModal title={deletingCourse.title} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Manage Classes</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-500">No classes yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 btn-primary px-6 py-2 text-sm">Create your first class</button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(c => {
            const lessonsCount = c._count?.lessons ?? 0;
            const enrollmentsCount = c._count?.enrollments ?? 0;
            const revenue = enrollmentsCount * c.price;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-slate-900 truncate text-base">{c.title}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.isPublished ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>{c.isPublished ? 'Published' : 'Draft'}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {c.type === 'SUBSCRIPTION' ? 'Subscription' : 'One-Time'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-505">{enrollmentsCount} students · {lessonsCount} lessons · Category: {c.category || 'None'}</p>
                  {revenue > 0 && <p className="text-sm font-semibold text-teal-700 mt-1">Rs. {revenue.toLocaleString()} earned</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => togglePublish(c.id)}
                    className={`text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors ${
                      c.isPublished ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                    }`}>
                    {c.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => setEditId(c.id)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Edit</button>
                  <button onClick={() => setManageCourse({ id: c.id, title: c.title })} className="text-xs px-3 py-1.5 border border-teal-200 rounded-lg hover:bg-teal-50 text-teal-700 font-medium">Manage</button>
                  <button onClick={() => setDeleteId(c.id)} className="text-xs px-3 py-1.5 border border-red-100 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 font-medium">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {manageCourse && (
        <LessonManagerModal
          courseId={manageCourse.id}
          courseTitle={manageCourse.title}
          onClose={() => setManageCourse(null)}
        />
      )}
    </div>
  );
};

const LiveTab: React.FC<{ courses: any[]; fetchDashboardData: () => void }> = ({ courses, fetchDashboardData }) => {
  const [isLive, setIsLive] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  // Scheduling Form State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default course ID
  useEffect(() => {
    if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [courses]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time || !courseId) {
      setError('Please fill in all scheduling fields.');
      return;
    }

    try {
      setScheduling(true);
      setError(null);
      
      const scheduledAt = new Date(`${date}T${time}`);

      await apiClient.post('/streams', {
        title: title.trim(),
        courseId,
        scheduledAt,
        isPublic: false,
      });

      setScheduled(true);
      setTitle('');
      setDate('');
      setTime('');
      fetchDashboardData();
      setTimeout(() => setScheduled(false), 3000);
    } catch (err: any) {
      console.error('Failed to schedule stream:', err);
      setError(err.response?.data?.message || 'Failed to schedule live session.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900">Live Sessions</h2>

      <div className={`rounded-2xl border-2 p-6 text-center transition-all ${isLive ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 ${isLive ? 'bg-red-100 animate-pulse' : 'bg-slate-100'}`}>
          <Radio className={`w-10 h-10 ${isLive ? 'text-red-600' : 'text-slate-500'}`} />
        </div>
        {isLive ? (
          <>
            <p className="text-xl font-bold text-red-700 mb-1">🔴 You are LIVE</p>
            <p className="text-sm text-slate-500 mb-6">42 students watching</p>
            <button onClick={() => setIsLive(false)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
              End Stream
            </button>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-slate-900 mb-1">Start a Live Class</p>
            <p className="text-sm text-slate-500 mb-6">Your students will be notified immediately</p>
            <button onClick={() => setIsLive(true)} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors">
              <Radio className="w-5 h-5" /> Go Live Now
            </button>
          </>
        )}
      </div>

      <form onSubmit={handleSchedule} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Schedule a Session</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Title *</label>
            <input 
              required 
              className="input-field" 
              placeholder="e.g. Calculus — Limits" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Associated Class *</label>
            <select 
              className="input-field" 
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
            >
              {courses.length === 0 ? (
                <option value="">No classes available</option>
              ) : (
                courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
            <input 
              type="date" 
              required 
              className="input-field" 
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Time *</label>
            <input 
              type="time" 
              required 
              className="input-field" 
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button 
          type="submit" 
          disabled={scheduling}
          className="btn-primary px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {scheduling ? 'Scheduling Session...' : 'Schedule Session'}
        </button>
        {scheduled && <p className="text-sm text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> Session scheduled! Students will be notified.</p>}
      </form>
    </div>
  );
};

interface VideoUploadModalProps {
  file: File;
  courses: any[];
  onClose: () => void;
  onUpload: (metadata: { title: string; description: string; courseId: string; status: string }) => Promise<void>;
  progress: number;
  uploading: boolean;
  error: string | null;
}

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  file,
  courses,
  onClose,
  onUpload,
  progress,
  uploading,
  error,
}) => {
  const [title, setTitle] = useState(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('PUBLISHED');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload({ title, description, courseId, status });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-semibold text-teal-600 tracking-wider uppercase">Video Library</span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Upload Video Details</h3>
          </div>
          <button 
            type="button"
            disabled={uploading}
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
            <Video className="w-5 h-5 text-slate-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-500">Selected File</p>
              <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Video Title *</label>
            <input 
              type="text" 
              required 
              disabled={uploading}
              className="input-field w-full bg-white border border-slate-200" 
              placeholder="e.g. Lesson 1: Introduction"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <textarea 
              rows={3} 
              disabled={uploading}
              className="input-field w-full bg-white border border-slate-200 resize-none py-2" 
              placeholder="Provide a brief summary of what this video covers..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Associated Class</label>
              <select 
                disabled={uploading}
                className="input-field w-full bg-white border border-slate-200"
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
              >
                <option value="">Public (Visible to All)</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Visibility Status</label>
              <select 
                disabled={uploading}
                className="input-field w-full bg-white border border-slate-200"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}

          {uploading ? (
            <div className="space-y-3 pt-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" /> Uploading video file...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                disabled={uploading}
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary px-6 py-2 text-sm font-semibold rounded-xl"
              >
                Start Upload
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const VideosTab: React.FC<{ videos: any[]; courses: any[]; fetchDashboardData: () => void }> = ({ videos, courses, fetchDashboardData }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (metadata: { title: string; description: string; courseId: string; status: string }) => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', metadata.title);
      formData.append('description', metadata.description);
      formData.append('courseId', metadata.courseId);
      formData.append('status', metadata.status);

      await apiClient.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percent);
        },
      });

      fetchDashboardData();
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Failed to upload video:', err);
      setError(err.response?.data?.message || 'Failed to upload video file.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Video Library</h2>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="video/*" 
        className="hidden" 
      />

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={async e => { 
          e.preventDefault(); 
          setDragging(false); 
          const file = e.dataTransfer.files?.[0];
          if (file) {
            if (!file.type.startsWith('video/')) {
              setError('Please select a valid video file.');
              return;
            }
            setSelectedFile(file);
          }
        }}
        onClick={triggerFileSelect}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          uploading ? 'border-teal-400 bg-teal-50/50 cursor-wait' : dragging ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-300 hover:bg-slate-50'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
            <p className="font-semibold text-slate-700">Uploading video... {progress}%</p>
            <div className="w-48 bg-slate-200 h-1.5 rounded-full mx-auto overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Drop video files here or click to upload</p>
            <p className="text-sm text-slate-400 mt-1">MP4, MOV — up to 100MB</p>
            <button type="button" className="mt-4 btn-primary px-6 py-2 text-sm">Choose Files</button>
          </>
        )}
      </div>

      {error && !selectedFile && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">Uploaded Videos</div>
        <div className="divide-y divide-slate-50">
          {videos.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">No uploaded videos yet.</p>
          ) : (
            videos.map(v => (
              <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{v.title}</p>
                  <p className="text-xs text-slate-505">
                    Duration: {v.duration || 'N/A'}
                    {v.course && <span className="ml-2 bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-[10px] font-semibold">{v.course.title}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                    {v.status || 'PUBLISHED'}
                  </span>
                  {v.views > 0 && <p className="text-xs text-slate-400 mt-1">{v.views} views</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedFile && (
        <VideoUploadModal 
          file={selectedFile}
          courses={courses}
          onClose={() => setSelectedFile(null)}
          onUpload={handleUploadSubmit}
          progress={progress}
          uploading={uploading}
          error={error}
        />
      )}
    </div>
  );
};

// ── Earnings Tab ──────────────────────────────────────────────
const EarningsTab: React.FC<{ courses: any[] }> = ({ courses }) => {
  const total = EARNINGS.reduce((s, e) => s + e.amount, 0);
  const max = Math.max(...EARNINGS.map(e => e.amount));

  // Calculate dynamic course revenues
  const courseRevenues = courses.map(c => ({
    id: c.id,
    title: c.title,
    revenue: (c._count?.enrollments || 0) * c.price
  })).filter(c => c.revenue > 0);

  const maxCourseRevenue = Math.max(...courseRevenues.map(c => c.revenue), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Earnings Analytics</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Earned', value: `Rs. ${(total / 1000).toFixed(0)}k` },
          { label: 'This Month', value: 'Rs. 167k' },
          { label: 'Pending Payout', value: 'Rs. 45k' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm text-slate-505 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-6">Monthly Revenue</h3>
        <div className="flex items-end gap-4 h-40">
          {EARNINGS.map(e => (
            <div key={e.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-teal-700">Rs. {(e.amount / 1000).toFixed(0)}k</span>
              <div className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg" style={{ height: `${Math.round((e.amount / max) * 140)}px` }} />
              <span className="text-xs text-slate-400 font-medium">{e.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Revenue by Course</h3>
        <div className="space-y-4">
          {courseRevenues.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No class earnings recorded yet.</p>
          ) : (
            courseRevenues.map(c => (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 truncate">{c.title}</span>
                  <span className="font-bold text-teal-700 shrink-0 ml-4">Rs. {c.revenue.toLocaleString()}</span>
                </div>
                <ProgressBar value={Math.round((c.revenue / maxCourseRevenue) * 100)} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Students Tab ──────────────────────────────────────────────
const StudentsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
      <Badge color="bg-slate-100 text-slate-600">{STUDENTS.length} students</Badge>
    </div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Student', 'Course', 'Progress', 'Joined', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {STUDENTS.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">{s.name[0]}</div>
                    <div><p className="font-semibold text-slate-900">{s.name}</p><p className="text-xs text-slate-400">{s.email}</p></div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600 max-w-xs truncate">{s.course}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20"><ProgressBar value={s.progress} /></div>
                    <span className="text-xs font-medium text-teal-700">{s.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-500">{new Date(s.joined).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</td>
                <td className="px-5 py-4"><button className="text-xs text-teal-600 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-50">Message</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────
const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',   icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'classes',  label: 'Classes',    icon: <BookOpen className="w-4 h-4" /> },
  { id: 'live',     label: 'Go Live',    icon: <Radio className="w-4 h-4" /> },
  { id: 'videos',   label: 'Videos',     icon: <Video className="w-4 h-4" /> },
  { id: 'earnings', label: 'Earnings',   icon: <DollarSign className="w-4 h-4" /> },
  { id: 'students', label: 'Students',   icon: <Users className="w-4 h-4" /> },
];

const TeacherDashboard: React.FC = () => {
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState<Tab>('overview');
  const name = user ? `${user.firstName} ${user.lastName}` : 'Teacher';

  const [courses, setCourses] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const [coursesRes, streamsRes, videosRes] = await Promise.all([
        apiClient.get('/courses/my/courses'),
        apiClient.get('/streams/my'),
        apiClient.get('/videos/my').catch(() => ({ data: { data: [] } })),
      ]);
      setCourses(coursesRes.data.data || []);
      setLiveStreams(streamsRes.data.data || []);
      setVideos(videosRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex h-full gap-0">
      <aside className="w-52 shrink-0 pr-6">
        <nav className="space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === n.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              {n.icon}<span>{n.label}</span>
              {n.id === 'live' && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          ))}
        </nav>
        <div className="mt-8 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white">
          <p className="text-xs text-slate-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold">
            {courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)}
          </p>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {tab === 'overview' && <Overview name={name} onTab={setTab} courses={courses} liveStreams={liveStreams} />}
        {tab === 'classes'  && <ClassesTab courses={courses} fetchMyCourses={fetchDashboardData} loading={loadingDashboard} />}
        {tab === 'live'     && <LiveTab courses={courses} fetchDashboardData={fetchDashboardData} />}
        {tab === 'videos'   && <VideosTab videos={videos} courses={courses} fetchDashboardData={fetchDashboardData} />}
        {tab === 'earnings' && <EarningsTab courses={courses} />}
        {tab === 'students' && <StudentsTab />}
      </div>
    </div>
  );
};

export default TeacherDashboard;

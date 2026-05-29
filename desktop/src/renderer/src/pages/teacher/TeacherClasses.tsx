import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, X, Check, DollarSign, Tag, Globe, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { LessonManagerModal } from '../../components/teacher/LessonManagerModal';

type CourseType = 'SUBSCRIPTION' | 'ONE_TIME';
type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface Course {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  price: number;
  monthlyPrice?: number;
  type: CourseType;
  level: CourseLevel;
  language: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

export const EMPTY = {
  title: '',
  shortDesc: '',
  description: '',
  price: 0,
  monthlyPrice: undefined,
  type: 'SUBSCRIPTION' as CourseType,
  level: 'BEGINNER' as CourseLevel,
  language: 'Sinhala',
  category: '',
  tags: [] as string[],
};

const Badge: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{text}</span>
);

const LEVEL_COLORS: Record<CourseLevel, string> = {
  BEGINNER: 'bg-green-50 text-green-700',
  INTERMEDIATE: 'bg-blue-50 text-blue-700',
  ADVANCED: 'bg-purple-50 text-purple-700',
};

// ── Course Form ───────────────────────────────────────────────
export const CourseForm: React.FC<{
  initial: typeof EMPTY;
  onSave: (data: typeof EMPTY) => void;
  onCancel: () => void;
  title: string;
  categoriesList?: string[];
}> = ({ initial, onSave, onCancel, title, categoriesList = [] }) => {
  const [form, setForm] = useState(initial);
  const [tagInput, setTagInput] = useState('');
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const DEFAULT_CATEGORIES = ['Mathematics', 'Science', 'Programming', 'Languages', 'Design'];
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categoriesList]));
  
  const isCustomCategory = form.category && !allCategories.includes(form.category);
  const [useCustom, setUseCustom] = useState(isCustomCategory);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Basic */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Title *</label>
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. A/L Chemistry Complete" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
            <input className="input-field" value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} placeholder="One-line summary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Description</label>
            <textarea rows={3} className="input-field resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Pricing */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-4">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pricing</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subscription Type</label>
                <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="SUBSCRIPTION">Monthly Subscription</option>
                  <option value="ONE_TIME">One-Time Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{form.type === 'SUBSCRIPTION' ? 'Monthly Price (LKR)' : 'Price (LKR)'}</label>
                <input type="number" className="input-field" value={form.price} onChange={e => set('price', Number(e.target.value))} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Class Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
              <select className="input-field" value={form.level} onChange={e => set('level', e.target.value)}>
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
              <select className="input-field" value={form.language} onChange={e => set('language', e.target.value)}>
                {['Sinhala', 'English', 'Tamil'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              {useCustom ? (
                <div className="flex gap-2">
                  <input className="input-field flex-1" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Type custom category..." />
                  <button type="button" onClick={() => { setUseCustom(false); set('category', allCategories[0] || 'Mathematics'); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs">Select</button>
                </div>
              ) : (
                <select 
                  className="input-field" 
                  value={form.category} 
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setUseCustom(true);
                      set('category', '');
                    } else {
                      set('category', e.target.value);
                    }
                  }}
                >
                  <option value="" disabled>Select a category</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">+ Add Custom Category...</option>
                </select>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-full">
                  {t} <button type="button" onClick={() => set('tags', form.tags.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Add tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput(''); } }} />
              <button type="button" onClick={() => { if (tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput(''); } }}
                className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Add</button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={() => onSave(form)} disabled={!form.title || form.price <= 0}
            className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save Course
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm ────────────────────────────────────────────
export const DeleteModal: React.FC<{ title: string; onConfirm: () => void; onCancel: () => void }> = ({ title, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-500" /></div>
      <h3 className="font-bold text-slate-900 text-center mb-2">Delete Course?</h3>
      <p className="text-sm text-slate-500 text-center mb-6">"{title}" will be permanently deleted along with all its lessons and enrollments.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-slate-200 py-2 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm hover:bg-red-700 font-semibold">Delete</button>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────
const TeacherClasses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manageCourse, setManageCourse] = useState<{ id: string; title: string } | null>(null);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/courses/my/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const handleCreate = async (data: typeof EMPTY) => {
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

  const handleEdit = async (data: typeof EMPTY) => {
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
    <div className="space-y-6">
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
          } as typeof EMPTY} 
          onSave={handleEdit} 
          onCancel={() => setEditId(null)} 
        />
      )}
      {deleteId && deletingCourse && <DeleteModal title={deletingCourse.title} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
          <p className="text-slate-500 text-sm mt-1">{courses.length} total · {courses.filter(c => c.isPublished).length} published</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-500">No classes yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 btn-primary px-6 py-2 text-sm">Create your first class</button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(c => {
            const lessonsCount = c._count?.lessons ?? 0;
            const enrollmentsCount = c._count?.enrollments ?? 0;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{c.title}</h3>
                        <Badge text={c.isPublished ? 'Published' : 'Draft'} color={c.isPublished ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-505'} />
                        <Badge text={c.type === 'SUBSCRIPTION' ? 'Subscription' : 'One-Time'} color="bg-blue-50 text-blue-700" />
                        <Badge text={c.level} color={LEVEL_COLORS[c.level]} />
                      </div>
                      <p className="text-sm text-slate-505">{c.shortDesc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-teal-700">Rs. {c.price.toLocaleString()}</p>
                      {c.type === 'SUBSCRIPTION' && <p className="text-xs text-slate-400">/month</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" />{c.language}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-slate-400" />{lessonsCount} lessons</span>
                    <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-400" />{c.category}</span>
                    {enrollmentsCount > 0 && <span className="font-semibold text-teal-700">{enrollmentsCount} students enrolled</span>}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-50">
                    <button onClick={() => togglePublish(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${c.isPublished ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-teal-200 text-teal-700 hover:bg-teal-50'}`}>
                      {c.isPublished ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                    </button>
                    <button onClick={() => setEditId(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setManageCourse({ id: c.id, title: c.title })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors">
                      <BookOpen className="w-3.5 h-3.5" /> Manage Lessons
                    </button>
                    <button onClick={() => setDeleteId(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
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

export default TeacherClasses;

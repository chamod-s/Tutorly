import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, X, Check, Calendar, DollarSign, Tag, Globe } from 'lucide-react';

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
  totalLessons: number;
  enrollments: number;
  schedules: string[];
}

const MOCK: Course[] = [
  { id: '1', title: 'A/L Mathematics Complete', shortDesc: 'Master A/L Math', description: 'Complete A/L mathematics course.', price: 4500, monthlyPrice: 4500, type: 'SUBSCRIPTION', level: 'ADVANCED', language: 'Sinhala', category: 'Mathematics', tags: ['a-level', 'maths'], isPublished: true, totalLessons: 48, enrollments: 312, schedules: ['Mon 6:00 PM', 'Wed 6:00 PM', 'Sat 9:00 AM'] },
  { id: '2', title: 'Python Zero to Hero', shortDesc: 'Learn Python from scratch', description: 'Full Python programming course.', price: 2990, type: 'ONE_TIME', level: 'BEGINNER', language: 'English', category: 'Programming', tags: ['python', 'beginner'], isPublished: true, totalLessons: 36, enrollments: 187, schedules: ['Tue 5:00 PM', 'Thu 5:00 PM'] },
  { id: '3', title: 'Physics for O/L', shortDesc: 'O/L Physics complete', description: 'Covers all O/L physics topics.', price: 3200, monthlyPrice: 3200, type: 'SUBSCRIPTION', level: 'INTERMEDIATE', language: 'Sinhala', category: 'Science', tags: ['o-level', 'physics'], isPublished: false, totalLessons: 30, enrollments: 0, schedules: [] },
];

const EMPTY: Omit<Course, 'id' | 'isPublished' | 'totalLessons' | 'enrollments'> = {
  title: '', shortDesc: '', description: '', price: 0, monthlyPrice: undefined, type: 'SUBSCRIPTION',
  level: 'BEGINNER', language: 'Sinhala', category: '', tags: [], schedules: [],
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
const CourseForm: React.FC<{
  initial: typeof EMPTY;
  onSave: (data: typeof EMPTY) => void;
  onCancel: () => void;
  title: string;
}> = ({ initial, onSave, onCancel, title }) => {
  const [form, setForm] = useState(initial);
  const [tagInput, setTagInput] = useState('');
  const [schedInput, setSchedInput] = useState('');
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Basic */}
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Course Title *</label>
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. A/L Chemistry Complete" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
            <input className="input-field" value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} placeholder="One-line summary" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Full Description</label>
            <textarea rows={3} className="input-field resize-none" value={form.description} onChange={e => set('description', e.target.value)} /></div>

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
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
              <select className="input-field" value={form.level} onChange={e => set('level', e.target.value)}>
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
              <select className="input-field" value={form.language} onChange={e => set('language', e.target.value)}>
                {['Sinhala', 'English', 'Tamil'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <input className="input-field" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Science" /></div>
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

          {/* Schedules */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Class Schedule</label>
            <div className="space-y-2 mb-2">
              {form.schedules.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                  <span className="text-slate-700">{s}</span>
                  <button onClick={() => set('schedules', form.schedules.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="e.g. Mon 6:00 PM" value={schedInput} onChange={e => setSchedInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && schedInput.trim()) { set('schedules', [...form.schedules, schedInput.trim()]); setSchedInput(''); } }} />
              <button onClick={() => { if (schedInput.trim()) { set('schedules', [...form.schedules, schedInput.trim()]); setSchedInput(''); } }}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800">Add</button>
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
const DeleteModal: React.FC<{ title: string; onConfirm: () => void; onCancel: () => void }> = ({ title, onConfirm, onCancel }) => (
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
  const [courses, setCourses] = useState<Course[]>(MOCK);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (data: typeof EMPTY) => {
    const newCourse: Course = { ...data, id: Date.now().toString(), isPublished: false, totalLessons: 0, enrollments: 0 };
    setCourses(prev => [newCourse, ...prev]);
    setShowCreate(false);
  };

  const handleEdit = (data: typeof EMPTY) => {
    setCourses(prev => prev.map(c => c.id === editId ? { ...c, ...data } : c));
    setEditId(null);
  };

  const handleDelete = () => {
    setCourses(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const togglePublish = (id: string) => setCourses(prev => prev.map(c => c.id === id ? { ...c, isPublished: !c.isPublished } : c));

  const editingCourse = courses.find(c => c.id === editId);
  const deletingCourse = courses.find(c => c.id === deleteId);

  return (
    <div className="space-y-6">
      {showCreate && <CourseForm title="Create New Class" initial={EMPTY} onSave={handleCreate} onCancel={() => setShowCreate(false)} />}
      {editId && editingCourse && (
        <CourseForm title="Edit Class" initial={{ ...editingCourse }} onSave={handleEdit} onCancel={() => setEditId(null)} />
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
          {courses.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">{c.title}</h3>
                      <Badge text={c.isPublished ? 'Published' : 'Draft'} color={c.isPublished ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'} />
                      <Badge text={c.type === 'SUBSCRIPTION' ? 'Subscription' : 'One-Time'} color="bg-blue-50 text-blue-700" />
                      <Badge text={c.level} color={LEVEL_COLORS[c.level]} />
                    </div>
                    <p className="text-sm text-slate-500">{c.shortDesc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-teal-700">Rs. {c.price.toLocaleString()}</p>
                    {c.type === 'SUBSCRIPTION' && <p className="text-xs text-slate-400">/month</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" />{c.language}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-slate-400" />{c.totalLessons} lessons</span>
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-slate-400" />{c.category}</span>
                  {c.enrollments > 0 && <span className="font-semibold text-teal-700">{c.enrollments} students enrolled</span>}
                </div>

                {c.schedules.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {c.schedules.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium">
                        <Calendar className="w-3 h-3" /> {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-50">
                  <button onClick={() => togglePublish(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${c.isPublished ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-teal-200 text-teal-700 hover:bg-teal-50'}`}>
                    {c.isPublished ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                  </button>
                  <button onClick={() => setEditId(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;

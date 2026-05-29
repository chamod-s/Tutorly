import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Loader2, Play, Check, 
  BookOpen, Eye, EyeOff, Clock, AlertCircle 
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  duration: number; // in seconds from DB
  order: number;
  isFree: boolean;
  isPublished: boolean;
}

interface LessonManagerModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  videoUrl: '',
  duration: 10, // Default 10 minutes
  isFree: false,
  isPublished: true,
};

export const LessonManagerModal: React.FC<LessonManagerModalProps> = ({ 
  courseId, 
  courseTitle, 
  onClose 
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/courses/${courseId}/lessons`);
      setLessons(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load lessons:', err);
      setError('Failed to fetch lessons for this class.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setForm({
      title: lesson.title,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      duration: Math.round(lesson.duration / 60) || 5,
      isFree: lesson.isFree,
      isPublished: lesson.isPublished,
    });
    setEditId(lesson.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Duration is minutes in UI, seconds in API
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        duration: Number(form.duration) * 60,
        isFree: form.isFree,
        isPublished: form.isPublished,
      };

      if (editId) {
        await apiClient.put(`/lessons/${editId}`, payload);
      } else {
        await apiClient.post(`/courses/${courseId}/lessons`, payload);
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      await fetchLessons();
    } catch (err: any) {
      console.error('Failed to save lesson:', err);
      setError(err.response?.data?.message || 'Failed to save lesson details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/lessons/${lessonId}`);
      await fetchLessons();
    } catch (err: any) {
      console.error('Failed to delete lesson:', err);
      setError('Failed to delete the lesson.');
      setLoading(false);
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      setError(null);
      // Inline toggle publish status
      await apiClient.put(`/lessons/${lesson.id}`, {
        isPublished: !lesson.isPublished,
      });
      // Toggle locally to feel snappy
      setLessons(prev => 
        prev.map(l => l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l)
      );
    } catch (err: any) {
      console.error('Failed to toggle publish status:', err);
      setError('Failed to update lesson visibility.');
      fetchLessons();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-semibold text-teal-600 tracking-wider uppercase">Class Manager</span>
            <h3 className="text-lg font-bold text-slate-900 truncate max-w-lg mt-0.5">{courseTitle}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left panel: List of lessons */}
          <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Lessons ({lessons.length})
              </h4>
              {!showForm && (
                <button 
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1 text-xs font-semibold bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Lesson
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-sm font-medium">No lessons added yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Create educational videos to help your students learn.</p>
                <button 
                  onClick={handleOpenAdd}
                  className="mt-4 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Create First Lesson
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {lessons.map((lesson, idx) => (
                  <div 
                    key={lesson.id}
                    className={`p-3.5 border rounded-xl flex items-center gap-3 hover:border-slate-300 transition-all ${
                      editId === lesson.id ? 'border-teal-300 bg-teal-50/30' : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100/80 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 text-teal-700 fill-teal-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400">L{idx + 1}</span>
                        <p className="font-semibold text-slate-800 text-sm truncate">{lesson.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {Math.round(lesson.duration / 60)}m</span>
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          lesson.isFree ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {lesson.isFree ? 'Free Preview' : 'Paid'}
                        </span>
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          lesson.isPublished ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {lesson.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleTogglePublish(lesson)}
                        title={lesson.isPublished ? 'Unpublish' : 'Publish'}
                        className={`p-1.5 rounded-lg border transition-all ${
                          lesson.isPublished 
                            ? 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800' 
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {lesson.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(lesson)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(lesson.id)}
                        className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Add/Edit form */}
          <div className="w-1/2 p-6 overflow-y-auto bg-slate-50/50">
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {editId ? 'Edit Lesson' : 'Create New Lesson'}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditId(null); }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lesson Title *</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field w-full bg-white border border-slate-200" 
                    placeholder="e.g. 01. Introduction to Limits"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (Optional)</label>
                  <textarea 
                    rows={3} 
                    className="input-field w-full bg-white border border-slate-200 resize-none py-2" 
                    placeholder="Provide a summary of what is taught in this lesson."
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duration (Minutes)</label>
                    <input 
                      type="number" 
                      min={1} 
                      className="input-field w-full bg-white border border-slate-200" 
                      placeholder="e.g. 45"
                      value={form.duration}
                      onChange={e => setForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lesson Type</label>
                    <select 
                      className="input-field w-full bg-white border border-slate-200"
                      value={form.isFree ? 'FREE' : 'PAID'}
                      onChange={e => setForm(prev => ({ ...prev, isFree: e.target.value === 'FREE' }))}
                    >
                      <option value="PAID">Paid (Requires Enrollment)</option>
                      <option value="FREE">Free Preview (Anyone can watch)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Video / Stream URL *</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field w-full bg-white border border-slate-200" 
                    placeholder="e.g. https://stream.tutorly.lk/hls/demo-1/index.m3u8"
                    value={form.videoUrl}
                    onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Provide the link to the video file or HLS/M3U8 stream resource.</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isPublished"
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    checked={form.isPublished}
                    onChange={e => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  />
                  <label htmlFor="isPublished" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Publish immediately (students can view right away)
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Lesson...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editId ? 'Save Changes' : 'Create Lesson'}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 py-10">
                <BookOpen className="w-12 h-12 mb-3 text-slate-200 animate-pulse" />
                <h5 className="font-bold text-slate-700 text-sm">Lesson Editor</h5>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5">
                  Select a lesson to edit its contents, or click "Add Lesson" to publish new lectures.
                </p>
                <button 
                  onClick={handleOpenAdd}
                  className="mt-5 text-xs font-semibold border border-slate-300 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 transition-all shadow-sm"
                >
                  Create New Lesson
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

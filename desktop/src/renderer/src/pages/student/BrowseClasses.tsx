import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Star, Users, Clock, Globe, Filter, CheckCircle2, Tag, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

type Level = 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type CourseType = 'ALL' | 'SUBSCRIPTION' | 'ONE_TIME';

const CATEGORIES = ['All', 'Mathematics', 'Science', 'Programming', 'Languages', 'Design'];
const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-50 text-green-700',
  INTERMEDIATE: 'bg-blue-50 text-blue-700',
  ADVANCED: 'bg-purple-50 text-purple-700',
};

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-1">
    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
    <span className="text-sm font-medium text-slate-700">{rating}</span>
  </div>
);

// ── Course Card ───────────────────────────────────────────────
const CourseCard: React.FC<{ course: any; onEnroll: (course: any) => void }> = ({ course, onEnroll }) => {
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();

  const teacherName = course.teacher
    ? `${course.teacher.user?.firstName} ${course.teacher.user?.lastName}`
    : 'Unknown Instructor';

  const studentsCount = course._count?.enrollments ?? 0;
  const lessonsCount = course._count?.lessons ?? 0;

  return (
    <>
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="h-40 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-t-2xl flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/80" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{course.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${LEVEL_COLORS[course.level]}`}>{course.level}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{course.description || course.shortDesc}</p>
              <div className="flex gap-4 text-sm text-slate-600 flex-wrap">
                <Stars rating={course.rating} />
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {studentsCount} students</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lessonsCount} lessons</span>
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {course.language}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="text-slate-500">Instructor:</span> <span className="font-medium text-slate-900">{teacherName}</span></p>
                <p><span className="text-slate-500">Category:</span> <span className="font-medium text-slate-900">{course.category || 'General'}</span></p>
                <p><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900">{course.type === 'SUBSCRIPTION' ? 'Monthly Subscription' : 'One-Time Payment'}</span></p>
              </div>
              {course.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((t: string, i: number) => <span key={i} className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{t}</span>)}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDetail(false)} className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm hover:bg-slate-50">Close</button>
                {course.isEnrolled ? (
                  <button 
                    onClick={() => {
                      setShowDetail(false);
                      navigate('/student?tab=classes');
                    }} 
                    className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Continue Learning →
                  </button>
                ) : (
                  <button onClick={() => { onEnroll(course); setShowDetail(false); }}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Enroll · Rs. {course.price.toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 group overflow-hidden flex flex-col">
        <div className="h-36 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center relative">
          <BookOpen className="w-10 h-10 text-white/80" />
          {course.isEnrolled && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Enrolled
            </div>
          )}
          <span className={`absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[course.level]}`}>{course.level}</span>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 leading-snug mb-1 line-clamp-2 group-hover:text-teal-700 transition-colors">{course.title}</h3>
          <p className="text-xs text-slate-500 mb-2">by {teacherName}</p>
          <p className="text-xs text-slate-600 mb-3 line-clamp-2">{course.shortDesc || course.description}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
            <Stars rating={course.rating} />
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{studentsCount}</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{course.language}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${course.type === 'SUBSCRIPTION' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
              {course.type === 'SUBSCRIPTION' ? 'Monthly' : 'One-Time'}
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
            <span className="font-bold text-lg text-teal-700">Rs. {course.price.toLocaleString()}{course.type === 'SUBSCRIPTION' ? '/mo' : ''}</span>
            <button onClick={() => setShowDetail(true)} className="text-xs font-medium text-teal-600 hover:text-teal-800 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const BrowseClasses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState<Level>('ALL');
  const [type, setType] = useState<CourseType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = (course: any) => {
    navigate('/student/payment', {
      state: {
        courseId: course.id,
        courseTitle: course.title,
        price: course.price,
        type: course.type,
        teacherName: course.teacher
          ? `${course.teacher.user?.firstName} ${course.teacher.user?.lastName}`
          : 'Unknown Instructor'
      }
    });
  };

  const filtered = courses.filter(c => {
    if (c.isEnrolled) return false;

    const q = search.toLowerCase();
    const teacherName = c.teacher
      ? `${c.teacher.user?.firstName} ${c.teacher.user?.lastName}`.toLowerCase()
      : '';
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      teacherName.includes(q) ||
      (c.tags && c.tags.some((t: string) => t.toLowerCase().includes(q)));
    const matchCat = category === 'All' || c.category === category;
    const matchLevel = level === 'ALL' || c.level === level;
    const matchType = type === 'ALL' || c.type === type;
    return matchSearch && matchCat && matchLevel && matchType;
  });

  const enrolled = courses.filter(c => c.isEnrolled).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Browse Classes</h1>
        <p className="text-slate-500 text-sm mt-1">{courses.length} courses available · {enrolled} enrolled</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input-field pl-10 w-full" placeholder="Search by title, teacher, or tag…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(f => !f)} className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === c ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as Level[]).map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${level === l ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {l === 'ALL' ? 'All Levels' : l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Type</label>
            <div className="flex gap-2">
              {([['ALL', 'All Types'], ['SUBSCRIPTION', 'Monthly'], ['ONE_TIME', 'One-Time']] as [CourseType, string][]).map(([val, label]) => (
                <button key={val} onClick={() => setType(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${type === val ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-500">No courses found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 font-medium">{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => <CourseCard key={c.id} course={c} onEnroll={handleEnroll} />)}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseClasses;

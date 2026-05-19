import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import {
  BookOpen, User, FileText, Plus, X, Upload,
  CheckCircle2, ArrowLeft, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';
import { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

// ─── Step Indicator ───────────────────────────────────────────

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const steps = [
    { num: 1, label: 'Profile' },
    { num: 2, label: 'Qualifications' },
    { num: 3, label: 'Submit' },
  ];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              current === s.num ? 'bg-teal-600 text-white shadow-lg scale-110' :
              current > s.num ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {current > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
            </div>
            <span className="text-xs mt-1 text-slate-500 font-medium">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-16 mx-2 mb-4 transition-colors duration-300 ${current > s.num ? 'bg-green-400' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Tag Input ────────────────────────────────────────────────

const TagInput: React.FC<{
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
}> = ({ label, placeholder, tags, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-sm rounded-full">
            {tag}
            <button type="button" onClick={() => onRemove(i)} className="hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="input-field"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add</p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────

const TeacherApply: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualInput, setQualInput] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  // ── Handlers ────────────────────────────────────────────────

  const handleProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setDocuments((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeDocument = (i: number) => {
    setDocuments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validateStep1 = () => {
    if (bio.length < 50) { setError('Bio must be at least 50 characters'); return false; }
    if (subjects.length === 0) { setError('Add at least one subject'); return false; }
    if (!experience) { setError('Please enter your years of experience'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (qualifications.length === 0) { setError('Add at least one qualification'); return false; }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('experience', experience);
      formData.append('subjects', JSON.stringify(subjects));
      formData.append('qualifications', JSON.stringify(qualifications));
      if (profileImage) formData.append('profileImage', profileImage);
      documents.forEach((doc) => formData.append('documents', doc));

      await apiClient.post('/teachers/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const msg = err.response.data.message;
        setError(Array.isArray(msg) ? msg[0].message : (msg || 'Submission failed'));
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-teal-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Thank you, <strong>{user?.firstName}</strong>! Your teacher application is now under review.
          Our admin team will respond within 1–2 business days. You'll receive an in-app notification with the decision.
        </p>
        <button onClick={() => navigate('/teacher')} className="btn-primary px-8 py-3">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Apply to Teach</h1>
        <p className="text-slate-500 mt-2">Complete your application to become a verified TUTORLY instructor.</p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-700">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* ── Step 1: Profile ────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-teal-700 font-semibold mb-4">
            <User className="w-5 h-5" /> Profile Information
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Bio <span className="text-slate-400 text-xs">({bio.length}/2000 chars)</span>
            </label>
            <textarea
              rows={5}
              className="input-field resize-none"
              placeholder="Tell students about yourself — your background, teaching philosophy, and what makes your classes unique. (minimum 50 characters)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <TagInput
            label="Subjects You Teach"
            placeholder="e.g. Mathematics, Physics, Chemistry…"
            tags={subjects}
            onAdd={(t) => setSubjects((prev) => [...new Set([...prev, t])])}
            onRemove={(i) => setSubjects((prev) => prev.filter((_, idx) => idx !== i))}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="50"
              className="input-field w-32"
              placeholder="e.g. 5"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Qualifications ─────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-teal-700 font-semibold mb-4">
            <BookOpen className="w-5 h-5" /> Qualifications & Documents
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualifications</label>
            <div className="space-y-2 mb-2">
              {qualifications.map((q, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="flex-1 text-sm text-slate-800">{q}</span>
                  <button type="button" onClick={() => setQualifications((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="e.g. BSc Computer Science, University of Moratuwa"
                value={qualInput}
                onChange={(e) => setQualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && qualInput.trim()) {
                    e.preventDefault();
                    setQualifications((prev) => [...prev, qualInput.trim()]);
                    setQualInput('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => { if (qualInput.trim()) { setQualifications((prev) => [...prev, qualInput.trim()]); setQualInput(''); } }}
                className="btn-primary px-4 py-2 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Press Enter or click Add</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Supporting Documents <span className="text-slate-400 font-normal">(PDF, JPG, PNG — max 5 files, 5MB each)</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Click to upload degree certificates, NIC, etc.</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleDocuments} />
            </label>
            {documents.length > 0 && (
              <div className="mt-3 space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="flex-1 text-sm text-slate-700 truncate">{doc.name}</span>
                    <span className="text-xs text-slate-400">{(doc.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button type="button" onClick={() => removeDocument(i)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-teal-700 font-semibold mb-4">
            <User className="w-5 h-5" /> Profile Photo & Final Review
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Photo</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                {profilePreview
                  ? <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                  : <User className="w-8 h-8 text-slate-400" />}
              </div>
              <label className="btn-primary cursor-pointer px-4 py-2 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfileImage} />
              </label>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
            <h3 className="font-semibold text-slate-800 mb-3">Application Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Subjects:</span><p className="font-medium text-slate-800">{subjects.join(', ') || '—'}</p></div>
              <div><span className="text-slate-500">Experience:</span><p className="font-medium text-slate-800">{experience} years</p></div>
              <div className="col-span-2"><span className="text-slate-500">Qualifications:</span><p className="font-medium text-slate-800">{qualifications.join(' · ') || '—'}</p></div>
              <div className="col-span-2"><span className="text-slate-500">Documents:</span><p className="font-medium text-slate-800">{documents.length} file(s) attached</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {step < 3 ? (
          <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2 px-6 py-2.5">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isLoading} className="btn-primary flex items-center gap-2 px-8 py-2.5 disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Application <CheckCircle2 className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
};

export default TeacherApply;

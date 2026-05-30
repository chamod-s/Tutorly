import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import {
  User, Mail, Phone, Briefcase, Award, BookOpen,
  Edit3, Check, X, Loader2, Camera,
  CheckCircle2, AlertCircle, ShieldAlert
} from 'lucide-react';
import { AxiosError } from 'axios';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  teacherProfile?: {
    id: string;
    bio?: string;
    subjects: string[];
    qualifications: string[];
    experience: number;
    isVerified: boolean;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  };
}

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
            <button type="button" onClick={() => onRemove(i)} className="hover:text-red-650 transition-colors">
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
      <p className="text-[10px] text-slate-400 mt-1">Press Enter or comma to add subjects</p>
    </div>
  );
};

const TeacherProfile: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const updateUserStore = useAuthStore((s) => s.updateUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQual, setNewQual] = useState('');

  // Profile image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get(`/teachers/${user.id}`);
      const data = res.data.data;
      
      // Structure profileData to match ProfileData interface
      const profileData: ProfileData = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        avatar: data.user.avatar,
        phone: data.user.phone,
        teacherProfile: {
          id: data.id,
          bio: data.bio || '',
          subjects: data.subjects || [],
          qualifications: data.qualifications || [],
          experience: data.experience || 0,
          isVerified: data.isVerified,
          approvalStatus: data.approvalStatus,
          rejectionReason: data.rejectionReason,
        }
      };

      setProfile(profileData);
      
      // Initialize form fields
      setFirstName(profileData.firstName);
      setLastName(profileData.lastName);
      setPhone(profileData.phone || '');
      setBio(profileData.teacherProfile?.bio || '');
      setExperience(profileData.teacherProfile?.experience || 0);
      setSubjects(profileData.teacherProfile?.subjects || []);
      setQualifications(profileData.teacherProfile?.qualifications || []);
      setImagePreview(profileData.avatar || null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Could not load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddQualification = () => {
    if (newQual.trim() && !qualifications.includes(newQual.trim())) {
      setQualifications((prev) => [...prev, newQual.trim()]);
      setNewQual('');
    }
  };

  const handleRemoveQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First Name and Last Name are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('phone', phone.trim());
      formData.append('bio', bio.trim());
      formData.append('experience', String(experience));
      formData.append('subjects', JSON.stringify(subjects));
      formData.append('qualifications', JSON.stringify(qualifications));
      
      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const res = await apiClient.put('/teachers/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update locally
      const updatedUser = res.data.data;
      updateUserStore({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setError(err.response.data?.message || 'Failed to update profile.');
      } else {
        setError('Network error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> Verified Instructor
        </span>
      );
    }
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" /> Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Action Required
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-slate-400" /> Unverified
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-teal-650 animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-left">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tutor Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your public tutor details and verification settings.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-250/60 flex items-start text-rose-800">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-250/60 flex items-start text-green-800">
          <CheckCircle2 className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {profile?.teacherProfile?.approvalStatus === 'APPROVED' && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-start">
          <CheckCircle2 className="w-5 h-5 mr-3 shrink-0 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Application Approved!</p>
            <p className="mt-0.5 text-green-700 leading-relaxed font-medium">Congratulations! Your teacher profile has been approved and verified. You now have full access to create classes, schedule live streams, and publish video courses.</p>
          </div>
        </div>
      )}

      {profile?.teacherProfile?.approvalStatus === 'REJECTED' && profile?.teacherProfile?.rejectionReason && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-850 text-sm">
          <p className="font-semibold text-amber-900">Admin Rejection Feedback:</p>
          <p className="mt-1 font-medium">{profile.teacherProfile.rejectionReason}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Details Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center">
            {/* Avatar Section with Upload Button */}
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-105 flex items-center justify-center shrink-0 shadow-inner">
                {imagePreview ? (
                  <img src={imagePreview} alt="Tutor Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Change Photo</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <h3 className="font-bold text-slate-900 text-lg leading-tight">
              {profile?.firstName} {profile?.lastName}
            </h3>
            <p className="text-xs text-slate-450 mt-1 capitalize font-medium text-slate-500">Tutor / Instructor</p>

            <div className="mt-4">
              {getStatusBadge(
                profile?.teacherProfile?.approvalStatus || 'PENDING',
                profile?.teacherProfile?.isVerified || false
              )}
            </div>

            <div className="w-full border-t border-slate-100 mt-6 pt-5 space-y-3.5 text-left">
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{profile?.email}</span>
              </div>
              
              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field py-1 text-xs"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <span>{profile?.phone || 'Not provided'}</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-slate-600 text-sm">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="input-field py-1 px-2.5 text-xs w-16"
                      value={experience}
                      onChange={(e) => setExperience(parseInt(e.target.value, 10) || 0)}
                    />
                    <span className="text-xs font-semibold">years exp</span>
                  </div>
                ) : (
                  <span>{profile?.teacherProfile?.experience} Years Experience</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : null}

            {/* Biography */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Biography / About Me</label>
              {isEditing ? (
                <textarea
                  rows={6}
                  className="input-field resize-none leading-relaxed"
                  placeholder="Share details about your background, teaching philosophy, and expertise."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              ) : (
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {profile?.teacherProfile?.bio || 'No biography details provided yet.'}
                </p>
              )}
            </div>

            {/* Subjects List */}
            <div className="border-t border-slate-100 pt-6">
              {isEditing ? (
                <TagInput
                  label="Subjects You Teach"
                  placeholder="e.g. Mathematics, Science, Engineering"
                  tags={subjects}
                  onAdd={(tag) => setSubjects((prev) => [...new Set([...prev, tag])])}
                  onRemove={(idx) => setSubjects((prev) => prev.filter((_, i) => i !== idx))}
                />
              ) : (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-600" /> Subjects Taught
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {profile?.teacherProfile?.subjects.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">No subjects added.</span>
                    ) : (
                      profile?.teacherProfile?.subjects.map((s, i) => (
                        <span key={i} className="px-3.5 py-1 bg-teal-50 border border-teal-150 text-teal-800 text-xs font-semibold rounded-full">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Qualifications List */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-650 text-teal-650" /> Qualifications & Degrees
              </label>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {qualifications.map((q, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        <span className="text-slate-800 font-medium">{q}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(i)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="e.g. MSc in Mathematics, University of Cambridge"
                      value={newQual}
                      onChange={(e) => setNewQual(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddQualification();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddQualification}
                      className="btn-primary py-2 px-5 text-sm shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1.5">
                  {profile?.teacherProfile?.qualifications.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">No qualifications added.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {profile?.teacherProfile?.qualifications.map((q, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                          <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Actions for editing */}
            {isEditing && (
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setSuccess('');
                    fetchProfile(); // Reset fields
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-205 shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeacherProfile;

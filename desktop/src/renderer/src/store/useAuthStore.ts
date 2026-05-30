import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | null;

export interface TeacherProfile {
  id: string;
  bio: string | null;
  subjects: string[];
  qualifications: string[];
  experience: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  rejectionReason: string | null;
}

export interface StudentProfile {
  id: string;
  grade: string | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
  phone?: string;
  teacherProfile?: TeacherProfile | null;
  studentProfile?: StudentProfile | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: 'tutorly-auth-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

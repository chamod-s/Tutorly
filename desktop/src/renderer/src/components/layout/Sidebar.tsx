import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  LogOut,
  Video,
  CreditCard,
  GraduationCap,
  User
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { role, logout } = useAuthStore((state) => ({
    role: state.user?.role,
    logout: state.logout
  }));

  const getLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
          { name: 'Teacher Approvals', path: '/admin/teachers', icon: <Users size={20} /> },
        ];
      case 'TEACHER':
        return [
          { name: 'Dashboard', path: '/teacher', icon: <LayoutDashboard size={20} /> },
          { name: 'My Classes', path: '/teacher/classes', icon: <BookOpen size={20} /> },
          { name: 'Live Streams', path: '/teacher/live', icon: <Video size={20} /> },
          { name: 'My Profile', path: '/teacher/profile', icon: <User size={20} /> },
        ];
      case 'STUDENT':
      default:
        return [
          { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={20} /> },
          { name: 'Browse Classes', path: '/student/classes', icon: <BookOpen size={20} /> },
          { name: 'Payment History', path: '/student/payments', icon: <CreditCard size={20} /> },
        ];
    }
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
        <GraduationCap className="w-8 h-8 text-primary-400 mr-3" />
        <span className="text-white font-bold text-xl tracking-wide">TUTORLY</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {getLinks().map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{link.icon}</span>
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

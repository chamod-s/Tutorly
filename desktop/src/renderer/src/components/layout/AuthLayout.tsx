import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Pane - Branding & Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-950 opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-500 blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center mb-8">
            <GraduationCap className="w-16 h-16 text-primary-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">Welcome to TUTORLY</h1>
          <p className="text-primary-100 text-lg max-w-md mx-auto leading-relaxed">
            The premier online teaching and learning platform. Elevate your educational journey with us.
          </p>
        </div>
      </div>

      {/* Right Pane - Form Outlet */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="absolute top-8 left-8 lg:hidden flex items-center text-primary-600 font-bold text-xl">
          <GraduationCap className="w-6 h-6 mr-2" />
          TUTORLY
        </div>
        <div className="w-full max-w-md animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

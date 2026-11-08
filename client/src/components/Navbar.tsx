import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle2, ShieldCheck, Building2, CalendarPlus } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Bank Raya Logo Mark */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  bank<span className="text-emerald-600">raya</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-800">
                  Meeting
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Room Booking Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Action & User Profile & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('booking')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <CalendarPlus className="w-4 h-4" />
            Booking Ruangan
          </button>

          {/* User Profile Card */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-slate-800">{user.name}</span>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">
                      <ShieldCheck className="w-3 h-3" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
                      PEGAWAI
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  PN: <span className="font-mono font-medium text-slate-600">{user.pn}</span> &bull; {user.division}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner">
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title="Keluar dari akun"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


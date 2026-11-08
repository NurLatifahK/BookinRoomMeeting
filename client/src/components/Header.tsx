import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, CalendarPlus, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
      case 'availability':
        return {
          title: 'Jadwal & Ketersediaan Ruangan',
          subtitle: 'Matriks slot 15 ruangan di Lantai 12, 15, 16, 17, dan 19',
        };
      case 'booking':
        return {
          title: 'Booking Ruang Meeting',
          subtitle: 'Reservasi ruang rapat baru dengan validasi otomatis',
        };
      case 'my-bookings':
        return {
          title: 'Booking Saya',
          subtitle: 'Daftar riwayat dan status permohonan reservasi Anda',
        };
      case 'admin':
        return {
          title: 'Admin Control Center',
          subtitle: 'Pusat approval Nota Dinas dan manajemen fasilitas ruangan',
        };
      default:
        return {
          title: 'RayaMeetingRoom',
          subtitle: 'Portal Reservasi Ruang Meeting Bank Raya',
        };
    }
  };

  const pageInfo = getPageTitle();

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 py-3 flex items-center justify-between gap-4">
        {/* Left: Page Title & Subtitle */}
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{pageInfo.title}</span>
            {currentPage === 'admin' && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-[#00529B]">
                Admin
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>

        {/* Right Info: Quick Booking Button, Live User Identity & Logout Button */}
        <div className="flex items-center gap-3">
          {/* Quick Booking Button for Employees */}
          {!isAdmin && currentPage !== 'booking' && (
            <button
              onClick={() => onNavigate('booking')}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00529B] hover:bg-[#00427e] text-white font-bold text-xs shadow-md shadow-blue-900/15 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Booking Ruangan</span>
            </button>
          )}

          {/* User Profile Card (Dynamic: Budi Santoso / Admin / etc.) */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              {/* User details */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {user.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-blue-100 text-[#00529B]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  PN: <span className="font-mono text-slate-700 font-bold">{user.pn}</span> &bull;{' '}
                  <span className="text-slate-600">{user.division}</span>
                </div>
              </div>

              {/* Avatar Initial (B for Budi Santoso) */}
              <div
                className="w-10 h-10 rounded-full bg-blue-50 border-2 border-[#00529B] text-[#00529B] font-black text-sm flex items-center justify-center shadow-sm flex-shrink-0"
                title={`${user.name} (${user.pn})`}
              >
                {user.name.charAt(0)}
              </div>

              {/* Opsi Logout: Ikon Keluar di Header */}
              <button
                onClick={logout}
                title="Keluar dari akun (Logout)"
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 transition-all duration-200 flex items-center justify-center group"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

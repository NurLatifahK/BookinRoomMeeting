import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  CalendarPlus,
  BookmarkCheck,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Menu navigasi vertikal tanpa Dashboard
  const menuItems = [
    {
      id: 'availability',
      label: 'Jadwal & Ketersediaan',
      icon: CalendarDays,
    },
    {
      id: 'booking',
      label: 'Booking Ruangan',
      icon: CalendarPlus,
    },
    {
      id: 'my-bookings',
      label: 'Booking Saya',
      icon: BookmarkCheck,
    },
  ];

  if (isAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
    });
  }

  const handleSelectPage = (pageId: string) => {
    onNavigate(pageId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#00529C] text-white select-none">
      {/* 1. Header Pojok Kiri Atas: Logo Resmi Bank Raya (Full Putih) & Teks "MEETING ROOM" */}
      <div className="p-6 border-b border-white/15">
        <div className="flex flex-col items-start">
          {/* Container Logo Resmi Bank Raya dengan margin-bottom yang cukup lega (24px) */}
          <div className="mb-6">
            <svg
              viewBox="0 0 160 64"
              className="h-12 w-auto fill-white text-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Teks "bank" kecil di atas */}
              <text
                x="2"
                y="14"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="13"
                fontWeight="800"
                fill="#FFFFFF"
                letterSpacing="-0.3px"
              >
                bank
              </text>

              {/* Teks "raya" besar di bawah "bank" */}
              <text
                x="2"
                y="41"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="29"
                fontWeight="900"
                fill="#FFFFFF"
                letterSpacing="-0.8px"
              >
                raya
              </text>

              {/* Lengkungan senyum khas Bank Raya di bawah huruf raya */}
              <path
                d="M 4 47 C 22 55, 48 55, 68 47"
                stroke="#FFFFFF"
                strokeWidth="3.6"
                strokeLinecap="round"
                fill="none"
              />

              {/* Teks "BRI group" kecil di bagian kiri bawah */}
              <text
                x="3"
                y="60"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="7.5"
                fill="#FFFFFF"
                fillOpacity="0.88"
                letterSpacing="0.4px"
              >
                <tspan fontWeight="900">BRI</tspan> group
              </text>
            </svg>
          </div>

          {/* Teks "MEETING ROOM" di bawah logo, terpisah bersih dan tidak saling tertimpa */}
          <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">
            MEETING ROOM
          </span>
        </div>
      </div>

      {/* 2. Daftar Menu Navigasi Vertikal */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
        <div className="text-[10px] font-bold tracking-wider uppercase text-white/50 px-3 mb-2">
          Menu Utama
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                isActive
                  ? 'bg-white text-[#00529C] shadow-lg shadow-black/10 scale-[1.02]'
                  : 'text-white hover:bg-white/10 text-white/90'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#00529C]' : 'text-white'
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>
              </div>

              {isActive ? (
                <div className="w-2 h-2 rounded-full bg-[#00529C]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Footer: User Info & Logout Button */}
      {user && (
        <div className="p-4 border-t border-white/15 bg-black/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/10 backdrop-blur">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-white text-[#00529C] flex items-center justify-center font-black text-sm flex-shrink-0 shadow">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-white/70 font-mono truncate">
                  PN: {user.pn} &bull; {isAdmin ? 'ADMIN' : 'PEGAWAI'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Keluar Akun"
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 flex-shrink-0 shadow-2xl z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Topbar & Drawer Toggle */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#00529C] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-black text-base text-white">bankraya</span>
          <span className="text-[11px] font-semibold text-white/75 uppercase tracking-wider">
            &bull; MEETING ROOM
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

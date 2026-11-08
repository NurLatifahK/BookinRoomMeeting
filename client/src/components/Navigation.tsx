import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  BookmarkCheck,
  Shield,
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & Ketersediaan',
    },
    {
      id: 'availability',
      label: 'Jadwal & Ketersediaan',
      icon: CalendarDays,
      description: 'Matriks 15 Ruangan',
    },
    {
      id: 'booking',
      label: 'Booking Ruangan',
      icon: PlusCircle,
      description: 'Form Pemesanan Baru',
    },
    {
      id: 'my-bookings',
      label: 'Booking Saya',
      icon: BookmarkCheck,
      description: 'Kelola Jadwal Pribadi',
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      description: 'Kelola Seluruh Booking & Ruangan',
    });
  }

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
                {item.id === 'admin' && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-purple-100 text-purple-700 rounded font-bold">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};


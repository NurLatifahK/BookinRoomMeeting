import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, Room } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building2,
  CalendarCheck,
  Clock,
  Layers,
  ArrowRight,
  CalendarPlus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, roomsData] = await Promise.all([
        api.getDashboardStats(),
        api.getRooms(),
      ]);
      setStats(statsData);
      setRooms(roomsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const floors = [12, 15, 16, 17, 19];

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Bank Raya Corporate Blue) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00529C] via-[#0A66C2] to-[#00386B] text-white p-6 sm:p-8 shadow-xl shadow-blue-950/10">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Sistem Booking Terpusat Bank Raya</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {user?.name}!
          </h1>

          <p className="mt-2 text-sm text-blue-50/90 leading-relaxed font-normal">
            Kelola dan pesan ruang meeting di Kantor Pusat Bank Raya dengan validasi bentrok jadwal otomatis. Tersedia 15 ruang meeting eksklusif di Lantai 12, 15, 16, 17, dan 19.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {!isAdmin && (
              <button
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#00529C] font-extrabold text-xs sm:text-sm hover:bg-blue-50 transition shadow-lg shadow-black/10 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <CalendarPlus className="w-4 h-4 text-[#00529C]" />
                <span>Buat Booking Sekarang</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('availability')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 text-white font-bold text-xs sm:text-sm hover:bg-white/25 transition border border-white/20 backdrop-blur shadow-sm transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Search className="w-4 h-4 text-white" />
              <span>Cek Jadwal & Ketersediaan</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#00529C] font-extrabold text-xs sm:text-sm hover:bg-blue-50 transition shadow-lg shadow-black/10"
              >
                <span>Kelola Approval ({stats?.pendingApprovalCount ?? 0})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Clean White with Blue Bank Raya Accents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ruangan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Ruangan
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#00529C]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.totalRooms ?? 15}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">5 Lantai &bull; 3 Ruang / Lantai</p>
          </div>
        </div>

        {/* Card 2: Tersedia Saat Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tersedia Saat Ini
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#00529C]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#00529C]">
              {stats?.availableRoomsNowCount ?? 15}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Siap untuk digunakan</p>
          </div>
        </div>

        {/* Card 3: Booking Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Booking Hari Ini
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#00529C]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.todayBookingsCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Sesi pertemuan terdaftar</p>
          </div>
        </div>

        {/* Card 4: Total Terkonfirmasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Terkonfirmasi
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#00529C]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.totalActiveAllTime ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Di seluruh jadwal</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Bookings & Room Floor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#00529C]" />
                <span>Jadwal Meeting Hari Ini</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tanggal: <span className="font-semibold text-slate-700">{stats?.today || 'Hari Ini'}</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('availability')}
              className="text-xs font-semibold text-[#00529C] hover:text-blue-800 flex items-center gap-1 group"
            >
              <span>Lihat Matriks Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Memuat jadwal...</div>
          ) : !stats?.todayBookings || stats.todayBookings.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Booking Hari Ini</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ruangan masih sangat longgar. Segera pesan ruang meeting untuk koordinasi tim Anda.
              </p>
              {!isAdmin && (
                <button
                  onClick={() => onNavigate('booking')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#00529C] text-white text-xs font-semibold hover:bg-[#004280] transition shadow"
                >
                  Pesan Ruangan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {stats.todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#00529C] font-bold text-xs flex flex-col items-center justify-center min-w-[64px]">
                      <span>{b.startTime}</span>
                      <span className="text-[10px] text-blue-500 font-normal">s.d.</span>
                      <span>{b.endTime}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{b.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-[#00529C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {b.room?.name} (Lt. {b.room?.floor})
                        </span>
                        <span>&bull;</span>
                        <span>
                          Oleh: <strong className="text-slate-700">{b.employeeName}</strong> ({b.employeePn})
                        </span>
                      </div>
                      {b.description && (
                        <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                          "{b.description}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs text-slate-400 font-medium">
                      {b.duration} Jam
                    </span>
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Floor Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00529C]" />
              <span>Daftar Lantai & Ruangan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              15 Ruangan di 5 Lantai Utama
            </p>
          </div>

          <div className="space-y-4">
            {floors.map((floor) => {
              const floorRooms = rooms.filter((r) => r.floor === floor);
              return (
                <div key={floor} className="border border-slate-100 rounded-xl p-3 bg-slate-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00529C]" />
                      Lantai {floor}
                    </span>
                    <span className="text-[11px] text-slate-400">3 Ruangan</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {floorRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => onNavigate('availability', { floor })}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-[#00529C] hover:shadow-sm text-left transition group"
                      >
                        <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#00529C] truncate">
                          {room.name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Users className="w-3 h-3" />
                          <span>{room.capacity} Org</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

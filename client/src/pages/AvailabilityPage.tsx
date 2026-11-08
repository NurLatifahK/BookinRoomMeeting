import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoomAvailability } from '../types';
import {
  Calendar as CalendarIcon,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Sparkles,
  Info,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface AvailabilityPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialFloor?: number | string;
}

export const AvailabilityPage: React.FC<AvailabilityPageProps> = ({
  onNavigate,
  initialFloor,
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isWeekendStr = (dStr: string) => {
    if (!dStr) return false;
    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay();
    return day === 0 || day === 6;
  };

  const getNextBusinessDayStr = (fromD: Date = new Date()) => {
    const next = new Date(fromD);
    const day = next.getDay();
    if (day === 5) {
      next.setDate(next.getDate() + 3);
    } else if (day === 6) {
      next.setDate(next.getDate() + 2);
    } else if (day === 0) {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 1);
    }
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedFloor, setSelectedFloor] = useState<string>(
    initialFloor ? initialFloor.toString() : 'ALL'
  );
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState('');

  const floors = ['ALL', '12', '15', '16', '17', '19'];
  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00'
  ];

  const isSelectedWeekend = isWeekendStr(selectedDate);
  const isToday = selectedDate === getTodayStr();
  const now = new Date();
  const currentHour = now.getHours();

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await api.getAvailability({
        date: selectedDate,
        floor: selectedFloor === 'ALL' ? undefined : selectedFloor,
      });
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [selectedDate, selectedFloor]);

  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSlotClick = (roomId: string, slotTime: string) => {
    if (isSelectedWeekend) return;
    
    // Validasi real-time jika hari ini: tidak boleh klik jam saat ini / sebelumnya
    if (isToday) {
      const [slotH] = slotTime.split(':').map(Number);
      if (slotH <= currentHour) {
        return;
      }
    }

    onNavigate('booking', {
      roomId,
      date: selectedDate,
      startTime: slotTime,
    });
  };

  const filteredRooms = availability.filter((room) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      room.name.toLowerCase().includes(q) ||
      room.code.toLowerCase().includes(q) ||
      room.facilities.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-[#00529C]" />
              <span>Jadwal & Ketersediaan Ruangan</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Visualisasi jadwal dan slot kosong 15 ruang meeting Bank Raya (Jam Booking: 08:00 - 16:00 WIB &bull; Senin–Jumat).
            </p>
          </div>

          {/* Quick Date Stepper & Picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDateBy(-1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none"
              />
            </div>
            <button
              onClick={() => changeDateBy(1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                isToday
                  ? 'bg-[#00529C] text-white border-[#00529C]'
                  : 'bg-blue-50 text-[#00529C] hover:bg-blue-100 border-blue-200/60'
              }`}
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Weekend Banner Warning */}
        {isSelectedWeekend && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold block">Hari Libur Akhir Pekan (Sabtu & Minggu):</span>
                <span>Operasional dan reservasi ruang rapat Bank Raya tidak tersedia pada akhir pekan.</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDate(getNextBusinessDayStr(new Date(selectedDate)))}
              className="px-3 py-1.5 rounded-lg bg-[#00529C] text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Pindah ke Hari Kerja (Senin)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floor Filter Tabs & Search */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lantai:
            </span>
            {floors.map((fl) => (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedFloor === fl
                    ? 'bg-[#00529C] text-white shadow-sm shadow-blue-900/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {fl === 'ALL' ? 'Semua Lantai (15)' : `Lantai ${fl}`}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari ruangan atau fasilitas..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] text-blue-600 font-bold">
              +
            </div>
            <span>Tersedia (Bisa Booking)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-500"></div>
            <span>Terisi / Dibooking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-200"></div>
            <span>Waktu Lewat / Sedang Berjalan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300"></div>
            <span>Pemeliharaan</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          💡 Klik slot kosong pada jam yang tersedia untuk langsung mengisi form booking.
        </div>
      </div>

      {/* Room Schedule Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Memuat Jadwal Ruangan...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">Tidak ada ruangan yang cocok dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Header Jam Operasional (08:00 - 16:00) */}
              <div className="flex border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600">
                <div className="w-64 p-3.5 flex-shrink-0 border-r border-slate-200">
                  Ruang Rapat & Kapasitas
                </div>
                <div className="flex-1 grid grid-cols-9 text-center">
                  {hours.map((h) => (
                    <div key={h} className="p-3.5 border-r border-slate-200 last:border-r-0 font-mono">
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {filteredRooms.map((room) => (
                  <div key={room.id} className="flex hover:bg-slate-50/50 transition">
                    {/* Room Info Col */}
                    <div className="w-64 p-3.5 flex-shrink-0 border-r border-slate-200 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#00529C]">
                          Lt. {room.floor}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {room.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-0.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          {room.capacity} Orang
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono text-[#00529C] font-semibold">{room.code}</span>
                      </div>
                    </div>

                    {/* Hourly Slots */}
                    <div className="flex-1 grid grid-cols-9">
                      {room.slots.map((slot, idx) => {
                        const [slotH] = slot.time.split(':').map(Number);
                        const isSlotPassedOrCurrent = isToday && slotH <= currentHour;

                        if (slot.isMaintenance) {
                          return (
                            <div
                              key={idx}
                              title="Ruangan dalam masa pemeliharaan"
                              className="border-r border-slate-100 bg-amber-50/80 flex items-center justify-center p-1 text-[10px] text-amber-700 font-bold"
                            >
                              MNT
                            </div>
                          );
                        }

                        if (slot.isBooked && slot.booking) {
                          return (
                            <div
                              key={idx}
                              title={`Terisi: ${slot.booking.title}\nPemesan: ${slot.booking.employeeName} (${slot.booking.employeePn})\nWaktu: ${slot.booking.startTime} - ${slot.booking.endTime}`}
                              className="border-r border-rose-200 bg-rose-500 hover:bg-rose-600 text-white p-1 flex flex-col items-center justify-center transition cursor-help shadow-inner text-center overflow-hidden"
                            >
                              <span className="text-[10px] font-extrabold leading-tight truncate w-full px-0.5">
                                {slot.booking.employeePn}
                              </span>
                              <span className="text-[9px] opacity-80 leading-none truncate w-full px-0.5">
                                {slot.booking.startTime}
                              </span>
                            </div>
                          );
                        }

                        // Slot waktu hari ini yang sudah lewat / sedang berjalan (tidak bisa dibooking)
                        if (isSlotPassedOrCurrent) {
                          return (
                            <div
                              key={idx}
                              title={`Jam ${slot.time} WIB sudah lewat atau sedang berlangsung. Pemesanan hari ini hanya dapat dilakukan mulai jam setelahnya.`}
                              className="border-r border-slate-100 bg-slate-100/70 text-slate-400 flex items-center justify-center text-[10px] cursor-not-allowed select-none"
                            >
                              -
                            </div>
                          );
                        }

                        // Weekend (tutup)
                        if (isSelectedWeekend) {
                          return (
                            <div
                              key={idx}
                              title="Kantor Bank Raya libur di akhir pekan"
                              className="border-r border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center text-[10px] cursor-not-allowed select-none"
                            >
                              Libur
                            </div>
                          );
                        }

                        // Available slot
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSlotClick(room.id, slot.time)}
                            title={`Klik untuk booking ${room.name} mulai jam ${slot.time}`}
                            className="border-r border-slate-100 hover:bg-blue-100/80 bg-blue-50/20 flex items-center justify-center transition cursor-pointer group/slot relative"
                          >
                            <span className="text-[10px] font-semibold text-blue-600/40 group-hover/slot:text-[#00529C] group-hover/slot:scale-110 transition transform">
                              +
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

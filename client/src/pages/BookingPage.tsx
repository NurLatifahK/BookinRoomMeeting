import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api, ApiError } from '../services/api';
import { Room } from '../types';
import {
  CalendarPlus,
  Clock,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tv,
  Calendar,
  FileText,
  ShieldAlert,
  Upload,
  X,
  Info,
  CalendarRange,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface BookingPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: {
    roomId?: string;
    date?: string;
    startTime?: string;
  };
}

export const BookingPage: React.FC<BookingPageProps> = ({
  onNavigate,
  initialParams,
}) => {
  const { user, isAdmin } = useAuth();
  const { success, error, info, warning } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper tanggal & jam real-time
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isWeekendStr = (dateStr: string) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay();
    return day === 0 || day === 6; // 0 = Minggu, 6 = Sabtu
  };

  /**
   * Menghitung H+1 hari kerja berikutnya (Next Business Day)
   * Jika hari ini Jumat -> H+1 kerja adalah Senin
   * Jika hari ini Sabtu/Minggu -> Senin
   */
  const getNextBusinessDayStr = (fromD: Date = new Date()) => {
    const next = new Date(fromD);
    const day = next.getDay();
    if (day === 5) {
      // Jumat -> Senin (+3 hari)
      next.setDate(next.getDate() + 3);
    } else if (day === 6) {
      // Sabtu -> Senin (+2 hari)
      next.setDate(next.getDate() + 2);
    } else if (day === 0) {
      // Minggu -> Senin (+1 hari)
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 1);
    }
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Tanggal default awal: jika hari ini weekend, langsung arahkan ke hari kerja Senin
  const getInitialDate = () => {
    const now = new Date();
    if (now.getDay() === 0 || now.getDay() === 6) {
      return getNextBusinessDayStr(now);
    }
    return getTodayStr();
  };

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    initialParams?.roomId || ''
  );
  const [date, setDate] = useState<string>(initialParams?.date || getInitialDate());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<number>(2);
  const [endTime, setEndTime] = useState<string>('11:00');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Multi-day state
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');
  const [notaDinas, setNotaDinas] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const durationOptions = [1, 2, 3, 4, 5, 6, 8];

  // Seluruh slot jam operasional (08:00 - 16:00 WIB)
  const allTimeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00',
  ];

  const timeToMins = (t: string) => {
    const parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  // Hitung slot jam mulai yang valid secara REAL-TIME:
  // "jika memilih di hari yang sama tidak bisa di jam saat itu ataupun sebelumnya, jadi bisanya jam setelahnya."
  const isToday = date === getTodayStr();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const earliestAllowedHour = currentHour + 1; // Jam setelah jam sekarang
  const earliestAllowedMinutes = earliestAllowedHour * 60;

  // Filter slot yang tersedia
  const availableTimeSlots = allTimeSlots.filter((slot) => {
    if (!isToday) return true;
    return timeToMins(slot) >= earliestAllowedMinutes;
  });

  const isTodayClosed = isToday && (earliestAllowedHour > 16 || availableTimeSlots.length === 0);

  // Pastikan startTime selalu valid
  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!availableTimeSlots.includes(startTime)) {
        setStartTime(availableTimeSlots[0]);
        setEndTime(calculateEndTime(availableTimeSlots[0], duration));
      }
    }
  }, [date, availableTimeSlots.length]);

  // Handle pergantian tanggal dengan validasi weekend otomatis
  const handleDateChange = (newDateStr: string) => {
    if (isWeekendStr(newDateStr)) {
      const nextMon = getNextBusinessDayStr(new Date(newDateStr));
      warning(
        'Hari Libur Operasional (Weekend)',
        'Ruang rapat Bank Raya tutup pada hari Sabtu & Minggu. Tanggal otomatis dialihkan ke hari kerja berikutnya (Senin).'
      );
      setDate(nextMon);
      return;
    }
    setDate(newDateStr);
  };

  // Calculate End Time automatically
  const calculateEndTime = (start: string, dur: number): string => {
    const parts = start.split(':');
    if (parts.length < 2) return '';
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const totalMins = hours * 60 + mins + dur * 60;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const getEndTimeOptions = (start: string) => {
    return durationOptions.map((dur) => {
      const end = calculateEndTime(start, dur);
      return {
        time: end,
        duration: dur,
        label: `${end} WIB (${dur} Jam)`,
      };
    });
  };

  const endTimeOptions = getEndTimeOptions(startTime);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const currentDur = duration || 2;
    const newEnd = calculateEndTime(newStart, currentDur);
    setEndTime(newEnd);
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const options = getEndTimeOptions(startTime);
    const matched = options.find((o) => o.time === newEnd);
    if (matched) {
      setDuration(matched.duration);
    }
  };

  const calculatedEndTime = endTime;

  // Calculate total days if multi-day
  const calculateTotalDays = (): number => {
    if (!isMultiDay || !endDate) return 1;
    const start = new Date(date);
    const end = new Date(endDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  const totalDays = calculateTotalDays();

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoadingRooms(true);
        const data = await api.getRooms();
        setRooms(data);
        if (!selectedRoomId && data.length > 0) {
          setSelectedRoomId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    loadRooms();
  }, []);

  useEffect(() => {
    if (initialParams?.roomId) setSelectedRoomId(initialParams.roomId);
    if (initialParams?.date) {
      if (isWeekendStr(initialParams.date)) {
        setDate(getNextBusinessDayStr(new Date(initialParams.date)));
      } else {
        setDate(initialParams.date);
      }
    }
    if (initialParams?.startTime) {
      setStartTime(initialParams.startTime);
      setEndTime(calculateEndTime(initialParams.startTime, duration));
    }
  }, [initialParams]);

  // Helper daftar pilihan tanggal (dropdown) dengan opsi akhir pekan otomatis DISABLED
  const generateDateOptions = (startFromDate: Date, count = 45) => {
    const options = [];
    const base = new Date(startFromDate);

    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      const dayName = dayNames[dayOfWeek];
      const formatted = `${dayName}, ${dayNum} ${monthNames[d.getMonth()]} ${y}`;
      const isTodayItem = dateStr === getTodayStr();

      options.push({
        value: dateStr,
        isWeekend,
        isToday: isTodayItem,
        label: isWeekend
          ? `${formatted} — [AKHIR PEKAN - LIBUR]`
          : `${formatted} ${isTodayItem ? '(Hari Ini)' : ''}`,
      });
    }
    return options;
  };

  const bookingDateOptions = generateDateOptions(new Date(), 45);

  const getEndDateOptions = () => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return generateDateOptions(next, 35);
  };
  const endDateOptions = getEndDateOptions();

  // Reset end date when switching to single day
  useEffect(() => {
    if (!isMultiDay) {
      setEndDate('');
      setNotaDinas(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      // Set default end date to next business day
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2); // skip sat to mon
      if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1); // skip sun to mon
      setEndDate(nextDay.toISOString().split('T')[0]);
    }
  }, [isMultiDay]);

  // Update end date min when start date changes
  useEffect(() => {
    if (isMultiDay && endDate && endDate <= date) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2);
      if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().split('T')[0]);
    }
  }, [date]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      error('Format File Tidak Valid', 'Hanya file PDF, JPG, atau PNG yang diizinkan.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error('File Terlalu Besar', 'Ukuran file maksimal 5 MB.');
      e.target.value = '';
      return;
    }
    setNotaDinas(file);
  };

  const removeFile = () => {
    setNotaDinas(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    if (!selectedRoomId) {
      error('Ruangan Belum Dipilih', 'Silakan pilih ruang meeting yang akan digunakan.');
      return;
    }

    if (!title.trim()) {
      error('Judul Agenda Kosong', 'Harap masukkan nama atau agenda rapat.');
      return;
    }

    // Validasi Weekend
    if (isWeekendStr(date)) {
      error(
        'Akhir Pekan Tidak Dapat Dipesan',
        'Ruang rapat Bank Raya tidak beroperasi pada hari Sabtu dan Minggu. Silakan pilih hari kerja.'
      );
      return;
    }

    // Validasi Real-time Hari Ini
    if (isToday) {
      const startMins = timeToMins(startTime);
      if (startMins < earliestAllowedMinutes) {
        error(
          'Jam Tidak Valid',
          `Pemesanan di hari yang sama tidak dapat dilakukan pada jam saat ini (${String(currentHour).padStart(2, '0')}:00 WIB) ataupun sebelumnya. Jam mulai paling awal adalah ${String(earliestAllowedHour).padStart(2, '0')}:00 WIB.`
        );
        return;
      }
    }

    if (isMultiDay) {
      if (!endDate) {
        error('Tanggal Selesai Belum Diisi', 'Harap pilih tanggal selesai booking multi-hari.');
        return;
      }
      if (endDate <= date) {
        error('Tanggal Tidak Valid', 'Tanggal selesai harus setelah tanggal mulai.');
        return;
      }
      if (isWeekendStr(endDate)) {
        error(
          'Tanggal Selesai Akhir Pekan',
          'Tanggal selesai tidak boleh jatuh pada hari Sabtu atau Minggu.'
        );
        return;
      }
      if (!notaDinas) {
        error('Nota Dinas Diperlukan', 'Booking lebih dari 1 hari wajib melampirkan Nota Dinas.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.createBooking({
        roomId: selectedRoomId,
        date,
        endDate: isMultiDay ? endDate : undefined,
        startTime,
        duration,
        title: title.trim(),
        description: description.trim() || undefined,
        notaDinas: notaDinas || undefined,
      });

      if (res.requiresApproval) {
        info(
          'Booking Menunggu Approval Admin',
          `Booking ${totalDays} hari untuk ${selectedRoom?.name} telah dikirim dan menunggu persetujuan Admin. Silakan cek status di halaman Booking Saya.`
        );
      } else {
        success(
          'Booking Berhasil Dikonfirmasi!',
          `Ruangan ${selectedRoom?.name} pada ${date} pukul ${startTime} - ${calculatedEndTime} WIB telah terkonfirmasi.`
        );
      }
      onNavigate('my-bookings');
    } catch (err: any) {
      if (err.conflict) {
        setConflictWarning(err.message);
        error('Jadwal Bentrok!', err.message);
      } else {
        error('Gagal Booking', err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper tampilan info H+1 Jumat
  const isTodayFriday = now.getDay() === 5;
  const nextBusinessDayStr = getNextBusinessDayStr();

  // Admin cannot book
  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Admin Tidak Dapat Booking</h2>
          <p className="text-sm text-slate-600 mb-1 leading-relaxed">
            Akun Admin tidak memiliki akses untuk membuat booking ruang meeting.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Jika perlu memesan ruangan, gunakan akun pegawai. Admin hanya bertugas memantau dan menyetujui booking yang memerlukan nota dinas.
          </p>
          <button
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00529C] text-white text-sm font-bold rounded-xl hover:bg-[#00427e] transition"
          >
            <Shield className="w-4 h-4" />
            Ke Panel Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Guidelines */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-100 text-[#00529C]">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Form Booking Ruang Meeting
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Reservasi ruang rapat internal kantor pusat Bank Raya (Jam Operasional 08:00 – 16:00 WIB &bull; Senin–Jumat).
            </p>
          </div>
        </div>
      </div>

      {/* Info Card: Ketentuan Operasional Real-time & Weekend */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00529C] text-white flex items-center justify-center font-bold flex-shrink-0">
            i
          </div>
          <div>
            <span className="font-bold text-[#00529C] block">Ketentuan Reservasi Real-Time:</span>
            <span>
              Tidak dapat booking pada akhir pekan (Sabtu & Minggu). Booking di hari yang sama hanya dapat dimulai setelah jam berjalan.
            </span>
          </div>
        </div>

        {/* Quick button H+1 jika Jumat */}
        {isTodayFriday && (
          <button
            type="button"
            onClick={() => setDate(nextBusinessDayStr)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#00529C] hover:bg-[#00427e] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <span>Pilih H+1 Kerja (Senin, {nextBusinessDayStr})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Conflict Warning Alert */}
      {conflictWarning && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-rose-900">
              Jadwal Ruangan Bentrok!
            </h4>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {conflictWarning}
            </p>
            <p className="text-xs text-rose-600 mt-2 font-medium">
              💡 Saran: Silakan pilih ruangan lain atau atur ulang jam / tanggal reservasi Anda.
            </p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Identity Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Data Pemesan (Otomatis Sesuai Akun Login)
              </span>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-slate-800">{user?.name}</span>
                  <span className="text-slate-400 mx-1.5">&bull;</span>
                  <span className="font-mono text-[#00529C] font-semibold">{user?.pn}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-[#00529C] text-xs font-semibold">
                  {user?.division}
                </span>
              </div>
            </div>

            {/* Room Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#00529C]" />
                  Pilih Ruang Meeting & Lantai *
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Total 15 Ruangan
                </span>
              </label>

              {loadingRooms ? (
                <div className="py-2 text-xs text-slate-400">Memuat ruangan...</div>
              ) : (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                  required
                >
                  {[12, 15, 16, 17, 19].map((floor) => {
                    const floorRooms = rooms.filter((r) => r.floor === floor);
                    return (
                      <optgroup key={floor} label={`🏢 LANTAI ${floor}`}>
                        {floorRooms.map((r) => (
                          <option
                            key={r.id}
                            value={r.id}
                            disabled={r.status === 'MAINTENANCE'}
                          >
                            {r.name} (Lt. {r.floor} &bull; Kapasitas {r.capacity} Org)
                            {r.status === 'MAINTENANCE' ? ' - [PEMELIHARAAN]' : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Single Day / Multi Day Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-[#00529C]" />
                Jenis Booking *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsMultiDay(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    !isMultiDay
                      ? 'bg-[#00529C] text-white shadow-md ring-2 ring-blue-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Satu Hari (Tanpa Approval)
                </button>
                <button
                  type="button"
                  onClick={() => setIsMultiDay(true)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isMultiDay
                      ? 'bg-[#00529C] text-white shadow-md ring-2 ring-blue-600/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  Multi Hari (&gt; 1 Hari + Nota Dinas)
                </button>
              </div>
            </div>

            {/* Multi-day notice */}
            {isMultiDay && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-bold mb-1">Booking Multi-Hari Memerlukan Persetujuan Admin</p>
                  <p className="leading-relaxed">
                    Booking lebih dari 1 hari wajib melampirkan <strong>Nota Dinas</strong> (PDF/JPG/PNG, maks. 5 MB) dan tidak boleh mencakup hari libur akhir pekan.
                    Status akan menunggu approval Administrator.
                  </p>
                </div>
              </div>
            )}

            {/* Date Fields */}
            <div className={`grid gap-4 ${isMultiDay ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#00529C]" />
                    {isMultiDay ? 'Tanggal Mulai *' : 'Tanggal Booking *'}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Hari Ini
                    </span>
                  )}
                </label>
                <select
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                  required
                >
                  {bookingDateOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.isWeekend}
                      className={opt.isWeekend ? 'bg-slate-100 text-slate-400 italic' : 'text-slate-800 font-semibold'}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {isMultiDay && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    Tanggal Selesai *
                  </label>
                  <select
                    value={endDate}
                    onChange={(e) => {
                      if (isWeekendStr(e.target.value)) {
                        warning(
                          'Tanggal Akhir Pekan',
                          'Kantor Bank Raya libur di akhir pekan. Silakan pilih hari kerja (Senin-Jumat).'
                        );
                      }
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                    required={isMultiDay}
                  >
                    {endDateOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.isWeekend}
                        className={opt.isWeekend ? 'bg-slate-100 text-slate-400 italic' : 'text-slate-800 font-semibold'}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Jam Mulai & Jam Berakhir */}
            {isTodayClosed ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pemesanan Hari Ini Sudah Ditutup</span>
                </div>
                <p className="leading-relaxed">
                  Waktu saat ini adalah <strong>{String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')} WIB</strong>. Sesuai aturan, jam booking tidak bisa di jam saat itu/sebelumnya dan batas mulai pemesanan maksimal adalah 16:00 WIB.
                </p>
                <button
                  type="button"
                  onClick={() => setDate(getNextBusinessDayStr())}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00529C] text-white font-bold text-xs"
                >
                  <span>Pilih Hari Kerja Berikutnya ({getNextBusinessDayStr()})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#00529C]" />
                      Jam Mulai (Maks. 16:00) *
                    </span>
                    {isToday && (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Mulai min: {String(earliestAllowedHour).padStart(2, '0')}:00 WIB
                      </span>
                    )}
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                    required
                  >
                    {availableTimeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#00529C]" />
                      Jam Berakhir *
                    </span>
                    <span className="text-[11px] text-[#00529C] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      Durasi: {duration} Jam
                    </span>
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                    required
                  >
                    {endTimeOptions.map((opt) => (
                      <option key={opt.time} value={opt.time}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Meeting Title & Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#00529C]" />
                Judul Agenda / Topik Rapat *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Digital Lending Q4"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keterangan Tambahan (Opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Catatan kebutuhan proyektor, snack, peserta dari kantor cabang, dll..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
              />
            </div>

            {/* Nota Dinas Upload (Multi-day only) */}
            {isMultiDay && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#00529C]" />
                  Upload Nota Dinas *
                  <span className="text-[11px] text-slate-400 font-normal">(PDF/JPG/PNG, maks. 5 MB)</span>
                </label>
                {notaDinas ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00529C] flex-shrink-0" />
                      <span className="text-xs font-semibold text-[#00529C] truncate max-w-[200px]">
                        {notaDinas.name}
                      </span>
                      <span className="text-[10px] text-[#00529C]">
                        ({(notaDinas.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#00529C] rounded-xl p-5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 group"
                  >
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#00529C] mx-auto mb-2 transition" />
                    <p className="text-xs font-semibold text-slate-700">
                      Klik untuk memilih file Nota Dinas
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Wajib untuk pemesanan lebih dari 1 hari kerja
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isTodayClosed}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2 ${
                submitting || isTodayClosed
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#00529C] hover:bg-[#00427e] transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Reservasi...</span>
                </>
              ) : isMultiDay ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Kirim Permohonan & Nota Dinas (Approval Admin)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Booking Ruangan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Summary Card (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00529C]" />
              Ringkasan Reservasi
            </h3>

            {selectedRoom ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Ruangan</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedRoom.name}</span>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Lantai {selectedRoom.floor} &bull; Kapasitas {selectedRoom.capacity} Orang &bull; Kode: {selectedRoom.code}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Waktu & Tanggal</span>
                  <span className="font-bold text-slate-800">
                    {date} {isMultiDay && endDate ? `s.d. ${endDate}` : ''}
                  </span>
                  <div className="font-mono text-[#00529C] font-bold text-xs mt-0.5">
                    {startTime} - {calculatedEndTime} WIB ({duration} Jam)
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Jenis Reservasi</span>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    isMultiDay ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isMultiDay ? `Multi-Hari (${totalDays} Hari) - Butuh Approval` : '1 Hari - Langsung Terkonfirmasi'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Fasilitas Ruangan</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRoom.facilities.split(',').map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                        {f.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Pilih ruangan untuk melihat rincian.</p>
            )}
          </div>

          {/* Quick Notice Card */}
          <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-4 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-[#00529C] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#00529C]" />
              Kebijakan Booking
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 leading-relaxed">
              <li>Pemesanan hanya berlaku pada hari kerja <strong>Senin s.d. Jumat</strong>.</li>
              <li>Booking di hari yang sama hanya dapat dimulai setelah jam saat ini.</li>
              <li>Batas waktu mulai reservasi paling lambat pukul <strong>16:00 WIB</strong>.</li>
              <li>Pemesanan &gt; 1 hari wajib upload Nota Dinas untuk diverifikasi oleh Admin.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

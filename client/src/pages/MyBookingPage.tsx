import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Booking, Room } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import {
  BookmarkCheck,
  Calendar,
  Clock,
  Building2,
  Edit2,
  Trash2,
  XCircle,
  PlusCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  ExternalLink,
  CalendarRange,
  Info,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface MyBookingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyBookingPage: React.FC<MyBookingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error } = useNotification();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel Dialog State
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Edit Modal State (single-day only)
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(1);
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editing, setEditing] = useState<boolean>(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editRoomId, setEditRoomId] = useState<string>('');

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00',
  ];

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      error('Gagal Memuat Booking', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
    api.getRooms().then(setRooms).catch(console.error);
  }, []);

  const openCancelModal = (booking: Booking) => {
    setCancelTarget(booking);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    try {
      setCancelling(true);
      await api.cancelBooking(cancelTarget.id, cancelReason);
      success(
        'Booking Berhasil Dibatalkan',
        `Jadwal untuk ${cancelTarget.room?.name} pada ${cancelTarget.date} kini telah dibatalkan dan tersedia untuk pegawai lain.`
      );
      setCancelTarget(null);
      await loadMyBookings();
    } catch (err: any) {
      error('Gagal Membatalkan Booking', err.message);
    } finally {
      setCancelling(false);
    }
  };

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

  const getEditEndTimeOptions = (start: string) => {
    return [1, 2, 3, 4, 5, 6, 8].map((dur) => {
      const end = calculateEndTime(start, dur);
      return {
        time: end,
        duration: dur,
        label: `${end} WIB (${dur} Jam)`,
      };
    });
  };

  const handleEditStartTimeChange = (newStart: string) => {
    setEditStartTime(newStart);
    const currentDur = editDuration || 1;
    setEditEndTime(calculateEndTime(newStart, currentDur));
  };

  const handleEditEndTimeChange = (newEnd: string) => {
    setEditEndTime(newEnd);
    const options = getEditEndTimeOptions(editStartTime);
    const matched = options.find((o) => o.time === newEnd);
    if (matched) {
      setEditDuration(matched.duration);
    }
  };

  const openEditModal = (booking: Booking) => {
    setEditTarget(booking);
    setEditRoomId(booking.roomId);
    setEditDate(booking.date);
    setEditStartTime(booking.startTime);
    setEditDuration(booking.duration);
    setEditEndTime(booking.endTime || calculateEndTime(booking.startTime, booking.duration));
    setEditTitle(booking.title);
    setEditDescription(booking.description || '');
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    try {
      setEditing(true);
      await api.updateBooking(editTarget.id, {
        roomId: editRoomId,
        date: editDate,
        startTime: editStartTime,
        duration: editDuration,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });

      success('Booking Berhasil Diperbarui', 'Perubahan jadwal berhasil divalidasi dan disimpan.');
      setEditTarget(null);
      await loadMyBookings();
    } catch (err: any) {
      error('Gagal Mengubah Booking', err.message);
    } finally {
      setEditing(false);
    }
  };

  const openNotaDinas = (bookingId: string) => {
    const url = api.getNotaDinasUrl(bookingId);
    window.open(url, '_blank');
  };

  const filterTabs = [
    { id: 'ALL', label: 'Semua Booking' },
    { id: 'CONFIRMED', label: 'Terkonfirmasi' },
    { id: 'PENDING_APPROVAL', label: 'Menunggu Approval' },
    { id: 'REJECTED', label: 'Ditolak' },
    { id: 'CANCELLED', label: 'Dibatalkan' },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  // Helper: format date range
  const formatDateRange = (b: Booking) => {
    if (b.isMultiDay && b.endDate) {
      return `${b.date} s/d ${b.endDate} (${b.totalDays} Hari)`;
    }
    return b.date;
  };

  // Can edit/cancel only CONFIRMED single-day bookings
  const canEdit = (b: Booking) => b.status === 'CONFIRMED' && !b.isMultiDay;
  const canCancel = (b: Booking) => b.status === 'CONFIRMED' || b.status === 'PENDING_APPROVAL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-[#00529C]" />
            <span>Booking Saya</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar seluruh reservasi meeting atas nama{' '}
            <strong className="text-slate-700">{user?.name}</strong> (PN:{' '}
            <span className="font-mono">{user?.pn}</span>).
          </p>
        </div>

        <button
          onClick={() => onNavigate('booking')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00529C] text-white font-bold text-xs sm:text-sm hover:bg-[#00427e] shadow-md shadow-blue-900/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Pesan Ruangan Baru</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => {
          const count = tab.id === 'ALL' ? bookings.length : bookings.filter(b => b.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#00529C] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-sm">
          Memuat daftar booking...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Tidak Ada Booking</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Anda belum memiliki reservasi dengan status ini. Buat booking baru untuk memulai rapat.
          </p>
          <button
            onClick={() => onNavigate('booking')}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00529C] text-white text-xs font-semibold hover:bg-[#00427e] transition"
          >
            Booking Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between ${
                b.status === 'CANCELLED' || b.status === 'REJECTED'
                  ? 'border-slate-200/60 opacity-80 bg-slate-50/50'
                  : b.status === 'PENDING_APPROVAL'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200/90 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header: Room & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lantai {b.room?.floor} &bull; {b.room?.code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                      {b.room?.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={b.status} />
                    {b.isMultiDay && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center gap-1">
                        <CalendarRange className="w-3 h-3" />
                        Multi-Hari
                      </span>
                    )}
                  </div>
                </div>

                {/* Meeting Agenda Title */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Agenda Rapat:
                  </span>
                  <div className="font-bold text-slate-800 text-sm">{b.title}</div>
                  {b.description && (
                    <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">
                      "{b.description}"
                    </p>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-[#00529C]">
                    <Calendar className="w-4 h-4 text-[#00529C] flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#00529C]">
                        {b.isMultiDay ? 'Periode' : 'Tanggal'}
                      </div>
                      <div className="font-bold text-[11px] leading-tight">
                        {formatDateRange(b)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 text-slate-800">
                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500">Waktu ({b.duration} Jam)</div>
                      <div className="font-bold">
                        {b.startTime} - {b.endTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Status Info */}
                {b.status === 'PENDING_APPROVAL' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Menunggu Persetujuan Admin</div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Booking ini memerlukan persetujuan Admin. Anda akan dinotifikasi setelah diproses.
                      </div>
                    </div>
                  </div>
                )}

                {b.status === 'REJECTED' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 mb-3">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      Booking Ditolak Admin:
                    </div>
                    <div className="text-[11px] text-rose-600 mt-0.5">
                      {b.rejectionReason || 'Tidak ada alasan penolakan'}
                    </div>
                    {b.approvedBy && (
                      <div className="text-[10px] text-rose-500 mt-1">
                        Oleh: {b.approvedBy.name} • {b.approvedAt ? new Date(b.approvedAt).toLocaleDateString('id-ID') : ''}
                      </div>
                    )}
                  </div>
                )}

                {b.status === 'CONFIRMED' && b.approvedBy && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-[#00529C] mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#00529C] flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Disetujui oleh: </span>
                      {b.approvedBy.name}
                      {b.approvedAt && (
                        <span className="text-[#00529C] ml-1">
                          • {new Date(b.approvedAt).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {b.status === 'CANCELLED' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 mb-3">
                    <div className="font-semibold">Alasan Pembatalan:</div>
                    <div className="text-[11px] text-rose-600 mt-0.5">
                      {b.cancelledReason || 'Tidak ada catatan pembatalan'}
                    </div>
                  </div>
                )}

                {/* Nota Dinas Link */}
                {b.notaDinasPath && (
                  <button
                    onClick={() => openNotaDinas(b.id)}
                    className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lihat Nota Dinas</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              {(canEdit(b) || canCancel(b)) && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                  {canEdit(b) && (
                    <button
                      onClick={() => openEditModal(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Jadwal</span>
                    </button>
                  )}
                  {canCancel(b) && (
                    <button
                      onClick={() => openCancelModal(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        isLoading={cancelling}
        danger={true}
        title="Konfirmasi Pembatalan Booking"
        message={`Apakah Anda yakin ingin membatalkan booking ruangan ${cancelTarget?.room?.name} pada tanggal ${cancelTarget?.date} pukul ${cancelTarget?.startTime} - ${cancelTarget?.endTime}? Jadwal ini akan langsung tersedia kembali untuk pegawai lain.`}
        confirmLabel="Ya, Batalkan Jadwal"
        cancelLabel="Kembali"
      />

      {/* Edit Booking Modal (Single Day Only) */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Jadwal Booking"
        subtitle={`Ubah detail booking untuk ${editTarget?.room?.name} (Lt. ${editTarget?.room?.floor})`}
      >
        <form onSubmit={handleConfirmEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ruang Meeting
            </label>
            <select
              value={editRoomId}
              onChange={(e) => setEditRoomId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {[12, 15, 16, 17, 19].map((fl) => (
                <optgroup key={fl} label={`Lantai ${fl}`}>
                  {rooms
                    .filter((r) => r.floor === fl)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Lt. {r.floor})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              min={getTodayStr()}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Mulai
              </label>
              <select
                value={editStartTime}
                onChange={(e) => handleEditStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t} WIB
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Jam Berakhir</span>
                <span className="text-[10px] text-[#00529C] font-bold">({editDuration} Jam)</span>
              </label>
              <select
                value={editEndTime}
                onChange={(e) => handleEditEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {getEditEndTimeOptions(editStartTime).map((opt) => (
                  <option key={opt.time} value={opt.time}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Agenda
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editing}
              className="px-4 py-2 text-xs font-bold text-white bg-[#00529C] hover:bg-[#00427e] rounded-xl flex items-center gap-2"
            >
              {editing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

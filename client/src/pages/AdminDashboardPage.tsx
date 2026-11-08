import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Booking, Room } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import {
  Shield,
  Building2,
  CalendarDays,
  Search,
  Users,
  Edit2,
  XCircle,
  CheckCircle2,
  Loader2,
  FileText,
  ExternalLink,
  Clock,
  Calendar,
  CalendarRange,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Info,
  Layers,
  Wrench,
  Sparkles,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [activeTab, setActiveTab] = useState<'bookings' | 'approvals' | 'rooms'>('bookings');

  // === BOOKINGS MANAGEMENT ===
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [filterFloor, setFilterFloor] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // === APPROVALS ===
  const [pendingApprovals, setPendingApprovals] = useState<Booking[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState<boolean>(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejecting, setRejecting] = useState<boolean>(false);

  // Approve Confirm
  const [approveTarget, setApproveTarget] = useState<Booking | null>(null);
  const [approving, setApproving] = useState<boolean>(false);

  // === ROOMS MANAGEMENT ===
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [roomCapacity, setRoomCapacity] = useState<number>(10);
  const [roomFacilities, setRoomFacilities] = useState<string>('');
  const [roomStatus, setRoomStatus] = useState<string>('AVAILABLE');
  const [roomDescription, setRoomDescription] = useState<string>('');
  const [savingRoom, setSavingRoom] = useState<boolean>(false);

  // Booking Cancel Dialog
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Dibatalkan oleh Administrator');
  const [cancelling, setCancelling] = useState<boolean>(false);

  const floors = [12, 15, 16, 17, 19];

  // Load bookings
  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const data = await api.getBookings({
        floor: filterFloor === 'ALL' ? undefined : filterFloor,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        date: filterDate || undefined,
        search: searchQuery || undefined,
      });
      setBookings(data);
    } catch (err: any) {
      error('Gagal Memuat Booking', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load pending approvals
  const loadPendingApprovals = async () => {
    try {
      setLoadingApprovals(true);
      const data = await api.getPendingApprovals();
      setPendingApprovals(data);
    } catch (err: any) {
      error('Gagal Memuat Approval', err.message);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await api.getRooms();
      setRooms(data);
    } catch (err: any) {
      error('Gagal Memuat Ruangan', err.message);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [filterFloor, filterStatus, filterDate, searchQuery]);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  useEffect(() => {
    loadRooms();
  }, []);

  // ---- Room handlers ----
  const openEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomCapacity(room.capacity);
    setRoomFacilities(room.facilities);
    setRoomStatus(room.status);
    setRoomDescription(room.description || '');
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      setSavingRoom(true);
      await api.updateRoom(editingRoom.id, {
        name: roomName.trim(),
        capacity: roomCapacity,
        facilities: roomFacilities.trim(),
        status: roomStatus,
        description: roomDescription.trim(),
      });
      success('Data Ruangan Disimpan', `Informasi ruangan ${roomName} berhasil diperbarui.`);
      setEditingRoom(null);
      await loadRooms();
    } catch (err: any) {
      error('Gagal Menyimpan Ruangan', err.message);
    } finally {
      setSavingRoom(false);
    }
  };

  // ---- Booking cancel ----
  const handleConfirmCancelBooking = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await api.cancelBooking(cancelTarget.id, cancelReason);
      success(
        'Booking Dibatalkan Oleh Admin',
        `Jadwal ${cancelTarget.room?.name} pada ${cancelTarget.date} berhasil dibatalkan.`
      );
      setCancelTarget(null);
      await loadBookings();
    } catch (err: any) {
      error('Gagal Membatalkan Booking', err.message);
    } finally {
      setCancelling(false);
    }
  };

  // ---- Approval handlers ----
  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      setApproving(true);
      await api.approveBooking(approveTarget.id, 'APPROVE');
      success(
        'Booking Disetujui',
        `Booking ${approveTarget.room?.name} atas nama ${approveTarget.employeeName} telah dikonfirmasi.`
      );
      setApproveTarget(null);
      await Promise.all([loadPendingApprovals(), loadBookings()]);
    } catch (err: any) {
      error('Gagal Menyetujui Booking', err.message);
    } finally {
      setApproving(false);
    }
  };

  const openRejectModal = (booking: Booking) => {
    setRejectTarget(booking);
    setRejectionReason('');
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      error('Alasan Diperlukan', 'Harap isi alasan penolakan booking.');
      return;
    }
    try {
      setRejecting(true);
      await api.approveBooking(rejectTarget.id, 'REJECT', rejectionReason.trim());
      success(
        'Booking Ditolak',
        `Booking ${rejectTarget.room?.name} atas nama ${rejectTarget.employeeName} telah ditolak.`
      );
      setRejectTarget(null);
      await Promise.all([loadPendingApprovals(), loadBookings()]);
    } catch (err: any) {
      error('Gagal Menolak Booking', err.message);
    } finally {
      setRejecting(false);
    }
  };

  const openNotaDinas = (bookingId: string) => {
    const url = api.getNotaDinasUrl(bookingId);
    window.open(url, '_blank');
  };

  const formatDateRange = (b: Booking) => {
    if (b.isMultiDay && b.endDate) {
      return `${b.date} s/d ${b.endDate}`;
    }
    return b.date;
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 mt-1">
          Halaman ini hanya dapat diakses oleh Administrator Sistem Bank Raya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Administrator Control Center</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Admin Panel Bank Raya
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitoring, approval, dan pengelolaan terpusat seluruh booking pegawai dan 15 ruang meeting.
            </p>
          </div>

          {/* Admin note */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 max-w-xs">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Admin tidak dapat membuat booking. Gunakan akun pegawai untuk memesan ruangan.</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl mt-4 w-fit flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'bookings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-[#00529C]" />
            <span>Semua Booking</span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'approvals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Approval Nota Dinas</span>
            {pendingApprovals.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'approvals'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-amber-500 text-white'
              }`}>
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'rooms'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#00529C]" />
            <span>Kelola 15 Ruangan</span>
          </button>
        </div>
      </div>

      {/* ===== TAB 1: ALL BOOKINGS ===== */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari PN, Nama, atau Judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="ALL">Semua Lantai</option>
              {floors.map((fl) => (
                <option key={fl} value={fl}>Lantai {fl}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="CONFIRMED">Terkonfirmasi</option>
              <option value="PENDING_APPROVAL">Menunggu Approval</option>
              <option value="REJECTED">Ditolak</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Total Ditemukan: {bookings.length} Booking
              </span>
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-[#00529C] hover:underline font-semibold"
                >
                  Reset Tanggal
                </button>
              )}
            </div>

            {loadingBookings ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Memuat data booking seluruh pegawai...
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Tidak ada data booking yang sesuai dengan kriteria filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Tanggal & Jam</th>
                      <th className="py-3 px-4">Ruang & Lantai</th>
                      <th className="py-3 px-4">Pemesan (Pegawai)</th>
                      <th className="py-3 px-4">Agenda Rapat</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Nota Dinas</th>
                      <th className="py-3 px-4 text-right">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{formatDateRange(b)}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.startTime} - {b.endTime} ({b.duration} Jam)
                          </div>
                          {b.isMultiDay && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                              {b.totalDays} Hari
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#00529C]">{b.room?.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Lantai {b.room?.floor} &bull; {b.room?.code}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{b.employeeName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <span>PN: {b.employeePn}</span>
                            <span>&bull;</span>
                            <span>{b.user?.division || 'Internal'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{b.title}</div>
                          {b.description && (
                            <div className="text-[10px] text-slate-400 truncate italic">
                              {b.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={b.status} size="sm" />
                          {b.status === 'CANCELLED' && b.cancelledReason && (
                            <div className="text-[9px] text-rose-500 mt-0.5 truncate max-w-[120px]" title={b.cancelledReason}>
                              {b.cancelledReason}
                            </div>
                          )}
                          {b.status === 'REJECTED' && b.rejectionReason && (
                            <div className="text-[9px] text-rose-500 mt-0.5 truncate max-w-[120px]" title={b.rejectionReason}>
                              {b.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {b.notaDinasPath ? (
                            <button
                              onClick={() => openNotaDinas(b.id)}
                              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {(b.status === 'CONFIRMED' || b.status === 'PENDING_APPROVAL') && (
                              <button
                                onClick={() => setCancelTarget(b)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition"
                                title="Batalkan Booking"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {b.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => setApproveTarget(b)}
                                  className="p-1.5 rounded-lg text-[#00529C] hover:bg-blue-50 transition"
                                  title="Setujui Booking"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openRejectModal(b)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                  title="Tolak Booking"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 2: APPROVAL NOTA DINAS ===== */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Approval Booking Multi-Hari</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Daftar booking pegawai yang memerlukan persetujuan Anda. Periksa Nota Dinas sebelum menyetujui atau menolak.
              </p>
            </div>
          </div>

          {loadingApprovals ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-sm">
              Memuat daftar approval...
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-[#00529C] mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Tidak Ada Booking Menunggu Approval</h3>
              <p className="text-xs text-slate-400 mt-1">
                Semua booking multi-hari telah diproses. Tidak ada yang menunggu persetujuan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
                          <CalendarRange className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{b.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-[#00529C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {b.room?.name} — Lantai {b.room?.floor}
                            </span>
                            <StatusBadge status={b.status} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 mb-0.5">Pemesan</div>
                          <div className="font-bold text-slate-800">{b.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">PN: {b.employeePn}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 mb-0.5">Divisi</div>
                          <div className="font-bold text-slate-800">{b.user?.division || '—'}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="text-[10px] text-[#00529C] mb-0.5">Periode Booking</div>
                          <div className="font-bold text-[#00529C] text-[11px]">
                            {b.date} s/d {b.endDate}
                          </div>
                          <div className="text-[11px] text-[#00529C]">({b.totalDays} Hari)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 mb-0.5">Jam & Durasi</div>
                          <div className="font-bold text-slate-800">
                            {b.startTime} - {b.endTime}
                          </div>
                          <div className="text-[11px] text-slate-500">{b.duration} Jam / Hari</div>
                        </div>
                        {b.description && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                            <div className="text-[10px] text-slate-400 mb-0.5">Keterangan</div>
                            <div className="text-[11px] text-slate-700 italic">{b.description}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex flex-col gap-3 sm:w-48 flex-shrink-0">
                      {/* Nota Dinas */}
                      {b.notaDinasPath ? (
                        <button
                          onClick={() => openNotaDinas(b.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Buka Nota Dinas</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center">
                          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-rose-500" />
                          Nota Dinas tidak tersedia
                        </div>
                      )}

                      <button
                        onClick={() => setApproveTarget(b)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00529C] text-white text-xs font-bold hover:bg-[#00427e] transition shadow-sm shadow-blue-900/20"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Setujui Booking</span>
                      </button>

                      <button
                        onClick={() => openRejectModal(b)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Tolak Booking</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: ROOMS MANAGEMENT ===== */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00529C] text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#00529C]">
                  Manajemen 15 Ruang Meeting Bank Raya
                </h3>
                <p className="text-[11px] text-[#00529C]">
                  Anda dapat mengubah kapasitas, fasilitas, serta status ruangan (Tersedia atau Pemeliharaan).
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-[#00529C] bg-white px-3 py-1.5 rounded-xl border border-blue-200">
              Total: {rooms.length} Ruangan
            </div>
          </div>

          <div className="space-y-6">
            {floors.map((floor) => {
              const floorRooms = rooms.filter((r) => r.floor === floor);
              return (
                <div key={floor} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00529C]" />
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Lantai {floor}
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400">3 Ruangan</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {floorRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                          room.status === 'MAINTENANCE'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50/40 border-slate-200/80 hover:border-blue-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-slate-500">
                              {room.code}
                            </span>
                            <StatusBadge status={room.status} size="sm" />
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm mb-1">{room.name}</h3>

                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Kapasitas: <strong>{room.capacity} Orang</strong></span>
                          </div>

                          <div className="text-[11px] text-slate-500 leading-relaxed mb-3">
                            <strong className="text-slate-600">Fasilitas:</strong> {room.facilities}
                          </div>
                        </div>

                        <button
                          onClick={() => openEditRoomModal(room)}
                          className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-[#00529C] border border-blue-200 flex items-center justify-center gap-1.5 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Kelola / Edit Ruangan</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Room Edit Modal */}
      <Modal
        isOpen={!!editingRoom}
        onClose={() => setEditingRoom(null)}
        title={`Edit Ruangan: ${editingRoom?.name}`}
        subtitle={`Lantai ${editingRoom?.floor} &bull; Kode: ${editingRoom?.code}`}
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ruangan *</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (Orang) *</label>
              <input
                type="number"
                min={2}
                max={100}
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Operasional *</label>
              <select
                value={roomStatus}
                onChange={(e) => setRoomStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="AVAILABLE">Tersedia (Aktif)</option>
                <option value="MAINTENANCE">Pemeliharaan (Maintenance)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Fasilitas Ruangan *</label>
            <textarea
              value={roomFacilities}
              onChange={(e) => setRoomFacilities(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
            <input
              type="text"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingRoom(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingRoom}
              className="px-4 py-2 text-xs font-bold text-white bg-[#00529C] hover:bg-[#00427e] rounded-xl flex items-center gap-2"
            >
              {savingRoom && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Cancel Booking Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancelBooking}
        isLoading={cancelling}
        danger={true}
        title="Admin: Batalkan Booking Pegawai"
        message={`Batalkan booking atas nama pegawai ${cancelTarget?.employeeName} (${cancelTarget?.employeePn}) untuk ${cancelTarget?.room?.name} pada ${cancelTarget?.date} (${cancelTarget?.startTime} - ${cancelTarget?.endTime})?`}
        confirmLabel="Ya, Batalkan Jadwal"
        cancelLabel="Tutup"
      />

      {/* Approve Booking Confirmation */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        isLoading={approving}
        danger={false}
        title="Setujui Booking Multi-Hari"
        message={`Anda akan menyetujui booking ${approveTarget?.room?.name} atas nama ${approveTarget?.employeeName} untuk periode ${approveTarget?.date} s/d ${approveTarget?.endDate} (${approveTarget?.totalDays} hari). Sistem akan memeriksa ulang konflik jadwal sebelum dikonfirmasi.`}
        confirmLabel="Ya, Setujui Booking"
        cancelLabel="Batal"
      />

      {/* Reject Booking Modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Tolak Booking Multi-Hari"
        subtitle={`${rejectTarget?.room?.name} — ${rejectTarget?.employeeName} (${rejectTarget?.employeePn})`}
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
            <strong>Periode:</strong> {rejectTarget?.date} s/d {rejectTarget?.endDate} ({rejectTarget?.totalDays} Hari)<br />
            <strong>Jadwal:</strong> {rejectTarget?.startTime} - {rejectTarget?.endTime} ({rejectTarget?.duration} Jam/Hari)
          </div>

          {rejectTarget?.notaDinasPath && (
            <button
              type="button"
              onClick={() => rejectTarget && openNotaDinas(rejectTarget.id)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Buka Nota Dinas Sebelum Menolak</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto" />
            </button>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Penolakan * <span className="text-rose-500">(Wajib Diisi)</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Nota Dinas tidak valid, periode booking terlalu lama, ruangan tidak tersedia untuk keperluan tersebut, dsb."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={rejecting || !rejectionReason.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {rejecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Tolak Booking</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

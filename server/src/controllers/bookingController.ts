import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma';
import {
  validateBookingTime,
  hasTimeOverlap,
  generateDateRange,
  calculateTotalDays,
  timeToMinutes,
  minutesToTime,
  MAX_START_TIME,
  OPERATING_HOURS_START,
} from '../utils/time';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Cek konflik booking di semua tanggal yang termasuk dalam range.
 * Returns deskripsi konflik atau null jika aman.
 */
async function checkConflictsForDates(
  roomId: string,
  dates: string[],
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<{ conflict: true; message: string; conflictingBooking: any } | null> {
  for (const date of dates) {
    const existing = await prisma.booking.findMany({
      where: {
        roomId,
        date,
        status: { notIn: ['CANCELLED', 'REJECTED'] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    });

    for (const b of existing) {
      if (hasTimeOverlap(b.startTime, b.endTime, startTime, endTime)) {
        return {
          conflict: true,
          message: `Jadwal bentrok di tanggal ${date}! Ruangan sudah dibooking oleh ${b.employeeName} (${b.employeePn}) pada jam ${b.startTime}–${b.endTime} untuk agenda "${b.title}".`,
          conflictingBooking: {
            date,
            title: b.title,
            employeeName: b.employeeName,
            employeePn: b.employeePn,
            startTime: b.startTime,
            endTime: b.endTime,
          },
        };
      }
    }
  }
  return null;
}

// ─── CREATE BOOKING ────────────────────────────────────────────────────────

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { roomId, date, endDate, startTime, duration, title, description } = req.body;
    const user = req.user!;

    // Admin tidak boleh booking
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Administrator tidak diizinkan membuat booking ruangan. Silakan gunakan akun pegawai.',
      });
    }

    if (!roomId || !date || !startTime || !duration || !title) {
      return res.status(400).json({
        success: false,
        message: 'Lengkapi seluruh data booking (Ruangan, Tanggal, Jam Mulai, Durasi, dan Judul Agenda).',
      });
    }

    const durationNum = parseInt(duration, 10);

    // 1. Verifikasi ruangan
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan.' });
    }
    if (room.status === 'MAINTENANCE') {
      return res.status(400).json({
        success: false,
        message: `Ruangan ${room.name} sedang dalam status Pemeliharaan dan belum dapat dibooking.`,
      });
    }

    // 2. Validasi waktu
    const timeValidation = validateBookingTime(date, startTime, durationNum, endDate || undefined);
    if (!timeValidation.valid) {
      return res.status(400).json({ success: false, message: timeValidation.error });
    }

    const calculatedEnd = timeValidation.endTime!;
    const isMultiDay = timeValidation.isMultiDay!;
    const totalDays = timeValidation.totalDays!;
    const finalEndDate = isMultiDay ? endDate : date;

    // 3. Validasi nota dinas untuk multi-day
    if (isMultiDay) {
      // Cek apakah ada file nota dinas yang sudah diupload (via req.file dari multer)
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `Booking lebih dari 1 hari (${totalDays} hari) memerlukan upload Nota Dinas. Silakan lampirkan file Nota Dinas Anda.`,
        });
      }
    }

    // 4. Generate semua tanggal dalam range
    const dates = isMultiDay ? generateDateRange(date, finalEndDate) : [date];

    // 5. Cek konflik untuk semua tanggal
    const conflict = await checkConflictsForDates(roomId, dates, startTime, calculatedEnd);
    if (conflict) {
      // Hapus file yang sudah diupload jika konflik
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({
        success: false,
        conflict: true,
        message: conflict.message,
        conflictingBooking: conflict.conflictingBooking,
      });
    }

    // 6. Tentukan status booking
    const bookingStatus = isMultiDay ? 'PENDING_APPROVAL' : 'CONFIRMED';
    const approvalStatus = isMultiDay ? 'PENDING' : 'NOT_REQUIRED';

    // 7. Buat booking (1 record per tanggal untuk single-day, 1 record master untuk multi-day)
    // Untuk multi-day: simpan sebagai 1 record dengan date=startDate, endDate=endDate
    const newBooking = await prisma.booking.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        userId: user.id,
        employeeName: user.name,
        employeePn: user.pn,
        roomId: room.id,
        date,
        startTime,
        duration: durationNum,
        endTime: calculatedEnd,
        isMultiDay,
        endDate: isMultiDay ? finalEndDate : null,
        totalDays,
        notaDinasPath: req.file ? req.file.path : null,
        notaDinasOriginalName: req.file ? req.file.originalname : null,
        approvalStatus,
        status: bookingStatus,
      },
      include: { room: true },
    });

    const successMessage = isMultiDay
      ? `Booking ruangan untuk ${totalDays} hari (${date} s/d ${finalEndDate}) berhasil diajukan. Menunggu persetujuan Admin.`
      : `Booking berhasil! ${room.name} (Lantai ${room.floor}) pada ${date} pukul ${startTime}–${calculatedEnd} telah terkonfirmasi.`;

    return res.status(201).json({
      success: true,
      message: successMessage,
      requiresApproval: isMultiDay,
      data: newBooking,
    });
  } catch (error: any) {
    console.error('createBooking error:', error);
    // Hapus file upload jika error
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    return res.status(500).json({ success: false, message: 'Gagal membuat booking.', error: error.message });
  }
};

// ─── UPDATE BOOKING ───────────────────────────────────────────────────────

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roomId, date, endDate, startTime, duration, title, description } = req.body;
    const user = req.user!;

    const existingBooking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!existingBooking) {
      return res.status(404).json({ success: false, message: 'Data booking tidak ditemukan.' });
    }

    if (['CANCELLED', 'REJECTED'].includes(existingBooking.status)) {
      return res.status(400).json({ success: false, message: 'Booking yang sudah dibatalkan/ditolak tidak dapat diedit.' });
    }

    if (user.role !== 'ADMIN' && existingBooking.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Anda hanya dapat mengedit booking milik sendiri.' });
    }

    const targetRoomId = roomId || existingBooking.roomId;
    const targetDate = date || existingBooking.date;
    const targetEndDate = endDate || existingBooking.endDate || targetDate;
    const targetStartTime = startTime || existingBooking.startTime;
    const targetDuration = duration ? parseInt(duration, 10) : existingBooking.duration;

    const room = await prisma.room.findUnique({ where: { id: targetRoomId } });
    if (!room) return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan.' });

    const timeValidation = validateBookingTime(targetDate, targetStartTime, targetDuration, targetEndDate);
    if (!timeValidation.valid) {
      return res.status(400).json({ success: false, message: timeValidation.error });
    }

    const targetEndTime = timeValidation.endTime!;
    const isMultiDay = timeValidation.isMultiDay!;
    const totalDays = timeValidation.totalDays!;
    const dates = isMultiDay ? generateDateRange(targetDate, targetEndDate) : [targetDate];

    const conflict = await checkConflictsForDates(targetRoomId, dates, targetStartTime, targetEndTime, id);
    if (conflict) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: conflict.message,
        conflictingBooking: conflict.conflictingBooking,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        roomId: targetRoomId,
        date: targetDate,
        endDate: isMultiDay ? targetEndDate : null,
        startTime: targetStartTime,
        duration: targetDuration,
        endTime: targetEndTime,
        isMultiDay,
        totalDays,
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: { room: true, user: { select: { id: true, name: true, pn: true, username: true, division: true } } },
    });

    return res.status(200).json({ success: true, message: 'Jadwal booking berhasil diperbarui.', data: updated });
  } catch (error: any) {
    console.error('updateBooking error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui booking.', error: error.message });
  }
};

// ─── CANCEL BOOKING ───────────────────────────────────────────────────────

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user!;

    const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Booking ini sudah dibatalkan sebelumnya.' });
    }

    if (user.role !== 'ADMIN' && booking.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Anda hanya dapat membatalkan booking milik sendiri.' });
    }

    const cancelled = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledReason: reason || (user.role === 'ADMIN' ? 'Dibatalkan oleh Administrator' : 'Dibatalkan oleh pemesan'),
        cancelledAt: new Date(),
      },
      include: { room: true },
    });

    return res.status(200).json({
      success: true,
      message: `Booking ruangan ${booking.room.name} pada ${booking.date} berhasil dibatalkan. Jadwal kini tersedia kembali.`,
      data: cancelled,
    });
  } catch (error: any) {
    console.error('cancelBooking error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membatalkan booking.', error: error.message });
  }
};

// ─── APPROVE / REJECT BOOKING (ADMIN ONLY) ───────────────────────────────

export const approveBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'APPROVE' | 'REJECT'
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat menyetujui atau menolak booking.' });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action harus "APPROVE" atau "REJECT".' });
    }

    const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true, user: true } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });

    if (booking.approvalStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Booking ini tidak dalam status menunggu approval (status saat ini: ${booking.approvalStatus}).`,
      });
    }

    if (action === 'APPROVE') {
      // Cek ulang konflik sebelum approve (mungkin sudah ada booking lain yang masuk)
      const dates = booking.isMultiDay
        ? generateDateRange(booking.date, booking.endDate!)
        : [booking.date];

      const conflict = await checkConflictsForDates(booking.roomId, dates, booking.startTime, booking.endTime, id);
      if (conflict) {
        return res.status(409).json({
          success: false,
          conflict: true,
          message: `Tidak dapat menyetujui: ${conflict.message}`,
          conflictingBooking: conflict.conflictingBooking,
        });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          approvedByUserId: user.id,
          approvedAt: new Date(),
          status: 'CONFIRMED',
        },
        include: { room: true },
      });

      return res.status(200).json({
        success: true,
        message: `Booking "${booking.title}" oleh ${booking.employeeName} (${booking.employeePn}) telah disetujui dan dikonfirmasi.`,
        data: updated,
      });
    } else {
      // REJECT
      if (!rejectionReason?.trim()) {
        return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi.' });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          approvedByUserId: user.id,
          approvedAt: new Date(),
          rejectionReason: rejectionReason.trim(),
          status: 'REJECTED',
        },
        include: { room: true },
      });

      return res.status(200).json({
        success: true,
        message: `Booking "${booking.title}" telah ditolak.`,
        data: updated,
      });
    }
  } catch (error: any) {
    console.error('approveBooking error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses approval.', error: error.message });
  }
};

// ─── GET PENDING APPROVALS (ADMIN ONLY) ──────────────────────────────────

export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        room: true,
        user: { select: { id: true, name: true, pn: true, username: true, division: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar pending approval.', error: error.message });
  }
};

// ─── DOWNLOAD / VIEW NOTA DINAS ──────────────────────────────────────────

export const getNotaDinas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });

    // Hanya pemilik atau admin yang bisa akses nota dinas
    if (user.role !== 'ADMIN' && booking.userId !== user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    if (!booking.notaDinasPath) {
      return res.status(404).json({ success: false, message: 'Nota Dinas tidak tersedia untuk booking ini.' });
    }

    const absolutePath = path.resolve(booking.notaDinasPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File Nota Dinas tidak ditemukan di server.' });
    }

    const filename = booking.notaDinasOriginalName || path.basename(absolutePath);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(absolutePath);
  } catch (error: any) {
    console.error('getNotaDinas error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengakses Nota Dinas.', error: error.message });
  }
};

// ─── GET BOOKINGS (LIST) ─────────────────────────────────────────────────

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { date, floor, roomId, status, userId, search, approvalStatus } = req.query;

    const where: any = {};
    if (date) where.date = date as string;
    if (roomId) where.roomId = roomId as string;
    if (status) where.status = status as string;
    if (userId) where.userId = userId as string;
    if (approvalStatus) where.approvalStatus = approvalStatus as string;
    if (floor) where.room = { floor: parseInt(floor as string, 10) };
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q } },
        { employeeName: { contains: q } },
        { employeePn: { contains: q } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        user: { select: { id: true, name: true, pn: true, username: true, division: true } },
        approvedBy: { select: { name: true, pn: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error: any) {
    console.error('getBookings error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar booking.', error: error.message });
  }
};

// ─── MY BOOKINGS ─────────────────────────────────────────────────────────

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status } = req.query;

    const where: any = { userId: user.id };
    if (status) where.status = status as string;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        approvedBy: { select: { name: true, pn: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat booking saya.', error: error.message });
  }
};

// ─── AVAILABILITY ─────────────────────────────────────────────────────────

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { date, floor } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const roomWhere: any = {};
    if (floor && floor !== 'ALL') roomWhere.floor = parseInt(floor as string, 10);

    const rooms = await prisma.room.findMany({
      where: roomWhere,
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });

    // Ambil booking yang aktif pada tanggal ini
    // Termasuk multi-day booking yang overlap dengan tanggal ini
    const bookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'REJECTED'] },
        OR: [
          // Single-day booking di tanggal ini
          { date: targetDate, isMultiDay: false },
          // Multi-day booking yang mencakup tanggal ini
          { isMultiDay: true, date: { lte: targetDate }, endDate: { gte: targetDate } },
        ],
      },
      include: { user: { select: { name: true, pn: true, division: true } } },
      orderBy: { startTime: 'asc' },
    });

    const hours: string[] = [];
    for (let h = 8; h <= 16; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }

    const roomsWithAvailability = rooms.map((room) => {
      const roomBookings = bookings.filter((b) => b.roomId === room.id);

      const slots = hours.map((slot) => {
        const nextHour = `${(parseInt(slot.split(':')[0], 10) + 1).toString().padStart(2, '0')}:00`;
        const bookingInSlot = roomBookings.find((b) =>
          hasTimeOverlap(b.startTime, b.endTime, slot, nextHour)
        );

        return {
          time: slot,
          endTime: nextHour,
          isBooked: !!bookingInSlot,
          isMaintenance: room.status === 'MAINTENANCE',
          isPendingApproval: bookingInSlot?.status === 'PENDING_APPROVAL',
          isMultiDay: bookingInSlot?.isMultiDay || false,
          booking: bookingInSlot
            ? {
                id: bookingInSlot.id,
                title: bookingInSlot.title,
                employeeName: bookingInSlot.employeeName,
                employeePn: bookingInSlot.employeePn,
                startTime: bookingInSlot.startTime,
                endTime: bookingInSlot.endTime,
                duration: bookingInSlot.duration,
                status: bookingInSlot.status,
                isMultiDay: bookingInSlot.isMultiDay,
                endDate: bookingInSlot.endDate,
                totalDays: bookingInSlot.totalDays,
              }
            : null,
        };
      });

      return { ...room, totalBookings: roomBookings.length, bookings: roomBookings, slots };
    });

    return res.status(200).json({
      success: true,
      date: targetDate,
      floor: floor || 'ALL',
      operatingHours: { start: OPERATING_HOURS_START, maxStart: MAX_START_TIME },
      data: roomsWithAvailability,
    });
  } catch (error: any) {
    console.error('getAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat ketersediaan.', error: error.message });
  }
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [totalRooms, activeRooms, allTodayBookings, totalActiveAllTime, pendingApprovalCount] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'AVAILABLE' } }),
      prisma.booking.findMany({
        where: {
          status: { notIn: ['CANCELLED', 'REJECTED'] },
          OR: [
            { date: today, isMultiDay: false },
            { isMultiDay: true, date: { lte: today }, endDate: { gte: today } },
          ],
        },
        include: { room: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { approvalStatus: 'PENDING' } }),
    ]);

    const occupiedNow = allTodayBookings.filter((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return currentMinutes >= bStart && currentMinutes < bEnd && b.status === 'CONFIRMED';
    });

    const occupiedRoomIds = new Set(occupiedNow.map((b) => b.roomId));
    const availableRoomsNow = activeRooms - occupiedRoomIds.size;

    return res.status(200).json({
      success: true,
      data: {
        today,
        currentTime: minutesToTime(currentMinutes),
        totalRooms,
        activeRooms,
        todayBookingsCount: allTodayBookings.length,
        totalActiveAllTime,
        pendingApprovalCount,
        occupiedRoomsNowCount: occupiedRoomIds.size,
        availableRoomsNowCount: Math.max(0, availableRoomsNow),
        todayBookings: allTodayBookings,
      },
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat ringkasan dashboard.', error: error.message });
  }
};

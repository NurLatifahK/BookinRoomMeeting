// Aturan Jam Operasional Bank Raya
// Jam mulai: 08:00 s.d. 16:00 WIB (terakhir start jam 16:00)
// Hari operasional: Senin s.d. Jumat (Sabtu & Minggu libur / tidak bisa booking)

export const ALLOWED_DURATIONS = [1, 2, 3, 4, 5, 6, 8];
export const OPERATING_HOURS_START = '08:00'; // Jam mulai paling awal: 08:00 WIB
export const MAX_START_TIME = '16:00';         // Jam mulai paling akhir yang diizinkan: 16:00 WIB
export const MIN_BUFFER_MINUTES = 0;           // Tidak ada buffer wajib (booking berurutan boleh)

export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hh = hours.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationHours * 60;
  return minutesToTime(endMinutes);
}

/**
 * Format tanggal ke format YYYY-MM-DD
 */
export function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Cek apakah sebuah tanggal adalah weekend (Sabtu = 6, Minggu = 0)
 */
export function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const dateObj = new Date(y, m - 1, d);
  const day = dateObj.getDay();
  return day === 0 || day === 6;
}

/**
 * Mendapatkan hari kerja berikutnya (Next Business Day / H+1 hari kerja).
 * - Jika hari ini Jumat (5) -> H+1 kerja adalah Senin (+3 hari).
 * - Jika hari ini Sabtu (6) -> Senin (+2 hari).
 * - Jika hari ini Minggu (0) -> Senin (+1 hari).
 * - Hari biasa (Senin-Kamis) -> +1 hari.
 */
export function getNextBusinessDay(from: Date = new Date()): Date {
  const next = new Date(from);
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
  return next;
}

/**
 * Hitung jumlah hari antara dua tanggal (inklusif kedua ujung)
 */
export function calculateTotalDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // inklusif
}

/**
 * Generate array tanggal (YYYY-MM-DD) dari startDate ke endDate
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (current <= end) {
    dates.push(formatDateStr(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Validasi waktu dan tanggal booking:
 * 1. Durasi valid
 * 2. Jam mulai valid (08:00 - 16:00 WIB)
 * 3. Tidak boleh tanggal masa lalu
 * 4. Tidak boleh booking saat akhir pekan (Sabtu & Minggu)
 * 5. Real-time hari ini: tidak bisa booking pada jam yang sedang berjalan atau jam sebelumnya (minimal jam setelahnya)
 * 6. Multi-day tidak boleh mencakup hari libur weekend
 */
export function validateBookingTime(
  dateStr: string,
  startTime: string,
  durationHours: number,
  endDateStr?: string
): { valid: boolean; error?: string; endTime?: string; isMultiDay?: boolean; totalDays?: number } {

  // 1. Durasi
  if (!ALLOWED_DURATIONS.includes(durationHours)) {
    return {
      valid: false,
      error: `Durasi booking tidak valid. Pilihan yang diizinkan: ${ALLOWED_DURATIONS.join(', ')} jam.`,
    };
  }

  // 2. Format jam mulai
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime)) {
    return {
      valid: false,
      error: 'Format jam mulai tidak valid. Gunakan format JJ:MM (misal 08:00).',
    };
  }

  const startMinutes = timeToMinutes(startTime);
  const opStartMinutes = timeToMinutes(OPERATING_HOURS_START);
  const maxStartMinutes = timeToMinutes(MAX_START_TIME);
  const endMinutes = startMinutes + durationHours * 60;
  const endTime = minutesToTime(endMinutes);

  // 3. Batas jam mulai (08:00 s.d. 16:00 WIB)
  if (startMinutes < opStartMinutes) {
    return {
      valid: false,
      error: `Jam mulai tidak boleh sebelum pukul ${OPERATING_HOURS_START} WIB.`,
    };
  }

  if (startMinutes > maxStartMinutes) {
    return {
      valid: false,
      error: `Jam mulai maksimal adalah pukul ${MAX_START_TIME} WIB. Anda memilih ${startTime}.`,
    };
  }

  // 4. Cek format tanggal & masa lalu
  const now = new Date();
  const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
  if (!year || !month || !day) {
    return { valid: false, error: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.' };
  }

  const bookingDate = new Date(year, month - 1, day);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (bookingDate < todayDate) {
    return {
      valid: false,
      error: 'Tidak dapat melakukan booking untuk tanggal yang sudah lewat.',
    };
  }

  // 5. ATURAN WEEKEND: Tidak bisa booking saat weekend (Sabtu & Minggu)
  if (isWeekend(dateStr)) {
    const dayName = bookingDate.getDay() === 6 ? 'Sabtu' : 'Minggu';
    return {
      valid: false,
      error: `Pemesanan ruang meeting tidak dapat dilakukan pada akhir pekan (${dayName}). Kantor Bank Raya libur pada hari Sabtu dan Minggu. Silakan pilih hari kerja (Senin–Jumat).`,
    };
  }

  // Cek jika multi-day: tidak boleh ada weekend di dalam rentang
  if (endDateStr && endDateStr !== dateStr) {
    const allDates = generateDateRange(dateStr, endDateStr);
    const weekendDate = allDates.find((d) => isWeekend(d));
    if (weekendDate) {
      const [wy, wm, wd] = weekendDate.split('-').map(Number);
      const wObj = new Date(wy, wm - 1, wd);
      const wDayName = wObj.getDay() === 6 ? 'Sabtu' : 'Minggu';
      return {
        valid: false,
        error: `Rentang pemesanan mencakup hari libur akhir pekan (${wDayName}, ${weekendDate}). Kantor Bank Raya tutup pada akhir pekan.`,
      };
    }
  }

  // 6. ATURAN REAL-TIME HARI INI:
  // "jika memilih di hari yang sama tidak bisa di jam saat itu ataupun sebelumnya, jadi bisanya jam setelahnya."
  if (bookingDate.getTime() === todayDate.getTime()) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Jam saat itu atau sebelumnya tidak bisa dipilih:
    // Contoh: waktu sekarang 10:15 WIB. Jam 10:00 dan jam sebelumnya (08:00, 09:00) tidak boleh.
    // Jam mulai paling awal yang diizinkan adalah minimal jam 11:00 WIB (currentHour + 1).
    const earliestAllowedHour = currentHour + 1;
    const earliestAllowedMinutes = earliestAllowedHour * 60;

    if (startMinutes < earliestAllowedMinutes) {
      const currentFormatted = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      if (earliestAllowedHour > 16) {
        return {
          valid: false,
          error: `Waktu saat ini adalah ${currentFormatted} WIB. Pemesanan untuk hari ini sudah ditutup karena jam mulai paling akhir adalah pukul ${MAX_START_TIME} WIB. Silakan lakukan booking untuk hari kerja berikutnya.`,
        };
      }
      return {
        valid: false,
        error: `Pemesanan di hari yang sama tidak dapat dilakukan pada jam saat ini (${String(currentHour).padStart(2, '0')}:00 WIB) ataupun sebelumnya (saat ini ${currentFormatted} WIB). Jam mulai paling awal yang dapat dipesan adalah pukul ${String(earliestAllowedHour).padStart(2, '0')}:00 WIB.`,
      };
    }
  }

  // 7. Multi-day calculation
  let isMultiDay = false;
  let totalDays = 1;

  if (endDateStr && endDateStr !== dateStr) {
    const endDateObj = new Date(endDateStr);
    if (endDateObj < bookingDate) {
      return {
        valid: false,
        error: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
      };
    }
    totalDays = calculateTotalDays(dateStr, endDateStr);
    isMultiDay = totalDays > 1;
  }

  return {
    valid: true,
    endTime,
    isMultiDay,
    totalDays,
  };
}

export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const minAStart = timeToMinutes(startA);
  const minAEnd = timeToMinutes(endA);
  const minBStart = timeToMinutes(startB);
  const minBEnd = timeToMinutes(endB);

  return minAStart < minBEnd && minAEnd > minBStart;
}

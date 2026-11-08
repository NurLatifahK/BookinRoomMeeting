export type Role = 'ADMIN' | 'PEGAWAI';

export interface User {
  id: string;
  username: string;
  name: string;
  pn: string;
  role: Role;
  division: string;
}

export type RoomStatus = 'AVAILABLE' | 'MAINTENANCE';

export interface Room {
  id: string;
  name: string;
  floor: number;
  code: string;
  capacity: number;
  facilities: string;
  status: RoomStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'PENDING_APPROVAL' | 'REJECTED';
export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Booking {
  id: string;
  title: string;
  description?: string | null;
  userId: string;
  employeeName: string;
  employeePn: string;
  roomId: string;
  room?: Room;
  date: string;        // YYYY-MM-DD (tanggal mulai)
  startTime: string;   // HH:mm
  duration: number;
  endTime: string;     // HH:mm
  isMultiDay: boolean;
  endDate?: string | null;   // YYYY-MM-DD (tanggal akhir, null jika single-day)
  totalDays: number;
  notaDinasPath?: string | null;
  notaDinasOriginalName?: string | null;
  approvalStatus: ApprovalStatus;
  approvedByUserId?: string | null;
  approvedBy?: { name: string; pn: string } | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  status: BookingStatus;
  cancelledReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    pn: string;
    username: string;
    division: string;
  };
}

export interface HourlySlot {
  time: string;
  endTime: string;
  isBooked: boolean;
  isMaintenance: boolean;
  isPendingApproval?: boolean;
  isMultiDay?: boolean;
  booking?: {
    id: string;
    title: string;
    employeeName: string;
    employeePn: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
    isMultiDay?: boolean;
    endDate?: string | null;
    totalDays?: number;
  } | null;
}

export interface RoomAvailability extends Room {
  totalBookings: number;
  bookings: Booking[];
  slots: HourlySlot[];
}

export interface DashboardStats {
  today: string;
  currentTime: string;
  totalRooms: number;
  activeRooms: number;
  todayBookingsCount: number;
  totalActiveAllTime: number;
  pendingApprovalCount: number;
  occupiedRoomsNowCount: number;
  availableRoomsNowCount: number;
  todayBookings: Booking[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  conflict?: boolean;
  conflictingBooking?: any;
  requiresApproval?: boolean;
}

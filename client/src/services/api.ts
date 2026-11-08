import { ApiResponse } from '../types';

const BASE_URL = '/api';

export class ApiError extends Error {
  conflict?: boolean;
  conflictingBooking?: any;
  status: number;

  constructor(message: string, status: number, conflict = false, conflictingBooking?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.conflict = conflict;
    this.conflictingBooking = conflictingBooking;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('raya_auth_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeadersNoContentType(): HeadersInit {
  const token = localStorage.getItem('raya_auth_token');
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    message: 'Gagal memproses respon dari server.',
  }));

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || 'Terjadi kesalahan pada sistem.',
      response.status,
      data.conflict,
      data.conflictingBooking
    );
  }

  return (data.data !== undefined ? data.data : data) as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<any>('/auth/me'),

  // Rooms
  getRooms: (params?: { floor?: number | string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.floor) query.append('floor', params.floor.toString());
    if (params?.status) query.append('status', params.status);
    return request<any[]>(`/rooms?${query.toString()}`);
  },
  getRoomById: (id: string) => request<any>(`/rooms/${id}`),
  updateRoom: (id: string, payload: any) =>
    request<any>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Bookings - Availability & Stats
  getAvailability: (params: { date?: string; floor?: number | string }) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.floor) query.append('floor', params.floor.toString());
    return request<any[]>(`/bookings/availability?${query.toString()}`);
  },
  getDashboardStats: () => request<any>('/bookings/stats'),

  // Bookings - List
  getBookings: (params?: {
    date?: string; roomId?: string; floor?: number | string;
    status?: string; userId?: string; search?: string; approvalStatus?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, v.toString());
      });
    }
    return request<any[]>(`/bookings?${query.toString()}`);
  },
  getMyBookings: (status?: string) => {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    return request<any[]>(`/bookings/my?${query.toString()}`);
  },

  // Bookings - Create (supports FormData for file upload)
  createBooking: async (payload: {
    roomId: string;
    date: string;
    endDate?: string;
    startTime: string;
    duration: number;
    title: string;
    description?: string;
    notaDinas?: File; // file upload opsional
  }) => {
    const token = localStorage.getItem('raya_auth_token');
    const formData = new FormData();
    formData.append('roomId', payload.roomId);
    formData.append('date', payload.date);
    if (payload.endDate) formData.append('endDate', payload.endDate);
    formData.append('startTime', payload.startTime);
    formData.append('duration', payload.duration.toString());
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    if (payload.notaDinas) formData.append('notaDinas', payload.notaDinas);

    const response = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data: ApiResponse<any> = await response.json().catch(() => ({
      success: false,
      message: 'Gagal memproses respon dari server.',
    }));

    if (!response.ok || !data.success) {
      throw new ApiError(data.message || 'Gagal booking.', response.status, data.conflict, data.conflictingBooking);
    }

    return { data: data.data, message: data.message, requiresApproval: data.requiresApproval };
  },

  // Bookings - Update & Cancel
  updateBooking: (id: string, payload: any) =>
    request<any>(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancelBooking: (id: string, reason?: string) =>
    request<any>(`/bookings/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  // Admin - Approval
  getPendingApprovals: () => request<any[]>('/bookings/pending-approvals'),
  approveBooking: (id: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) =>
    request<any>(`/bookings/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ action, rejectionReason }),
    }),

  // Nota Dinas URL (open in new tab)
  getNotaDinasUrl: (bookingId: string) => `${BASE_URL}/bookings/${bookingId}/nota-dinas`,
};

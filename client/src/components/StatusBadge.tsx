import React from 'react';
import { BookingStatus, ApprovalStatus } from '../types';

interface StatusBadgeProps {
  status: BookingStatus | ApprovalStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'AVAILABLE':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-[#00529C] border border-blue-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00529C] animate-pulse" />
          Tersedia
        </span>
      );
    case 'MAINTENANCE':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pemeliharaan
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-[#00529C] border border-blue-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00529C]" />
          Terkonfirmasi
        </span>
      );
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Menunggu Approval
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Dibatalkan
        </span>
      );
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          Ditolak
        </span>
      );
    case 'APPROVED':
    case 'NOT_REQUIRED':
      return null;
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

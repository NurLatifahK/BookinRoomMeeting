import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { BookingPage } from './pages/BookingPage';
import { MyBookingPage } from './pages/MyBookingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Loader2, Building2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('availability');
  const [pageParams, setPageParams] = useState<any>(null);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-[#00529C] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-200">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Memuat Portal Bank Raya...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      {/* 1. Sidebar Menu Vertikal Sisi Kiri (Biru Bank Raya) */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* 2. Area Konten Utama Sisi Kanan (Clean & Terang) */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {(currentPage === 'dashboard' || currentPage === 'availability') && (
            <AvailabilityPage
              onNavigate={handleNavigate}
              initialFloor={pageParams?.floor}
            />
          )}
          {currentPage === 'booking' && (
            <BookingPage
              onNavigate={handleNavigate}
              initialParams={pageParams}
            />
          )}
          {currentPage === 'my-bookings' && <MyBookingPage onNavigate={handleNavigate} />}
          {currentPage === 'admin' && <AdminDashboardPage />}
        </main>

        {/* Clean Corporate Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#00529C]">bank raya</span>
              <span>&bull;</span>
              <span>RayaMeetingRoom Management</span>
            </div>
            <div>
              Kantor Pusat PT Bank Raya Indonesia Tbk &bull; Lantai 12, 15, 16, 17, 19
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { error, success } = useNotification();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      error('Input Kurang Lengkap', 'Silakan masukkan email / personal number dan password Anda.');
      return;
    }

    try {
      setLoading(true);
      await login({ username: identifier.trim(), password });
      success('Selamat Datang!', 'Login berhasil ke Portal Raya Meeting Room.');
    } catch (err: any) {
      error('Gagal Masuk', err.message || 'Periksa kembali email/PN dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userPn: string, pass: string) => {
    setIdentifier(userPn);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#D9EAFD] via-[#F8F9FA] to-[#FFE6D4]">
      {/* Soft Ambient Blur Elements (Nuansa Langit Biru - Oranye Cerah) */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-sky-300/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-[560px] h-[560px] bg-orange-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />

      {/* Main Login Container */}
      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        {/* Single Rounded White Card */}
        <div className="w-full bg-white rounded-3xl shadow-2xl shadow-slate-400/20 border border-white/90 p-7 sm:p-10 backdrop-blur-sm">
          {/* Header Kartu: Judul "Masuk" di Sisi Kiri & Logo Resmi Bank Raya di Sisi Kanan */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
            {/* Sisi Kiri: Judul Masuk & Subteks */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Masuk
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Lengkapi informasi untuk mengakses Raya Meeting Room
              </p>
            </div>

            {/* Sisi Kanan: Logo resmi Bank Raya (Biru Tua) dengan teks MEETING ROOM di bawahnya */}
            <div className="flex flex-col items-end flex-shrink-0">
              {/* Container Logo Bank Raya */}
              <div className="mb-2">
                <svg
                  viewBox="0 0 160 64"
                  className="h-11 w-auto"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Teks "bank" kecil di atas */}
                  <text
                    x="2"
                    y="14"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    fontSize="13"
                    fontWeight="800"
                    fill="#00529C"
                    letterSpacing="-0.3px"
                  >
                    bank
                  </text>

                  {/* Teks "raya" besar di bawah "bank" */}
                  <text
                    x="2"
                    y="41"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    fontSize="29"
                    fontWeight="900"
                    fill="#00529C"
                    letterSpacing="-0.8px"
                  >
                    raya
                  </text>

                  {/* Lengkungan senyum khas Bank Raya di bawah huruf raya */}
                  <path
                    d="M 4 47 C 22 55, 48 55, 68 47"
                    stroke="#00529C"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Teks "BRI group" kecil di bagian kiri bawah */}
                  <text
                    x="3"
                    y="60"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    fontSize="7.5"
                    fill="#00529C"
                    fillOpacity="0.88"
                    letterSpacing="0.4px"
                  >
                    <tspan fontWeight="900">BRI</tspan> group
                  </text>
                </svg>
              </div>

              {/* Teks "MEETING ROOM" di bawah logo baru, terpisah rapi tanpa bertabrakan */}
              <span className="text-[10px] font-bold tracking-widest text-[#00529C] uppercase">
                MEETING ROOM
              </span>
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Field 1: Email / Personal Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00529C]" />
                <span>Email / Personal Number</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan email atau personal number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                  required
                />
              </div>
            </div>

            {/* Field 2: Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#00529C]" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#00529C] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Aksi: Masuk (Solid Blue Bank Raya #00529B) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-[#00529B] hover:bg-[#00427e] shadow-lg shadow-blue-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Chips (Akses Cepat Pengujian) */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-600">
              <KeyRound className="w-3.5 h-3.5 text-[#00529C]" />
              <span>Akses Cepat Pengujian Akun:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('BR-10294', 'Raya123')}
                className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/60 hover:bg-blue-100/70 text-left transition group"
              >
                <div className="text-[11px] font-bold text-[#00529C] truncate">Budi Santoso</div>
                <div className="text-[10px] text-slate-500 font-mono">BR-10294 &bull; Pegawai</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('BR-10385', 'Raya123')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition"
              >
                <div className="text-[11px] font-bold text-slate-800 truncate">Siti Rahmawati</div>
                <div className="text-[10px] text-slate-500 font-mono">BR-10385 &bull; Pegawai</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.raya', 'Admin123')}
                className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-100/70 text-left transition"
              >
                <div className="text-[11px] font-bold text-indigo-900 truncate">Admin Raya</div>
                <div className="text-[10px] text-indigo-600 font-mono">ADM-001 &bull; Admin</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Hak Cipta */}
        <p className="text-xs text-slate-400 mt-6 text-center select-none">
          &copy; 2026 PT. Bank Raya Indonesia Tbk &bull; Raya Meeting Room
        </p>
      </div>
    </div>
  );
};

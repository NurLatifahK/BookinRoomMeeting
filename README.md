# 🏦 Bank Raya Meeting Room Booking System

Sistem Manajemen Pemesanan Ruang Meeting Internal Bank Raya berbasis web modern, responsif, dan terpusat. Sistem ini dirancang untuk menggantikan pencatatan manual via spreadsheet dengan validasi otomatis bentrok jadwal (*conflict detection*), kalkulasi durasi instan via dropdown Jam Mulai dan Jam Berakhir, manajemen approval berjenjang dengan Nota Dinas untuk reservasi multi-hari, validasi kalender operasional hari kerja (Senin–Jumat) dengan dropdown tanggal otomatis menonaktifkan akhir pekan, aturan real-time jam berjalan, pembatasan akses berbasis peran (*Role-Based Access Control*), serta antarmuka korporat profesional dengan nuansa warna khas biru Bank Raya (`#00529C`).

> 📊 **Dokumentasi Flowchart Lengkap:** Silakan lihat [FLOWCHART.md](file:///d:/.RAYA/Kompre/booking-room-meeting/FLOWCHART.md) untuk melihat diagram alur reservasi pegawai, alur approval admin & peninjauan Nota Dinas, algoritma validasi bentrok jadwal, dan matriks kewenangan peran.

---

## 📌 Ringkasan Fitur & Aturan Bisnis Terbaru

1. **Hari Kerja Operasional & Larangan Booking Akhir Pekan (Weekend):**
   - Kantor operasional Bank Raya buka pada hari **Senin s.d. Jumat**.
   - **TIDAK BISA BOOKING SAAT WEEKEND (SABTU & MINGGU):** Backend membaca waktu kalender secara real-time dan secara ketat menolak reservasi pada hari Sabtu dan Minggu (baik booking 1 hari maupun dalam rentang multi-hari).
   - Seluruh data jadwal lama di akhir pekan telah dibersihkan secara permanen dari database.
2. **Dropdown Tanggal Booking (Disabled Akhir Pekan):**
   - Pemilihan tanggal booking pada form reservasi (*Single-Day* maupun *Multi-Day*) menggunakan **Dropdown (`<select>`)**.
   - Hari Sabtu dan Minggu otomatis berlabel `[AKHIR PEKAN - LIBUR]` dengan status `disabled` sehingga tidak dapat diklik atau dipilih oleh pengguna.
3. **Ketentuan H+1 Hari Kerja (Business Day Logic):**
   - Perhitungan H+1 mengacu pada hari kerja berikutnya.
   - **Jika pegawai login / memesan pada hari Jumat**, maka opsi hari kerja berikutnya (**H+1**) jatuh pada hari **Senin** (melewati Sabtu dan Minggu). Sistem menyediakan tombol cepat untuk langsung memilih hari Senin.
4. **Ketentuan Jam Booking di Hari yang Sama (Real-Time Hour Restriction):**
   - **Tidak bisa booking di jam saat ini ataupun sebelumnya:** Pemesanan di hari yang sama hanya dapat dimulai pada **jam setelahnya** (minimal `Jam_Sekarang + 1`:00 WIB). Contoh: jika waktu saat ini pukul 10:15 WIB, maka jam 10:00 dan jam sebelumnya (08:00, 09:00) tidak dapat dipilih; jam mulai paling awal adalah pukul 11:00 WIB.
   - **Batas Jam Mulai Maksimal:** Pukul **16:00 WIB**. Jika waktu saat ini sudah mencapai atau melewati pukul 16:00 WIB, pemesanan untuk hari ini otomatis ditutup dan pegawai diarahkan untuk memesan hari kerja berikutnya.
5. **Dropdown Jam Mulai & Jam Berakhir:**
   - Pemilihan waktu pertemuan menggunakan dropdown **Jam Mulai** (08:00–16:00 WIB) dan dropdown **Jam Berakhir** (menampilkan pilihan jam selesai terhitung otomatis tanpa perlu tombol pemilih durasi terpisah).
   - **Batas Jam Selesai:** **TIDAK ADA batasan jam selesai maksimal di 16:30 WIB**. Rapat yang dimulai pukul 16:00 WIB dapat berlangsung melewati jam kantor sesuai kebutuhan agenda rapat.
6. **Aturan Booking 1 Hari vs Multi-Hari:**
   - **Booking 1 Hari (Single-Day):** Jika rekan memesan hanya di 1 hari yang sama, reservasi **TIDAK MEMERLUKAN APPROVAL ADMIN**. Status langsung terbit sebagai `CONFIRMED`.
   - **Booking > 1 Hari (Multi-Day):** Jika pemesanan mencakup lebih dari 1 hari kerja, pemesan **WAJIB MENGUNGGAH NOTA DINAS** (format PDF, JPG, atau PNG, maks. 5 MB) dan reservasi **WAJIB MENDAPAT APPROVAL ADMIN**. Status awal adalah `PENDING_APPROVAL` hingga Admin menyetujui.
7. **Role & Batasan Akses Pengguna:**
   - **Pegawai:** Login, melihat matriks ketersediaan ruangan interaktif, membuat reservasi (Nama & PN otomatis terisi dari akun), mengunggah Nota Dinas untuk booking multi-hari, serta melihat status approval, mengedit jadwal, dan membatalkan booking miliknya sendiri.
   - **Admin:** Memantau seluruh booking perusahaan, meninjau file Nota Dinas, menyetujui (*Approve*) atau menolak (*Reject*) booking multi-hari dengan alasan wajib, membatalkan booking bermasalah atas nama pegawai, serta mengelola data 15 ruangan (nama, kapasitas, fasilitas, status operasional/pemeliharaan).
   - **Ketentuan Penting Admin:** **Admin TIDAK BISA membuat booking ruang meeting.** Sudut pandang (*POV*) Admin difokuskan murni untuk monitoring ketersediaan, approval nota dinas, dan tata kelola fasilitas. Jika Admin ingin memesan, dapat menggunakan akun pegawai lain.
8. **Struktur Navigasi Bersih & Branding Korporat:**
   - **Menu Dashboard ditiadakan**; pegawai dan admin langsung diarahkan ke menu operasional utama: **Jadwal & Ketersediaan** (Matriks 15 Ruangan).
   - Menu navigasi tersusun ringkas:
     1. **Jadwal & Ketersediaan**
     2. **Booking Ruangan**
     3. **Booking Saya**
     4. **Admin Panel** *(khusus Admin)*
   - **Sidebar Header:** Menampilkan logo resmi Bank Raya full putih dengan margin bawah lega (`mb-6` / 24px) sehingga subteks **"MEETING ROOM"** berada rapi di bawah tanpa tertimpa lengkungan senyum maupun teks `BRI group`.
   - **Login Card Header:** Menampilkan logo resmi Bank Raya warna biru pekat (`#00529C`) dengan teks kapital **"MEETING ROOM"** di bawahnya secara proporsional.

---

## 🔑 Akun Dummy Pengujian

Sistem telah di-seed dengan akun bawaan untuk pengujian role:

| Role | Username / Identifier | Password | Nama Lengkap | Personal Number (PN) | Divisi | Hak Booking |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Pegawai 1** | `BR-10294` / `pegawai001` | `Raya123` | Budi Santoso | BR-10294 | Digital Banking | ✅ *(Bisa Booking)* |
| **Pegawai 2** | `BR-10385` / `pegawai002` | `Raya123` | Siti Rahmawati | BR-10385 | Risk Management & Compliance | ✅ *(Bisa Booking)* |
| **Admin** | `admin.raya` | `Admin123` | Admin Raya | ADM-001 | Corporate Secretariat & GA | ❌ *(Hanya Approval & Monitor)* |

> *Catatan: Pada halaman Login tersedia tombol cepat (Quick Login Chips) untuk langsung login tanpa mengetik identitas dan password.*

---

## 🛠️ Arsitektur & Teknologi

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express, TypeScript, Multer (file upload Nota Dinas), JWT, bcryptjs
- **Database & ORM:** Prisma ORM dengan SQLite (zero-config, siap jalan) dan skema PostgreSQL ready
- **Tooling:** tsx, TypeScript 5, Node Process Manager

---

## 🚀 Panduan Instalasi dan Menjalankan Aplikasi

### Prasyarat
- **Node.js** versi 18.0.0 atau lebih tinggi (disarankan Node.js v20+)
- **npm** versi 9.0.0 atau lebih tinggi

### Langkah 1: Masuk ke Folder Project
```bash
cd d:\.RAYA\Kompre\booking-room-meeting
```

### Langkah 2: Inisialisasi Database (SQLite Zero-Config)
Untuk sinkronisasi skema dan memasukkan data dummy (15 ruangan dan akun pengujian):
```bash
npm run db:init
```

### Langkah 3: Menjalankan Aplikasi
Cukup jalankan satu perintah dari root folder:
```bash
npm run dev
```
Script `start-dev.js` akan otomatis menjalankan backend Express API (`http://localhost:5000`) dan frontend Vite client (`http://localhost:5173`) secara bersamaan.

Buka browser Anda di:
👉 **http://localhost:5173**

---

&copy; 2026 PT Bank Raya Indonesia Tbk. Sistem Pengelolaan Ruang Rapat Internal Kantor Pusat.

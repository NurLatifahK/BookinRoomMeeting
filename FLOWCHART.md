# 📋 Diagram Alur Bisnis (SOP): Sistem Reservasi Ruang Rapat Bank Raya

Dokumen ini memuat **alur proses bisnis**, **Standar Operasional Prosedur (SOP)**, dan **diagram flowchart resmi** penggunaan aplikasi *Meeting Room Booking System* PT Bank Raya Indonesia Tbk, yang telah disesuaikan dengan seluruh **ketentuan operasional real-time, aturan hari kerja, pembersihan data akhir pekan, dan antarmuka UI/UX terbaru**.

---

## 📌 Ketentuan Pokok Operasional & Bisnis (Terbaru)

1. **Hari Kerja Operasional & Larangan Booking Akhir Pekan (Weekend):**
   - Kantor operasional Bank Raya buka pada hari **Senin s.d. Jumat**.
   - **TIDAK BISA BOOKING SAAT WEEKEND (SABTU & MINGGU):** Backend memvalidasi kalender secara real-time. Sistem menolak pemesanan untuk hari Sabtu dan Minggu (baik booking 1 hari maupun dalam rentang multi-hari).
   - Seluruh data pemesanan di hari Sabtu dan Minggu telah dibersihkan secara permanen dari database.
2. **Dropdown Pemilihan Tanggal Booking (Weekend Disabled):**
   - Pemilihan tanggal booking pada form reservasi menggunakan **Dropdown (`<select>`)**.
   - Hari Sabtu dan Minggu ditandai `[AKHIR PEKAN - LIBUR]` dengan status **`disabled`**, sehingga tidak dapat diklik atau dipilih oleh pengguna.
3. **Ketentuan H+1 Hari Kerja (Business Day Logic):**
   - Perhitungan H+1 mengacu pada hari kerja berikutnya.
   - **Jika pegawai login / memesan pada hari Jumat**, maka opsi hari kerja berikutnya (**H+1**) jatuh pada hari **Senin** (melewati hari Sabtu dan Minggu). Tersedia tombol cepat *"Pilih H+1 Kerja (Senin)"*.
4. **Ketentuan Jam Booking di Hari yang Sama (Real-Time Hour Restriction):**
   - **Tidak bisa booking di jam saat ini ataupun sebelumnya:** Pemesanan di hari yang sama hanya dapat dimulai pada **jam setelahnya** (minimal `Jam_Sekarang + 1`:00 WIB). Contoh: jika waktu saat ini pukul 10:15 WIB, maka jam 10:00 dan jam sebelumnya (08:00, 09:00) tidak dapat dipilih; jam mulai paling awal adalah pukul 11:00 WIB.
   - **Batas Jam Mulai Maksimal:** Pukul **16:00 WIB**. Jika waktu saat ini sudah mencapai atau melewati pukul 16:00 WIB, pemesanan untuk hari ini otomatis ditutup dan pegawai diarahkan untuk memesan hari kerja berikutnya.
5. **Pemilihan Waktu Pertemuan:**
   - Pemilihan waktu menggunakan dropdown **Jam Mulai** (08:00 – 16:00 WIB) dan dropdown **Jam Berakhir** (durasi rapat 1–8 jam terhitung otomatis tanpa perlu memilih tombol durasi terpisah).
   - **Batas Jam Selesai:** **TIDAK ADA batasan jam selesai maksimal di 16:30 WIB**. Rapat yang dimulai pukul 16:00 WIB dapat berlangsung melewati jam kantor sesuai kebutuhan agenda.
6. **Aturan Booking 1 Hari (Single-Day):**
   - Pemesanan pada 1 hari kerja yang sama **TIDAK MEMERLUKAN APPROVAL ADMIN**.
   - Jadwal langsung terbit dengan status **CONFIRMED** secara otomatis jika tidak bentrok.
7. **Aturan Booking > 1 Hari (Multi-Day):**
   - Pemesanan lebih dari 1 hari kerja **WAJIB UPLOAD NOTA DINAS** (format PDF, JPG, atau PNG, maks. 5 MB) dan tidak boleh mencakup hari Sabtu atau Minggu.
   - Memerlukan **APPROVAL ADMIN** (*Status awal: PENDING_APPROVAL*). Slot baru resmi terkunci setelah diverifikasi dan disetujui Admin.
8. **Batasan Peran Admin (POV Admin):**
   - **Admin TIDAK BISA melakukan booking ruang meeting**. Jika Admin ingin memesan, pemesanan dilakukan melalui akun pegawai lain.
   - Sudut pandang (*POV*) Admin difokuskan murni untuk:
     1. Memantau matriks ketersediaan dan jadwal seluruh divisi.
     2. Meninjau Nota Dinas dan menyetujui/menolak permohonan booking multi-hari.
     3. Mengelola data 15 ruang meeting (kapasitas, fasilitas, dan status *maintenance*).
     4. Membatalkan booking bermasalah atas nama pegawai jika diperlukan.
9. **Struktur Navigasi Bersih & Branding:**
   - Menu **Dashboard ditiadakan**; pegawai dan admin langsung diarahkan ke menu operasional utama: **Jadwal & Ketersediaan**.
   - Header sidebar menampilkan **Logo Resmi Bank Raya Full Putih** dengan container berjarak lega (`mb-6` / 24px) sehingga subteks **"MEETING ROOM"** berada rapi di bawah tanpa tertimpa lengkungan senyum maupun teks `BRI group`.
   - Card Login menampilkan **Logo Resmi Bank Raya Biru Tua** (`#00529C`) dengan teks **"MEETING ROOM"** di bawahnya secara proporsional.

---

## 📑 Daftar Alur Proses Bisnis

1. [Alur 1: Reservasi Ruang Rapat oleh Pegawai (Dropdown Hari Kerja & Real-Time)](#1-alur-reservasi-ruang-rapat-oleh-pegawai-dropdown-hari-kerja--real-time)
2. [Alur 2: Proses Bisnis Admin (Approval & View Nota Dinas)](#2-proses-bisnis-admin-approval--view-nota-dinas)
3. [Alur 3: Aturan Bisnis Validasi Sistem (Real-Time, Weekend & Anti-Bentrok)](#3-aturan-bisnis-validasi-sistem-real-time-weekend--anti-bentrok)
4. [Alur 4: Perubahan Jadwal (Reschedule) & Pembatalan Booking](#4-perubahan-jadwal-reschedule--pembatalan-booking)
5. [Alur 5: Pemeliharaan Ruangan (Maintenance Lock) oleh Admin](#5-pemeliharaan-ruangan-maintenance-lock-oleh-admin)
6. [Alur 6: Matriks Kewenangan (Pegawai vs Admin)](#6-matriks-kewenangan-pegawai-vs-admin)
7. [Tabel Ringkasan SOP & Ketentuan Operasional](#tabel-ringkasan-sop--ketentuan-operasional)

---

## 1. Alur Reservasi Ruang Rapat oleh Pegawai (Dropdown Hari Kerja & Real-Time)

Diagram ini menggambarkan alur end-to-end pegawai saat memesan ruangan, termasuk percabangan reservasi 1 hari (auto-confirmed) dan >1 hari (wajib upload Nota Dinas & butuh approval Admin), pemilihan tanggal via dropdown dengan disabled weekend, serta validasi waktu real-time:

```mermaid
flowchart TD
    Start(["Pegawai Membutuhkan Ruangan"]) --> Login["Masuk ke Portal Raya Meeting Room<br/>(Contoh: Budi Santoso / Siti Rahmawati)"]
    Login --> CekSlot["Melihat Matriks Jadwal & Ketersediaan<br/>(15 Ruang di Lantai 12, 15, 16, 17, 19)"]
    CekSlot --> BukaForm["Buka Form Booking Ruangan"]
    
    BukaForm --> PilihTipe{"Pilih Jenis Durasi Hari Booking"}
    
    %% Alur 1 Hari
    PilihTipe -- "1 Hari (Hari Kerja yang Sama)" --> FormSingle["Isi Form Single-Day:<br/>- Pilih Tanggal Booking via Dropdown (Sabtu & Minggu Disabled)<br/>- Dropdown Jam Mulai (08:00 - 16:00 WIB)<br/>- Dropdown Jam Berakhir (Durasi otomatis)<br/>- Judul Agenda Rapat"]
    FormSingle --> CekJamHariIni{"Apakah Booking Hari Ini?"}
    CekJamHariIni -- "Ya" --> FilterJam["Sistem Filter Dropdown Jam Mulai:<br/>Hanya tampil jam setelah waktu saat ini<br/>(Jam berjalan & sebelumnya dinonaktifkan)"]
    CekJamHariIni -- "Tidak (Hari Kerja Depan)" --> NormalJam["Tampil Semua Jam (08:00 - 16:00 WIB)"]
    FilterJam --> SubmitSingle["Klik 'Konfirmasi Booking'"]
    NormalJam --> SubmitSingle
    
    SubmitSingle --> ValidasiSingle{"Validasi Sistem:<br/>- Bukan hari Sabtu/Minggu?<br/>- Jam mulai > jam saat ini?<br/>- Ada bentrok jadwal di tanggal & jam tsb?"}
    ValidasiSingle -- "Ada Bentrok / Invalid" --> TolakSingle["Tampilkan Pesan Peringatan & Saran"]
    TolakSingle --> FormSingle
    ValidasiSingle -- "Lolos Validasi" --> AutoApprove["Sistem Otomatis Terbitkan:<br/>Status: CONFIRMED (Tanpa Approval Admin)"]
    AutoApprove --> SelesaiSingle(["Ruangan Siap Digunakan Sesuai Jadwal"])
    
    %% Alur Multi-Hari
    PilihTipe -- "> 1 Hari (Multi-Day)" --> FormMulti["Isi Form Multi-Day:<br/>- Dropdown Tanggal Mulai & Tanggal Selesai (Weekend Disabled)<br/>- Dropdown Jam Mulai (08:00 - 16:00 WIB)<br/>- Dropdown Jam Berakhir (Durasi otomatis)<br/>- Judul Agenda Rapat<br/>- Upload File Nota Dinas (PDF/JPG/PNG max 5MB)"]
    FormMulti --> SubmitMulti["Klik 'Kirim Permohonan & Nota Dinas'"]
    SubmitMulti --> ValidasiMulti{"Validasi Sistem:<br/>- File Nota Dinas terlampir?<br/>- Rentang tanggal bebas Sabtu/Minggu?<br/>- Bebas bentrok di semua tanggal?"}
    ValidasiMulti -- "Gagal Validasi" --> TolakMulti["Tampilkan Pesan Error / Notifikasi Bentrok"]
    TolakMulti --> FormMulti
    ValidasiMulti -- "Lolos Validasi Awal" --> PendingAdmin["Booking Disimpan dengan:<br/>Status: PENDING_APPROVAL<br/>(Masuk antrean review Admin)"]
    PendingAdmin --> TungguAdmin(["Pegawai Menunggu Keputusan Approval Admin"])
```

---

## 2. Proses Bisnis Admin (Approval & View Nota Dinas)

Diagram alur proses kerja Admin dalam meninjau booking multi-hari, melihat dokumen Nota Dinas, dan mengambil keputusan persetujuan/penolakan:

```mermaid
flowchart TD
    AdminStart(["Admin Masuk ke Sistem (admin.raya)"]) --> AdminPanel["Buka Menu 'Admin Panel'"]
    AdminPanel --> TabApproval["Buka Tab 'Approval Nota Dinas'"]
    TabApproval --> CekAntrean{"Apakah Ada Booking<br/>Status PENDING_APPROVAL?"}
    
    CekAntrean -- "Tidak Ada" --> Standby["Tampil Status: 'Semua Permohonan Telah Diproses'"]
    
    CekAntrean -- "Ada Pengajuan" --> ReviewItem["Pilih Data Pengajuan Multi-Hari:<br/>- Nama Pemesan & PN<br/>- Divisi Pegawai<br/>- Ruangan & Periode Tanggal Hari Kerja<br/>- Jam & Durasi"]
    
    ReviewItem --> BukaNotaDinas["Klik Tombol 'Buka Nota Dinas'<br/>(File PDF/Gambar terbuka di tab baru)"]
    BukaNotaDinas --> EvaluasiNota{"Pemeriksaan Dokumen:<br/>Apakah Nota Dinas valid & sesuai urgensi dinas?"}
    
    %% Keputusan Setuju
    EvaluasiNota -- "Sesuai & Disetujui" --> KlikApprove["Klik 'Setujui Booking'"]
    KlikApprove --> CekBentrokBaru{"Sistem Cek Bentrok Real-Time Terkini:<br/>Apakah ada booking lain yang baru masuk?"}
    CekBentrokBaru -- "Ada Bentrok Baru" --> NotifGagalApprove["Gagal: Slot waktu bertabrakan dengan jadwal lain"]
    CekBentrokBaru -- "Aman (Bebas Bentrok)" --> StatusConfirmed["Status Berubah: CONFIRMED<br/>Tercatat Admin Penyetuju & Waktu Approval"]
    StatusConfirmed --> NotifPegawai1["Jadwal Resmi Terkunci untuk Pegawai Pemohon"]
    
    %% Keputusan Tolak
    EvaluasiNota -- "Tidak Sesuai / Ditolak" --> KlikReject["Klik 'Tolak Booking'"]
    KlikReject --> ModalAlasan["Admin Wajib Mengisi Alasan Penolakan<br/>(Contoh: Urgensi belum jelas, ruangan dialokasikan untuk Direksi, dll)"]
    ModalAlasan --> SimpanReject["Status Berubah: REJECTED<br/>Slot Tanggal Langsung Dibebaskan"]
    SimpanReject --> NotifPegawai2["Alasan Penolakan Muncul di Menu 'Booking Saya' Pegawai"]
    
    NotifPegawai1 --> SelesaiApproval(["Siklus Approval Selesai"])
    NotifPegawai2 --> SelesaiApproval
```

---

## 3. Aturan Bisnis Validasi Sistem (Real-Time, Weekend & Anti-Bentrok)

Urutan evaluasi logika backend saat sebuah reservasi didaftarkan atau disetujui:

```mermaid
flowchart TD
    Req(["Data Reservasi Diterima"]) --> V1{"1. Cek Role:<br/>Apakah pemohon adalah Admin?"}
    V1 -- "Ya (Admin)" --> BlockAdmin["403 Forbidden:<br/>Admin dilarang membuat booking ruangan"]
    
    V1 -- "Tidak (Pegawai)" --> V2{"2. Cek Status Ruangan:<br/>Apakah ruangan berstatus MAINTENANCE?"}
    V2 -- "Ya (Maintenance)" --> BlockMaint["400 Bad Request:<br/>Ruangan dalam masa pemeliharaan"]
    
    V2 -- "Tersedia" --> V3{"3. Cek Hari Weekend:<br/>Apakah tanggal jatuh di hari Sabtu atau Minggu?"}
    V3 -- "Ya (Weekend)" --> BlockWeekend["400 Bad Request:<br/>Kantor Bank Raya libur di akhir pekan (Sabtu & Minggu)"]
    
    V3 -- "Hari Kerja (Senin-Jumat)" --> V4{"4. Cek Tanggal Masa Lalu:<br/>Apakah tanggal sudah lewat?"}
    V4 -- "Tanggal Lampau" --> BlockExpired["400 Bad Request:<br/>Tidak dapat memesan tanggal yang sudah lewat"]
    
    V4 -- "Valid" --> V5{"5. Cek Real-Time Hari Ini:<br/>Apakah booking dilakukan untuk hari ini?"}
    V5 -- "Ya (Hari Ini)" --> V5a{"Apakah jam mulai > jam saat ini?<br/>(Jam berjalan & sebelumnya dilarang)"}
    V5a -- "Jam Tidak Valid / Lewat 16:00" --> BlockCurrentHour["400 Bad Request:<br/>Pemesanan hari ini hanya boleh jam setelahnya (maks. 16:00)"]
    V5a -- "Jam Valid" --> V6
    
    V5 -- "Tidak (Hari Kerja Depan)" --> V6{"6. Cek Jam Mulai:<br/>Apakah jam mulai antara 08:00 s.d. 16:00 WIB?"}
    V6 -- "Di Luar Batas" --> BlockJam["400 Bad Request:<br/>Jam mulai booking antara 08:00 - 16:00 WIB"]
    
    V6 -- "Valid" --> V7{"7. Cek Multi-Hari (>1 Hari):"}
    V7 -- "Ya (>1 Hari)" --> V7a{"Apakah File Nota Dinas Diunggah &<br/>Rentang Tanggal Bebas Weekend?"}
    V7a -- "Tanpa File / Ada Weekend" --> BlockNota["400 Bad Request:<br/>Wajib upload Nota Dinas & tidak boleh mencakup weekend"]
    V7a -- "Lengkap & Bebas Weekend" --> V8
    
    V7 -- "Tidak (1 Hari)" --> V8{"8. Cek Bentrok Waktu (Anti-Collision):<br/>Apakah ada irisan waktu dengan booking CONFIRMED lain?"}
    V8 -- "Ada Irisan Waktu" --> BlockOverlap["409 Conflict:<br/>Jadwal bertabrakan dengan agenda lain di ruangan ini"]
    V8 -- "Bebas Bentrok" --> SimpanDB["Data Berhasil Disimpan ke Database"]
    
    SimpanDB --> SetStatus{"Multi-Hari?"}
    SetStatus -- "Ya" --> S1["Status: PENDING_APPROVAL (Menunggu Admin)"]
    SetStatus -- "Tidak" --> S2["Status: CONFIRMED (Auto-Approved)"]
    
    BlockAdmin --> SelesaiGagal(["Gagal"])
    BlockMaint --> SelesaiGagal
    BlockWeekend --> SelesaiGagal
    BlockExpired --> SelesaiGagal
    BlockCurrentHour --> SelesaiGagal
    BlockJam --> SelesaiGagal
    BlockNota --> SelesaiGagal
    BlockOverlap --> SelesaiGagal
    S1 --> SelesaiSukses(["Sukses Diajukan"])
    S2 --> SelesaiSukses(["Sukses Terkonfirmasi"])
```

---

## 4. Perubahan Jadwal (Reschedule) & Pembatalan Booking

Hak pegawai dan admin dalam mengelola reservasi yang telah dibuat:

```mermaid
flowchart TD
    User(["Pegawai / Admin"]) --> BukaMyBooking["Membuka Menu 'Booking Saya' / 'Admin Panel'"]
    PilihBooking["Pilih Reservasi yang Ingin Dikelola"] <-- BukaMyBooking
    PilihBooking --> OpsiAksi{"Pilihan Aksi"}
    
    %% Edit
    OpsiAksi -- "Edit Jadwal (Hanya Single-Day CONFIRMED)" --> FormEdit["Ubah Ruangan, Tanggal Hari Kerja, Jam Mulai, atau Jam Berakhir"]
    FormEdit --> ValidasiEdit{"Validasi Real-Time & Anti-Bentrok Waktu Baru"}
    ValidasiEdit -- "Bentrok / Weekend / Jam Lampau" --> GagalEdit["Tampilkan Info Validasi Gagal"]
    GagalEdit --> FormEdit
    ValidasiEdit -- "Aman" --> SimpanEdit["Jadwal Baru Diperbarui & Disimpan"]
    
    %% Batal
    OpsiAksi -- "Batalkan Booking" --> DialogKonfirmasi{"Dialog Konfirmasi Pembatalan:<br/>'Yakin ingin membatalkan jadwal ini?'"}
    DialogKonfirmasi -- "Tidak" --> TetapAktif["Jadwal Tetap Aktif"]
    DialogKonfirmasi -- "Ya, Batalkan" --> UpdateStatusBatal["Status Diubah Menjadi 'CANCELLED'"]
    UpdateStatusBatal --> SlotBebas["Slot Ruangan Otomatis Bebas Kembali<br/>Langsung Tersedia untuk Pegawai Lain"]
    
    SimpanEdit --> Done(["Selesai"])
    SlotBebas --> Done
    TetapAktif --> Done
```

---

## 5. Pemeliharaan Ruangan (Maintenance Lock) oleh Admin

Prosedur penguncian ruangan saat ada perbaikan AC, layar display, sound system, atau renovasi interior:

```mermaid
flowchart TD
    TemuanKondisi(["Fasilitas Ruangan Memerlukan Perbaikan"]) --> AdminBuka["Admin Buka Menu 'Kelola 15 Ruangan'"]
    AdminBuka --> PilihRuang["Pilih Ruang Meeting yang Bermasalah"]
    PilihRuang --> UbahStatusRuang["Ubah Status Operasional ke 'MAINTENANCE'"]
    UbahStatusRuang --> KunciSistem["Sistem Mengunci Ruangan:<br/>- Ditandai label MNT di matriks ketersediaan<br/>- Tidak dapat dipilih pada form booking pegawai"]
    KunciSistem --> TeknisiPerbaikan["Teknisi / General Affairs Melakukan Perbaikan"]
    TeknisiPerbaikan --> SelesaiPerbaikan["Perbaikan Selesai dan Teruji Layak"]
    SelesaiPerbaikan --> BukaKembali["Admin Mengubah Status Kembali Menjadi 'AVAILABLE'"]
    BukaKembali --> RuangAktif(["Ruangan Kembali Terbuka untuk Seluruh Pegawai"])
```

---

## 6. Matriks Kewenangan (Pegawai vs Admin)

Perbedaan hak akses dan wewenang operasional antara Pegawai dan Administrator:

```mermaid
flowchart LR
    subgraph Pegawai["Peran: PEGAWAI"]
        direction TB
        P1["1. Melihat Matriks Jadwal & Ketersediaan 15 Ruangan"]
        P2["2. Booking 1 Hari: Auto-Confirmed (Tanpa Approval)"]
        P3["3. Booking >1 Hari: Wajib Upload Nota Dinas & Tunggu Approval"]
        P4["4. Dropdown Tanggal Booking: Hari Sabtu & Minggu Disabled"]
        P5["5. Aturan Real-Time: Jam Mulai > Jam Sekarang (Senin-Jumat)"]
        P6["6. Mengelola Booking Sendiri (Edit & Batalkan)"]
        P7["7. Melihat Riwayat & Alasan jika Booking Ditolak"]
    end

    subgraph Admin["Peran: ADMINISTRATOR (GA / IT)"]
        direction TB
        A1["1. Monitoring Seluruh Jadwal Booking Pegawai Perusahaan"]
        A2["2. DILARANG BOOKING RUANGAN (Hanya untuk Pegawai)"]
        A3["3. Melihat & Mengunduh Dokumen Nota Dinas Pegawai"]
        A4["4. Menyetujui (Approve) atau Menolak (Reject) Booking Multi-Hari"]
        A5["5. Mengelola 15 Ruangan (Nama, Kapasitas, Fasilitas, Maintenance)"]
        A6["6. Membatalkan Jadwal Bermasalah Atas Nama Pegawai"]
    end
```

---

## Tabel Ringkasan SOP & Ketentuan Operasional

Berikut tabel acuan operasional resmi untuk sistem reservasi ruang rapat Bank Raya:

| Aspek Operasional | Ketentuan Terbaru | Penjelasan & Alasan Bisnis |
| :--- | :--- | :--- |
| **Hari Operasional** | **Senin s.d. Jumat (Sabtu & Minggu Tutup)** | Kantor Bank Raya tutup pada akhir pekan. Backend secara real-time menolak pemesanan di hari Sabtu dan Minggu. Data booking lama di weekend telah dihapus. |
| **Pilihan Tanggal Booking** | **Dropdown dengan Disabled Weekend** | Dropdown tanggal otomatis mendisabled hari Sabtu & Minggu (`[AKHIR PEKAN - LIBUR]`) sehingga tidak dapat dipilih atau diklik oleh pengguna. |
| **Logika H+1 (Hari Kerja)** | **Jumat &rarr; Senin** | Jika pegawai memesan / login pada hari Jumat, opsi H+1 kerja berikutnya otomatis jatuh pada hari **Senin** (melewati Sabtu & Minggu). |
| **Pemesanan di Hari yang Sama** | **Jam Mulai &gt; Jam Saat Ini (Jam Setelahnya)** | Pegawai tidak dapat memesan jam saat ini atau jam sebelumnya. Paling awal adalah jam setelahnya (`currentHour + 1`:00 WIB). |
| **Batas Waktu Mulai** | **Pukul 08:00 – 16:00 WIB** | Jam mulai paling lambat adalah 16:00 WIB. Jika waktu sekarang sudah &ge; 16:00 WIB, pemesanan untuk hari ini ditutup. |
| **Batas Jam Selesai** | **Tidak Ada Batas Maksimal 16:30** | Rapat yang dimulai pukul 16:00 WIB dengan durasi panjang tetap diizinkan sesuai Jam Berakhir yang dipilih. |
| **Booking 1 Hari (Single-Day)** | **Auto-Approved (Tanpa Approval)** | Jika rapat hanya pada 1 hari kerja yang sama, jadwal langsung terbit dan terkonfirmasi otomatis (*CONFIRMED*). |
| **Booking > 1 Hari (Multi-Day)** | **Wajib Nota Dinas & Approval Admin** | Pemesanan beberapa hari kerja wajib mengunggah file Nota Dinas (PDF/JPG/PNG maks. 5 MB) dan disetujui Admin. |
| **Hak Booking Admin** | **Admin Dilarang Booking Ruangan** | Akun Admin difokuskan murni untuk monitoring, verifikasi nota dinas, dan approval. Untuk memesan, gunakan akun pegawai. |
| **Struktur Navigasi** | **Bebas Menu Dashboard** | Navigasi disederhanakan tanpa menu Dashboard; landing page langsung ke **Jadwal & Ketersediaan** 15 Ruangan. |
| **Header Sidebar Branding** | **Logo Bank Raya Full Putih + Margin 24px** | Container logo diberi jarak bawah lega (`mb-6`) sehingga teks **"MEETING ROOM"** berada rapi di bawah tanpa tertimpa lengkungan senyum maupun teks `BRI group`. |
| **Card Login Branding** | **Logo Bank Raya Biru Tua + MEETING ROOM** | Menggunakan logo resmi Bank Raya warna biru pekat (`#00529C`) dengan teks **"MEETING ROOM"** di bawahnya secara proporsional. |

---

&copy; 2026 PT Bank Raya Indonesia Tbk. Dokumen Standar Operasional & Alur Proses Bisnis Internal.

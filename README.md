# SIM-Penugasan (Sistem Informasi Manajemen Penugasan Pegawai)

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1+-purple.svg?logo=vite)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg?logo=nestjs)](https://nestjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?logo=prisma)](https://www.prisma.io/)

Sistem Informasi Manajemen Penugasan Pegawai (**SIM-Penugasan**) dan Presensi Kehadiran instansi pemerintah daerah. Sistem ini memfasilitasi pengajuan surat tugas lapangan, pemantauan progres penugasan, peta sebaran penugasan berbasis GIS (Leaflet), alur persetujuan bertingkat (*multi-role approval workflow*), hingga pembuatan dan pencetakan naskah dinas Surat Perintah Tugas (SPT) resmi standar instansi pemerintah.

---

## 📌 Fitur Utama Sistem

### 1. Multi-Role Access Control (RBAC)
Sistem memiliki 4 portal hak akses terpisah dengan otorisasi ketat:
* **Super Admin (`/super-admin/*`)**: Pengelolaan penuh data pegawai, struktur unit kerja (RBI, Fastingkom, Kepeg, PM), manajemen akun pengguna & role, peta sebaran penugasan, dan rekapitulasi presensi.
* **Admin (`/admin/*`)**: Pembuatan tugas dinas baru, input penugasan lapangan, upload laporan pelaksanaan tugas, serta monitoring status tugas.
* **Approval (Pimpinan / Pejabat Penyetuju) (`/approval/*`)**: Verifikasi telaah tugas, pengambilan keputusan (*Setujui* atau *Tolak* dengan catatan), log riwayat keputusan, dan penandatanganan digital.
* **User / Pegawai (`/user/*`)**: Pengajuan draf surat tugas mandiri, pemantauan progres tugas lapangan, presensi kehadiran harian, pengajuan izin & cuti, serta tracking status approval.

### 2. Fitur Unggulan Terbaru
* **Pembuatan & Pencetakan SPT Resmi**: Menghasilkan naskah dinas Surat Perintah Tugas (SPT) berstandar instansi (Kop Surat Pemda DIY Diskominfo, Nomor Surat, Dasar Hukum, Tabel Pegawai, Waktu/Lokasi, TTD Pejabat & QR Code Verifikasi Digital) yang dicetak langsung via dialog browser (`window.print()` / `@media print` A4).
* **Editor Dokumen Naskah Langsung di Web**: Form pengajuan tugas dilengkapi text editor langsung dengan template SPT dan Nota Usulan otomatis, menghilangkan ketergantungan pada aplikasi pengolah kata eksternal.
* **Peta Interaktif Sebaran Penugasan (Leaflet GIS)**: Visualisasi geografis lokasi penugasan pegawai secara real-time dengan filter unit kerja dan status penugasan.
* **Indikator Perhatian Khusus**: Penanda visual merah untuk status yang memerlukan konfirmasi segera (`TERLAMBAT`, `ALFA`, dan `DITOLAK`).
* **Sinkronisasi Data Real-Time**: Terhubung langsung antara Frontend React dan Backend NestJS melalui arsitektur `PenugasanContext` terpusat (*Single Source of Truth*).

---

## 🛠️ Tech Stack & Pustaka

| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript | Antarmuka komponen modern dengan pengetikan ketat (*Type Safety*) |
| **Build Tool** | Vite 8.1+ | Bundler ultra-cepat dengan Hot Module Replacement (HMR) |
| **Routing** | React Router DOM v7 | Manajemen navigasi dan proteksi hak akses rute (*Guarded Routes*) |
| **Styling & UI** | Tailwind CSS v4, Lucide React | Desain antarmuka responsif dan ikonografi standar modern |
| **Peta & GIS** | Leaflet | Pustaka peta interaktif open-source |
| **Backend Framework** | NestJS v11 (Node.js) | Arsitektur backend modular berstandar industri |
| **Database ORM** | Prisma ORM | Pemetaan objek ke basis data yang aman dari SQL Injection |
| **HTTP Client** | Axios | Komunikasi data asinkron antara frontend dan backend |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Clone Repositori
```bash
git clone https://github.com/yyadott/kp-26-sim-penugasan.git
cd kp-26-sim-penugasan
```

### 2. Menjalankan Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
Backend berjalan di: `http://localhost:3001`

### 3. Menjalankan Frontend (React + Vite)
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di: `http://localhost:5173/kp-26-sim-penugasan/`

---

## 👥 Akun Demo untuk Pengujian

| Peran (Role) | Username | Password | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `password` | Akses penuh seluruh master data |
| **Admin** | `admin` | `password` | Manajemen penugasan operasional |
| **Approval** | `approval` | `password` | Pejabat penelaah dan penyetuju tugas |
| **User (Pegawai)** | `user` | `password` | Pengajuan tugas dan absensi mandiri |

---

## 📂 Struktur Modular Frontend (Pola 1)

Kode frontend dipisahkan per role (*Strict Per-Role Separation*) agar mudah dirawat dan ditambah fiturnya:

- `frontend/src/pages/<role>/` — Halaman utama masing-masing role (`admin`, `super-admin`, `approval`, `user`).
- `frontend/src/components/<role>/` — Sub-komponen, tab, form, dan modal khusus tiap role (`admin/`, `super-admin/`, `approval/`, `user/`).
- `frontend/src/components/ui/` — Komponen UI bersama lintas role (`A4WordEditorCanvas`, `CetakSuratTugasModal`, `DashboardAjuanDetailModal`, `signature-pad`, navbar/sidebar).
- `frontend/src/utils/` — Helper murni non-UI (generator HTML A4, geometri tanda tangan, normalisasi data API, dan ekspor/impor `.docx`).

Lihat detail lengkap struktur direktori di [ARCHITECTURE.md](./ARCHITECTURE.md) dan panduan pengembangan frontend di [frontend/README.md](./frontend/README.md).

---

## 📄 Lisensi
Hak Cipta © 2026 Tim Pengembang SIM-Penugasan. Dikembangkan untuk keperluan kedinasan dan kerja praktik.


# Tasks & Development Roadmap (TASKS.md)
## SIM-Penugasan

Dokumen ini memetakan rincian tahapan pengerjaan proyek dari awal, status penyelesaian setiap fitur, hingga langkah-langkah berikutnya (*upcoming tasks*) agar pengembang dan asisten AI memiliki panduan kerja yang terstruktur.

---

### Status Ringkas Proyek
* **Tahap Saat Ini:** Tahap Uji Coba & Konsultasi Teknis (Branch `dev`)
* **Kompilasi Frontend (Vite + TypeScript):** ✅ **Lulus 100% (Exit Code: 0)**
* **Kompilasi Backend (NestJS):** ✅ **Lulus 100% (Exit Code: 0)**

---

### Roadmap Pengerjaan & Rincian Tugas

#### 🏁 Fase 1: Analisis Sistem & Identifikasi Gap (SELESAI ✅)
- [x] Analisis mendalam seluruh repositori `frontend` dan `backend`.
- [x] Menemukan rute-rute *dead link* dan tombol yang belum terpasang fungsinya.
- [x] Menyusun dokumen laporan analisis awal di `Hasil_analisis.txt`.

#### 🏁 Fase 2: Perbaikan Routing & Hak Akses (RBAC) (SELESAI ✅)
- [x] Memperbaiki `ProtectedRoute.tsx` untuk mengevaluasi hak akses role `APPROVAL` dan `USER` secara ketat.
- [x] Memperbaiki rute submenu tugas pegawai:
  - `/user/tugas/pengajuan` (Draf ajuan)
  - `/user/tugas/progres` (Pemantauan di lapangan)
  - `/user/tugas/laporan` (Rekapitulasi jam tugas / JP)
- [x] Mengaktifkan rute presensi dan pengajuan cuti pegawai (`/user/absensi/cuti`).
- [x] Memperbaiki tautan tombol *"Lihat Semua"* di Dashboard Approval agar tidak mental ke dashboard.
- [x] Mengaktifkan rute peta sebaran tugas interaktif Leaflet di portal pegawai (`/user/pemetaan`).

#### 🏁 Fase 3: Fungsionalitas Halaman Placeholder & Aksi Tombol (SELESAI ✅)
- [x] Mengganti teks placeholder `StatusApprovalPage.tsx` menjadi stepper visual 4 tahap approval.
- [x] Mengganti teks placeholder `UploadSuratPage.tsx` di User menjadi formulir upload laporan tugas riil.
- [x] Memperbaiki tombol *"Simpan & Unggah Dokumen"* di Admin `UploadSuratPage.tsx` dengan menambahkan handler `handleSubmitUpload`.
- [x] Mengaktifkan tombol *"Setujui"* dan *"Tolak"* di `ApprovalTugasPage.tsx` agar memutasi status tugas secara riil.
- [x] Membangun halaman arsip surat tugas (`SuratTugasPage.tsx`) dan log riwayat keputusan (`RiwayatApprovalPage.tsx`).
- [x] Membangun pusat notifikasi dinamis per peran di `NotifikasiPage.tsx`.

#### 🏁 Fase 4: Integrasi Data Real-Time & Arsitektur Terpusat (SELESAI ✅)
- [x] Membangun `PenugasanContext.tsx` di root aplikasi sebagai *Single Source of Truth*.
- [x] Mengintegrasikan `apiService.ts` untuk pemanggilan REST API backend NestJS (`/api/tugas`, `/api/dashboard`, `/api/absensi`).
- [x] Mengaktifkan mekanisme *safe fallback* otomatis agar aplikasi tetap berjalan lancar saat backend offline.
- [x] Memastikan pengajuan tugas oleh Pegawai seketika muncul di layar Approval Pimpinan secara *real-time*.

#### 🏁 Fase 5: Fitur Cetak SPT & Editor Dokumen di Web (SELESAI ✅)
- [x] Membuat komponen modal naskah dinas resmi: `CetakSuratTugasModal.tsx`.
- [x] Menata styling naskah resmi Pemda DIY Diskominfo (Kop Surat, Nomor SPT, Menimbang/Dasar, Tabel Pegawai, TTD & QR Verifikasi Digital).
- [x] Menambahkan aturan cetak `@media print` A4 Portrait di `index.css` (otomatis menyembunyikan navigasi web).
- [x] Memasang tombol *"Cetak SPT"* di 4 portal (Approval, Super Admin, Admin, dan Pegawai).
- [x] Membangun fitur **Editor Dokumen Langsung di Web** pada form pengajuan draf dengan template SPT dan Nota Usulan otomatis.

#### 🏁 Fase 6: Penyempurnaan Basis Data & Indikator Visual (SELESAI ✅)
- [x] Memperkaya basis data master pegawai menjadi 8 personil lengkap lintas 4 unit kerja (`RBI`, `Fastingkom`, `Kepeg`, `PM`).
- [x] Menambahkan profil **Ibu Hj. Anita Purnamasari, S.Kom., M.T.** sebagai koordinator dan pembimbing teknis.
- [x] Menambahkan penanda visual merah menyala (*attention indicators*) untuk status `TERLAMBAT`, `ALFA`, dan `DITOLAK`.
- [x] Menyusun dokumen rancangan konsultasi teknis di `lembar_konsultasi_teknis_anita_purnamasari.md`.

---

### 📋 Tugas Mendatang (*Upcoming Tasks*)

#### ⏳ Tahap Selanjutnya: Uji Coba & Deployment
- [ ] **Uji Coba Pengguna (User Acceptance Testing / UAT)**:
  - Uji alur pembuatan draf tugas oleh akun `user` $\rightarrow$ telaah dan ACC oleh akun `approval` $\rightarrow$ verifikasi penerbitan nomor SPT.
  - Uji cetak fisik dokumen SPT ke printer atau *Save as PDF* di browser.
- [ ] **Migrasi Basis Data PostgreSQL Nyata**:
  - Menjalankan `npx prisma migrate dev` pada server database produksi.
- [ ] **Deployment Staging / Production**:
  - Konfigurasi environment variabel `.env` pada server hosting (Vercel/VPS).
  - Penggabungan (*merge*) branch `dev` ke branch `main` setelah review pimpinan disetujui.


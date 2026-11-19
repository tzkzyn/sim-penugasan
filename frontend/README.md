# Frontend SIM-Penugasan (React 19 + TypeScript + Vite)

Antarmuka web **SIM-Penugasan** menggunakan arsitektur modular **Pola 1 (Strict Per-Role Separation)** agar setiap role tetap terisolasi dan mudah dikembangkan.

## Struktur Folder `src/`

- **`pages/<role>/`**: Halaman utama per role (`admin/`, `super-admin/`, `approval/`, `user/`, `auth/`) serta `shared/` untuk halaman bersama lintas role (`AdminDashboardPage`, `ArsipSuratLaporanPage`, `MonitoringTugasPage`, `RekapPenugasanPage`).
- **`components/admin/`**: Sub-komponen khusus Admin (`AdminTugasTabs`, `AdminBuatTugasSections`, `AdminEditTugasForm`, `AdminAjuanPegawaiModals`).
- **`components/super-admin/`**: Sub-komponen khusus Super Admin (`SuperAdminTugasModals`, `SuperAdminAjuanPegawaiModals`).
- **`components/approval/`**: Sub-komponen khusus Approval (`ApprovalConfirmModal`, `ApprovalTemplateSections`).
- **`components/user/`**: Sub-komponen khusus User (`UserSidebarMenu`, `UserTopNavbar`, `UserDraftAjuanModal`, `UserDraftAjuanPreview`, `UserAjuanModals`, `UserWorkflowTab`, `UserPresensiPegawaiLainTab`).
- **`components/ui/`**: Komponen UI bersama (`A4WordEditorCanvas`, `CetakSuratTugasModal`, `DashboardAjuanDetailModal`, `KalenderRekapDinasModal`, `DocxPreviewViewer`, `AdminSidebarMenu`, `AdminTopNavbar`, `signature-pad`, dll.).
- **`components/penugasan/`**, **`components/map/`**, **`components/calendar/`**: Komponen domain penugasan bersama.
- **`utils/`**: Helper murni non-UI (`suratHtmlHelpers`, `signaturePadHelpers`, `penugasanHelpers`, `penugasanNormalizers`, `userDraftAjuanHelpers`, `docxImport`, `docxExport`).
- **`context/`**: `AuthContext` (sesi & role) dan `PenugasanContext` (state terpusat tugas, pegawai, template).

## Perintah Pengembangan & Verifikasi

```bash
npm install
npm run dev          # Jalankan dev server Vite
npx tsc --noEmit     # Cek tipe TypeScript
npx eslint .         # Cek aturan ESLint & React Compiler
npm run build        # Build produksi (tsc -b && vite build)
```

## Panduan Menambah Fitur
1. **Menambah halaman baru**: taruh di `src/pages/<role>/` dan daftarkan rutenya di `src/routes/<Role>Routes.tsx`.
2. **Menambah modal/tab/form khusus role**: taruh di `src/components/<role>/`.
3. **Menambah helper murni (format, validasi, normalisasi)**: taruh di `src/utils/` agar tidak mencampur logic non-UI ke komponen `.tsx`.

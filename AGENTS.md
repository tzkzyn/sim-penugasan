# AI Agents & Developer Collaboration Guidelines (AGENTS.md)
## SIM-Penugasan

Dokumen ini berisi standar aturan main, etika penulisan kode (*coding rules*), dan instruksi kerja bagi asisten AI (Antigravity/Cursor/Copilot) serta pengembang yang berkolaborasi pada repositori ini.

---

### 1. Prinsip Utama Pengembangan (*Core Principles*)

1. **Dilarang Menambah Dependensi Sembarangan**:
   * Jangan menginstal paket npm atau library pihak ketiga baru tanpa instruksi eksplisit.
   * Manfaatkan teknologi yang sudah terpasang: **React 19**, **Tailwind CSS v4**, **Lucide React**, dan **Fitur Native Web API** (seperti `window.print()` untuk cetak surat, dan `fetch`/`axios` untuk API).
2. **Kerapian & Kepatuhan Struktur Folder**:
   * Jangan mengubah nama atau memindahkan folder dasar (`frontend/`, `backend/`, `pages/`, `routes/`, `layouts/`, `context/`).
   * Setiap penambahan komponen baru wajib ditaruh di direktori yang sesuai (misal: modal di `frontend/src/components/ui/`, halaman khusus role di `frontend/src/pages/<role>/`, dan halaman bersama lintas role di `frontend/src/pages/shared/`).
3. **Verifikasi Build Wajib Lulus 100%**:
   * Sebelum menyelesaikan turn/tugas pengerjaan, wajib menjalankan `npm run build` di folder `frontend/` dan memastikan hasilnya **Exit Code: 0** tanpa satupun error TypeScript (`noUnusedLocals`, `noImplicitAny`).
4. **Keamanan & Privasi Data**:
   * Jangan pernah mengunggah (*commit/push*) berkas konfigurasi rahasia (`.env`), kredensial akun, berkas aturan internal (`aturan/`), atau dokumen log lokal ke repositori publik. Selalu patuhi aturan pada `.gitignore`.

---

### 2. Standar Penulisan Kode (*Code Standards*)

#### A. TypeScript & Type Safety
* Seluruh tipe data entitas penugasan, presensi, dan pegawai wajib mengacu pada [frontend/src/types/index.ts](file:///home/lazy/Downloads/kp-26-sim-penugasan/frontend/src/types/index.ts).
* Hindari penggunaan tipe `any`. Gunakan interface atau tipe eksplisit:
  ```tsx
  // ✅ BENAR
  const handleUpdate = (task: AjuanSuratTugas, status: StatusSuratTugas) => { ... };

  // ❌ SALAH
  const handleUpdate = (task: any, status: any) => { ... };
  ```

#### B. Standar Komponen & Hooks
* Gunakan Functional Components dengan React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
* Seluruh data penugasan wajib diakses dan dimutasi melalui hook `usePenugasan()` dari `PenugasanContext`, bukan menyimpan state lokal sendiri-sendiri di tiap halaman.

#### C. Standar Tampilan & Styling
* Gunakan utilitas Tailwind CSS yang konsisten sesuai [DESIGN.md](file:///home/lazy/Downloads/kp-26-sim-penugasan/DESIGN.md).
* Gunakan ikon resmi dari `lucide-react`. Pastikan ikon yang di-import benar-benar digunakan untuk mencegah error *unused import*.

---

### 3. Alur Kerja Rekomendasi (*Agent Workflow*)

1. **Analisis Terlebih Dahulu**:
   * Saat menerima permintaan fitur baru atau perbaikan, baca kode file terkait terlebih dahulu menggunakan tool `read_file` atau pencarian teks. Jangan berasumsi.
2. **Implementasi Bertahap & Teliti**:
   * Lakukan pengeditan menggunakan `edit_file` yang terarah dan rapi.
3. **Uji Kompilasi**:
   * Jalankan `cd frontend && npm run build` via `run_command` untuk memastikan tidak ada pemecahan sintaks (*syntax breakage*).
4. **Komunikasi yang Jelas & Bahasa Indonesia**:
   * Berikan penjelasan kepada pengguna dalam bahasa Indonesia yang santun, runut, dan profesional.


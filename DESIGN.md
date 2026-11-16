# Design System & UI/UX Guidelines (DESIGN.md)
## SIM-Penugasan

Panduan ini mengatur standar identitas visual, tata letak, palet warna, tipografi, dan komponen antarmuka agar pengalaman pengguna (UX) konsisten di seluruh modul.

---

### 1. Tipografi (*Typography*)
* **Font Utama**: Geist Sans / Inter / System Sans-serif via `@fontsource-variable/geist`.
* **Hirarki Teks**:
  * **H1 / Judul Halaman**: `text-2xl font-bold text-slate-800` (24px, tebal)
  * **H2 / Judul Bagian / Kartu**: `text-lg font-bold text-slate-800` (18px, tebal)
  * **H3 / Subjudul**: `text-sm font-semibold text-slate-700` (14px, semi-bold)
  * **Body Text**: `text-sm text-slate-600 leading-relaxed` (14px, reguler)
  * **Label / Keterangan**: `text-xs font-medium text-slate-500` (12px)
  * **Nomor Surat / Kode**: `font-mono text-xs font-bold` (12px, monospace)

---

### 2. Palet Warna (*Color Palette*)

#### A. Warna Dasar & Netral
* **Background Utama**: `bg-slate-50` / `#F8FAFC`
* **Card & Modal Surface**: `bg-white` / `#FFFFFF`
* **Border Garis Pemisah**: `border-slate-200` / `#E2E8F0`
* **Teks Utama**: `text-slate-800` / `#1E293B`
* **Teks Sekunder**: `text-slate-500` / `#64748B`

#### B. Warna Status & Semantik
* **Primary (Aksi Utama / Navigasi)**:
  * Default: `bg-blue-600 hover:bg-blue-700 text-white`
  * Soft Tint: `bg-blue-50 text-blue-700 border-blue-200`
* **Success (Disetujui / Selesai / Hadir)**:
  * Default: `bg-emerald-600 text-white`
  * Badge: `bg-emerald-50 text-emerald-700 border border-emerald-200`
* **Warning (Menunggu Verifikasi / Dalam Proses)**:
  * Badge: `bg-amber-50 text-amber-700 border border-amber-200`
* **Danger / Attention (Perhatian Khusus / Ditolak / Terlambat / Alfa)**:
  * Status Ditolak: `bg-red-50 text-red-700 border border-red-300 font-bold`
  * Status Alfa: `bg-red-600 text-white font-bold`
  * Status Terlambat: `bg-red-100 text-red-700 border-red-300` + titik merah berkedip

#### C. Warna Khusus Unit Kerja (*Department Badges*)
* **RBI (Reformasi Birokrasi & Integrasi)**: `bg-emerald-100 text-emerald-800 border-emerald-300`
* **Fastingkom (Fasilitas Telekomunikasi & Informatika)**: `bg-sky-100 text-sky-800 border-sky-300`
* **Kepeg (Kepegawaian)**: `bg-purple-100 text-purple-800 border-purple-300`
* **PM (Pengawasan & Mutu)**: `bg-amber-100 text-amber-800 border-amber-300`

---

### 3. Komponen Antarmuka (*UI Components*)

#### A. Tombol (*Buttons*)
* **Tombol Utama (Primary Action)**:
  ```html
  <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer">
  ```
* **Tombol Batal / Sekunder (Secondary Action)**:
  ```html
  <button className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer">
  ```
* **Tombol Cetak Dokumen (Print Action)**:
  ```html
  <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer">
  ```

#### B. Kartu & Modal (*Cards & Modals*)
* Radius sudut menggunakan `rounded-2xl` untuk kartu utama dan modal dialog.
* Bayangan lembut menggunakan `shadow-sm` untuk kartu konten dan `shadow-2xl` untuk modal popup.
* Latar belakang modal menggunakan overlay `bg-slate-900/40 backdrop-blur-xs`.

#### C. Input & Textarea
* Input formulir menggunakan `rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none`.
* Text editor naskah menggunakan huruf monospace `font-mono text-xs leading-relaxed` untuk kemudahan penataan naskah dinas.

---

### 4. Standar Cetak Naskah Dinas (*Print Guidelines*)
* Cetak naskah memanfaatkan styling native CSS `@media print`.
* Ketika dialog cetak (`window.print()`) dibuka:
  1. Seluruh elemen antarmuka web (sidebar, header, navigasi, tombol modal) otomatis disembunyikan (`display: none !important`).
  2. Hanya wadah `#printable-spt-document` yang di-render.
  3. Dokumen terformat otomatis pada ukuran kertas **A4 Portrait** dengan margin standar 1.5 cm.
  4. Garis pembatas kop surat menggunakan garis ganda resmi (garis tebal 3px dan tipis 1px).


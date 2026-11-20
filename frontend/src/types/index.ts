export type UnitKerjaType =
  | 'RBI'
  | 'Fastingkom'
  | 'Kepeg'
  | 'PM';

// Types untuk Pegawai
export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  unitKerja: UnitKerjaType;
  jabatan: string;
  pangkatGolongan?: string;
  telepon?: string;
  fotoAvatar?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'PEGAWAI' | 'APPROVAL' | 'USER';
}

// History / Workflow Timeline item untuk Surat Tugas
export interface WorkflowStep {
  stage: 'DRAFT' | 'VERIFIKASI_SUBBAGIAN' | 'PERSETUJUAN_PIMPINAN' | 'SURAT_TERBIT';
  label: string;
  actor: string;
  tanggal?: string;
  catatan?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'REJECTED';
}

export type StatusSuratTugas =
  | 'DRAFT'
  | 'VERIFIKASI_SUBBAGIAN'
  | 'PERSETUJUAN_PIMPINAN'
  | 'SURAT_TERBIT'
  | 'DITOLAK';

export type KategoriTemplateSurat = 'INDIVIDU' | 'BERDUA' | 'KELOMPOK';

// Ajuan Surat Tugas & Draft Penugasan
export interface AjuanSuratTugas {
  id: string;
  nomorSurat: string;
  perihal: string;
  pengaju: Pegawai;
  pegawaiDitugaskan: Pegawai[];
  unitKerja: UnitKerjaType;
  kategoriTemplate?: KategoriTemplateSurat;
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai?: string;
  jamSelesai?: string;
  lokasiPenugasan: string;
  koordinat: [number, number]; // [latitude, longitude]
  lokasiSpesifik?: string;
  deskripsi: string;
  status: StatusSuratTugas;
  fileDraftUrl?: string;
  fileDraftNama?: string;
  filePerbaikanUrl?: string;
  filePerbaikanNama?: string;
  fileLaporanUrl?: string;
  fileLaporanNama?: string;
  catatanLaporan?: string;
  tanggalLaporan?: string;
  alasanPenolakan?: string;
  dokumenDraftText?: string;
  dasarSuratDari?: string;
  dasarSuratNomor?: string;
  dasarSuratTanggal?: string;
  sumberBiaya?: 'PENYELENGGARA' | 'DIPA' | 'LAINNYA';
  namaKepala?: string;
  ttdDigitalPng?: string;
  ttdSignerName?: string;
  ttdSignedAt?: string;
  ttdUserPng?: string;
  ttdUserSignerName?: string;
  ttdUserSignedAt?: string;
  ttdApprovalPng?: string;
  ttdApprovalSignerName?: string;
  ttdApprovalSignedAt?: string;
  workflow: WorkflowStep[];
}

// Types untuk Fitur Absensi / Presensi
export interface PresensiItem {
  id: string;
  pegawaiId: string;
  nama: string;
  nip: string;
  unitKerja: UnitKerjaType;
  tanggal: string; // YYYY-MM-DD
  jamMasuk: string; // HH:mm
  lokasiPresensiMasuk: string;
  koordinatMasuk?: [number, number];
  jamKeluar?: string; // HH:mm
  lokasiPresensiKeluar?: string;
  koordinatKeluar?: [number, number];
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA' | 'TERLAMBAT';
  keterangan?: string;
  terlambatMenit?: number;
}

// Rekap Tunjangan Kinerja (Tukin) Presensi Pribadi
export interface RincianPotonganTukin {
  alasan: string;
  tanggal: string;
  persenPotongan: number;
  nominalPotongan: number;
}

export interface RekapTukinPribadi {
  periodeBulan: string;
  tunjanganDasar: number; // Rp. Nominal Tukin Full
  totalPotonganPersen: number;
  totalPotonganNominal: number;
  tunjanganDiterima: number;
  rincianPotongan: RincianPotonganTukin[];
}

export interface RekapPresensiPribadi {
  totalHariKerja: number;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalTerlambat: number;
  totalJamKerja: number;
  persentaseKehadiran: number;
  tukin: RekapTukinPribadi;
}

// Data Lokasi Penugasan untuk Pemetaan
export interface LokasiPenugasanPegawai {
  id: string;
  suratTugasId: string;
  nomorSurat: string;
  perihal: string;
  pegawai: Pegawai;
  unitKerja: UnitKerjaType;
  lokasi: string;
  namaLokasi?: string; // Nama lengkap lokasi untuk label boundary (e.g. "Universitas Jenderal Achmad Yani")
  alamatLengkap: string;
  koordinat: [number, number];
  batasWilayah?: [number, number][]; // Polygon boundary coordinates [[lat, lng], ...] — garis merah ala Wikipedia
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'AKTIF' | 'MENDATANG' | 'SELESAI';
  markerType?: 'approvedAjuan';
}

export interface TemplatePrefillData {
  nomorSurat?: string;
  perihal?: string;
  namaPegawai?: string;
  nip?: string;
  pangkatGolongan?: string;
  jabatan?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  lokasiPenugasan?: string;
  lokasiSpesifik?: string;
  dasarSuratDari?: string;
  dasarSuratNomor?: string;
  dasarSuratTanggal?: string;
  sumberBiaya?: 'PENYELENGGARA' | 'DIPA' | 'LAINNYA';
  namaKepala?: string;
}

export interface TemplateSuratResmi {
  id: string;
  namaTemplate: string;
  deskripsi?: string;
  kategoriTemplate: KategoriTemplateSurat;
  fileNamaAsli?: string;
  fileDocxDataUrl?: string;
  hasFileDocx?: boolean;
  kontenHtml: string;
  sertakanKopResmi: boolean;
  prefillData?: TemplatePrefillData;
  dibuatOleh: string;
  diperbaruiPada: string;
  aktif: boolean;
}

export type JenisPengajuanCuti = 'CUTI' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR';
export type StatusPengajuanCuti = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

export interface PengajuanCuti {
  id: string;
  nama: string;
  nip: string;
  unitKerja: string;
  jabatan?: string;
  jenis: JenisPengajuanCuti;
  mulai: string;
  selesai: string;
  alasan: string;
  dokumenLampiran?: string;
  status: StatusPengajuanCuti;
  tanggalPengajuan: string;
  disetujuiOleh?: string;
  disetujuiPada?: string;
  catatanPenolakan?: string;
}

export interface PokjaItem {
  id: string;
  kode: string;
  nama: string;
}

export interface AppNotificationItem {
  id: string;
  targetRole?: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  category: string;
}

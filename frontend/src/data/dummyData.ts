import type {
  Pegawai,
  AjuanSuratTugas,
  PresensiItem,
  RekapPresensiPribadi,
  LokasiPenugasanPegawai,
} from '@/types';

// Data Akun Pegawai (Mencakup seluruh unit: RBI, Fastingkom, Kepegawaian, PM)
export const dummyPegawaiList: Pegawai[] = [
  {
    id: 'peg-01',
    nama: 'Taryadi',
    nip: '2350081041',
    unitKerja: 'RBI',
    jabatan: 'Super Admin',
    pangkatGolongan: 'Penata Muda / III/a',
    telepon: '081234567890',
    email: 'taryadi@pemda.go.id',
    fotoAvatar: `${import.meta.env.BASE_URL}pp-navbar-2.jpg`,
    role: 'SUPER_ADMIN',
  },
  {
    id: 'peg-02',
    nama: 'Admin Operasional',
    nip: '198503122010011002',
    unitKerja: 'RBI',
    jabatan: 'Administrator Sistem',
    pangkatGolongan: 'Penata / III/c',
    telepon: '081234567891',
    email: 'admin@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    role: 'ADMIN',
  },
  {
    id: 'peg-03',
    nama: 'Hj. Anita Purnamasari, S.Kom., M.T.',
    nip: '198106142006042011',
    unitKerja: 'Fastingkom',
    jabatan: 'Koordinator Bidang & Pembimbing Teknis',
    pangkatGolongan: 'Pembina / IV/a',
    telepon: '081322334455',
    email: 'anita.purnamasari@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    role: 'APPROVAL',
  },
  {
    id: 'peg-04',
    nama: 'Drs. H. Mulyadi, M.Si.',
    nip: '197805122002121003',
    unitKerja: 'RBI',
    jabatan: 'Kepala Subbagian Umum & Kepegawaian',
    pangkatGolongan: 'Penata Tingkat I / III/d',
    telepon: '081298765432',
    email: 'mulyadi@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    role: 'APPROVAL',
  },
  {
    id: 'peg-05',
    nama: 'Rahmat Hidayat, S.STP.',
    nip: '199008202014031002',
    unitKerja: 'Kepeg',
    jabatan: 'Analis Kepegawaian Ahli Muda',
    pangkatGolongan: 'Penata / III/c',
    telepon: '081211223344',
    email: 'rahmat.hidayat@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    role: 'ADMIN',
  },
  {
    id: 'peg-06',
    nama: 'Siti Nurhaliza, S.E.',
    nip: '199312052019032008',
    unitKerja: 'PM',
    jabatan: 'Pengelola Penugasan & Program',
    pangkatGolongan: 'Penata Muda Tingkat I / III/b',
    telepon: '081399887766',
    email: 'siti.nurhaliza@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    role: 'USER',
  },
  {
    id: 'peg-07',
    nama: 'Budi Santoso, S.Kom.',
    nip: '199507102020121004',
    unitKerja: 'Fastingkom',
    jabatan: 'Pranata Komputer Ahli Pertama',
    pangkatGolongan: 'Penata Muda / III/a',
    telepon: '081244556677',
    email: 'budi.santoso@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
    role: 'USER',
  },
  {
    id: 'peg-08',
    nama: 'Pegawai Pelaksana',
    nip: '199204152015032001',
    unitKerja: 'RBI',
    jabatan: 'Pelaksana Teknis Lapangan',
    pangkatGolongan: 'Pengatur / II/c',
    telepon: '081355667788',
    email: 'pegawai@pemda.go.id',
    fotoAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    role: 'USER',
  },
];

// Data Sampel Ajuan Surat Tugas (Dikosongkan - Siap diinput dari form)
export const dummyAjuanSuratTugas: AjuanSuratTugas[] = [];

// Data Sampel Rekap Presensi Pribadi (Dikosongkan / Nilai Nol Awal)
export const dummyPresensiPribadi: RekapPresensiPribadi = {
  totalHariKerja: 0,
  totalHadir: 0,
  totalIzin: 0,
  totalSakit: 0,
  totalAlfa: 0,
  totalTerlambat: 0,
  totalJamKerja: 0,
  persentaseKehadiran: 0,
  tukin: {
    periodeBulan: 'Bulan Berjalan',
    tunjanganDasar: 0,
    totalPotonganPersen: 0,
    totalPotonganNominal: 0,
    tunjanganDiterima: 0,
    rincianPotongan: [],
  },
};

// Data Sampel Riwayat Presensi Pribadi (Dikosongkan)
export const dummyRiwayatPresensiPribadi: PresensiItem[] = [];

// Data Sampel Presensi Pegawai Lain (Dikosongkan)
export const dummyPresensiPegawaiLain: PresensiItem[] = [];

// Data Sampel Lokasi Penugasan Pegawai (Dikosongkan)
export const dummyLokasiPenugasan: LokasiPenugasanPegawai[] = [];

// Helper Warna per Unit Kerja
export const UNIT_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  'RBI': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-500', hex: '#6366f1' },
  'Fastingkom': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-500', hex: '#10b981' },
  'Kepeg': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500', hex: '#3b82f6' },
  'PM': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500', hex: '#f59e0b' },
};

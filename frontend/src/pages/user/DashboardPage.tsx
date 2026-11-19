import { useState, useMemo } from 'react';
import { formatDate } from '@/utils/formatter';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { KalenderRekapDinasModal } from '@/components/ui/KalenderRekapDinasModal';
import { PenugasanMap } from '@/components/map/PenugasanMap';
import { getPegawaiDinasStats } from '@/utils/penugasanHelpers';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  dummyPresensiPegawaiLain,
  dummyPresensiPribadi,
  UNIT_COLORS,
} from '@/data/dummyData';
import type { AjuanSuratTugas, LokasiPenugasanPegawai } from '@/types';
import { Link } from 'react-router-dom';
import {
  FileText,
  CalendarCheck,
  MapPin,
  Clock,
  ChevronRight,
  UserCheck,
  Building,
  X,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  UploadCloud,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { DashboardAjuanDetailModal } from '@/components/ui/DashboardAjuanDetailModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { myTasks: tasks } = usePenugasan();
  const todayFormatted = formatDate(new Date().toISOString());

  const [selectedAjuan, setSelectedAjuan] = useState<AjuanSuratTugas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKalenderRekapOpen, setIsKalenderRekapOpen] = useState(false);
  const ajuanMapLocations: LokasiPenugasanPegawai[] = tasks.map((item) => ({
    id: `ajuan-${item.id}`,
    suratTugasId: item.id,
    nomorSurat: item.nomorSurat,
    perihal: item.perihal,
    pegawai: item.pegawaiDitugaskan?.[0] || item.pengaju,
    unitKerja: item.unitKerja,
    lokasi: item.lokasiPenugasan,
    namaLokasi: item.lokasiSpesifik || item.lokasiPenugasan,
    alamatLengkap: [item.lokasiSpesifik, item.lokasiPenugasan].filter(Boolean).join(', '),
    koordinat: item.koordinat || [-6.2088, 106.8456],
    tanggalMulai: item.tanggalMulai,
    tanggalSelesai: item.tanggalSelesai,
    status: item.status === 'SURAT_TERBIT' ? 'AKTIF' : item.status === 'DITOLAK' ? 'SELESAI' : 'MENDATANG',
    markerType: 'approvedAjuan',
  }));
  const recentAjuan = tasks.slice(0, 8);
  const recentPresensi = dummyPresensiPegawaiLain.slice(0, 8);

  const draftApprovalCount = useMemo(() => {
    return tasks.filter(
      (t) => t.status === 'DRAFT' || t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN'
    ).length;
  }, [tasks]);

  const taskProgress = useMemo(() => {
    const total = tasks.length;
    const selesai = tasks.filter((t) => Boolean(t.fileLaporanUrl || t.fileLaporanNama || t.tanggalLaporan)).length;
    const terbit = tasks.filter((t) => t.status === 'SURAT_TERBIT').length;
    const ditolak = tasks.filter((t) => t.status === 'DITOLAK').length;
    const persentaseSelesai = total > 0 ? Math.round((selesai / total) * 100) : 0;
    return { total, selesai, terbit, ditolak, persentaseSelesai };
  }, [tasks]);

  const belumLaporanTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === 'SURAT_TERBIT' &&
          !t.fileLaporanUrl &&
          !t.fileLaporanNama &&
          !t.tanggalLaporan,
      ),
    [tasks],
  );

  const myDinasStats = useMemo(() => {
    if (!user) return { totalDinas: 0, dinasMingguIni: 0, dinasBulanIni: 0 };
    return getPegawaiDinasStats(user, tasks);
  }, [user, tasks]);

  const currentMonthLabel = useMemo(() => {
    return format(new Date(), 'MMMM yyyy', { locale: id });
  }, []);


  const formatLokasiDisplay = (lokasi: string) => {
    const cleaned = lokasi.trim();
    if (!cleaned) return '';
    if (cleaned.toLowerCase().includes('jawa barat')) return cleaned;
    if (
      cleaned.toLowerCase().includes('kota ') ||
      cleaned.toLowerCase().includes('kabupaten ') ||
      cleaned.toLowerCase().includes('kecamatan ')
    ) {
      return `${cleaned}, Jawa Barat`;
    }
    return cleaned;
  };

  return (
    <div className="p-2 sm:p-4 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/80 text-slate-800 p-7 rounded-2xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ECF2FF] text-[#5D87FF] rounded-full text-xs font-semibold border border-[#5D87FF]/20">
            <Building className="w-3.5 h-3.5" />
            <span>{user?.unitKerja} • {user?.role}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang, <span className="text-[#5D87FF]">{user?.nama}</span>
          </h2>
          <p className="text-slate-500 text-sm max-w-xl">
            Sistem Informasi Manajemen Penugasan, Presensi Pegawai, & Visualisasi Pemetaan Lokasi Terpadu.
          </p>
        </div>

        <div className="bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-200/80 text-right font-mono text-xs sm:text-sm shrink-0">
          <span className="text-slate-500 block text-[11px] font-sans">Hari ini:</span>
          <span className="font-bold text-slate-800 text-base">{todayFormatted}</span>
        </div>
      </div>

      {/* Pintasan Menu Utama (Ramah Pengguna, Langsung Klik dari Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link
          to="/user/tugas/pengajuan"
          className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-[#5D87FF] hover:shadow-md transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5D87FF] group-hover:translate-x-0.5 transition-transform">
              Buka <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Surat Tugas Saya</p>
            <p className="text-xs text-slate-500 mt-0.5">Lihat &amp; cetak surat perintah tugas</p>
            <p className="text-sm font-bold text-[#5D87FF] mt-2">{taskProgress.terbit} Surat Terbit</p>
          </div>
        </Link>

        <Link
          to="/user/upload-surat"
          className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              Buka <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Upload Laporan</p>
            <p className="text-xs text-slate-500 mt-0.5">Kirim laporan hasil tugas Anda</p>
            <p className="text-sm font-bold text-emerald-600 mt-2">
              {taskProgress.selesai} / {taskProgress.total} Dilaporkan
            </p>
          </div>
        </Link>

        <Link
          to="/user/arsip"
          className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform">
              Buka <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Arsip Surat &amp; Laporan</p>
            <p className="text-xs text-slate-500 mt-0.5">Lihat &amp; unduh dokumen Anda</p>
            <p className="text-sm font-bold text-amber-600 mt-2">{taskProgress.total} Arsip Tersedia</p>
          </div>
        </Link>

        <Link
          to="/user/absensi/kehadiran"
          className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-rose-500 hover:shadow-md transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 group-hover:translate-x-0.5 transition-transform">
              Buka <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Absensi &amp; Izin / Cuti</p>
            <p className="text-xs text-slate-500 mt-0.5">Catat kehadiran atau ajukan izin</p>
            <p className="text-sm font-bold text-rose-600 mt-2">
              {dummyPresensiPribadi.persentaseKehadiran}% Kehadiran
            </p>
          </div>
        </Link>
      </div>

      {/* Pengingat Tugas Belum Dilaporkan */}
      {belumLaporanTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-5 py-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Ada {belumLaporanTasks.length} surat tugas yang belum diunggah laporannya
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                {belumLaporanTasks.length === 1
                  ? `Tugas "${belumLaporanTasks[0].perihal}" (${belumLaporanTasks[0].nomorSurat}) menunggu laporan hasil Anda.`
                  : 'Segera unggah laporan hasil pelaksanaan tugas setelah kegiatan selesai.'}
              </p>
            </div>
          </div>
          <Link
            to={
              belumLaporanTasks.length === 1
                ? `/user/upload-surat?id=${encodeURIComponent(belumLaporanTasks[0].id)}`
                : '/user/upload-surat'
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition shrink-0"
          >
            Upload Laporan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Progres & Capaian Tugas Saya */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Progres Tugas Saya</h3>
            <p className="text-xs text-slate-500">
              Ringkasan tugas yang sudah dikerjakan (dilaporkan) dari total {taskProgress.total} penugasan Anda
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              taskProgress.selesai === 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-[#ECF2FF] text-[#5D87FF]'
            }`}
          >
            {taskProgress.persentaseSelesai}% Selesai
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              taskProgress.selesai === 0 ? 'bg-rose-500' : 'bg-[#5D87FF]'
            }`}
            style={{ width: `${taskProgress.persentaseSelesai}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/60 px-4 py-3">
            <p className="text-[11px] font-medium text-slate-500">Total Tugas</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{taskProgress.total}</p>
          </div>
          <div
            className={`rounded-xl border px-4 py-3 ${
              taskProgress.selesai === 0
                ? 'bg-rose-50/70 border-rose-200/70'
                : 'bg-emerald-50/60 border-emerald-200/60'
            }`}
          >
            <p
              className={`text-[11px] font-medium ${
                taskProgress.selesai === 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              Sudah Dikerjakan
            </p>
            <p
              className={`text-lg font-bold mt-0.5 ${
                taskProgress.selesai === 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {taskProgress.selesai}
            </p>
          </div>
          <div className="rounded-xl bg-[#ECF2FF]/70 border border-[#5D87FF]/20 px-4 py-3">
            <p className="text-[11px] font-medium text-[#5D87FF]">Surat Terbit</p>
            <p className="text-lg font-bold text-[#5D87FF] mt-0.5">{taskProgress.terbit}</p>
          </div>
          <div className="rounded-xl bg-amber-50/60 border border-amber-200/60 px-4 py-3">
            <p className="text-[11px] font-medium text-amber-700">Dalam Proses</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">{draftApprovalCount}</p>
          </div>
        </div>
      </div>

      {/* Rekapan Frekuensi Dinas Akun Anda (Ringkas) */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center font-bold shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Rekapan Frekuensi Dinas Anda
            </h3>
            <p className="text-xs text-slate-500">
              Total <strong className="text-slate-800">{myDinasStats.totalDinas}x</strong> · Minggu Ini <strong className="text-emerald-600">{myDinasStats.dinasMingguIni}x</strong> · Bulan {currentMonthLabel} <strong className="text-amber-600">{myDinasStats.dinasBulanIni}x</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsKalenderRekapOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5D87FF] hover:bg-[#4A75F2] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Buka Kalender Khusus Rekapan</span>
        </button>
      </div>

      {/* Ajuan Surat Tugas Terbaru (Full-width) */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] flex flex-col">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              Proses Ajuan Surat Tugas Terbaru
            </h3>
          </div>
          <Link
            to="/tugas"
            className="inline-flex items-center gap-1 rounded-full border border-[#5D87FF]/25 bg-[#ECF2FF] px-3 py-1 text-xs font-bold text-[#5D87FF] hover:bg-blue-100 transition-colors"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
          {recentAjuan.map((item) => {
            const unitColor = UNIT_COLORS[item.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };
            const statusIsApproved = item.status === 'SURAT_TERBIT';
            const statusIsRejected = item.status === 'DITOLAK';
            const statusLabel = statusIsApproved ? 'DiApprove' : statusIsRejected ? 'Ditolak' : 'Diproses';
            const statusBadgeClass = statusIsApproved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : statusIsRejected
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAjuan(item);
                  setIsModalOpen(true);
                }}
                className="w-full rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 text-left transition-all hover:border-[#5D87FF]/30 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5D87FF]/30 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-[#5D87FF] truncate">{item.nomorSurat}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${statusBadgeClass}`}>
                    {statusIsApproved ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : statusIsRejected ? (
                      <X className="w-3 h-3 text-rose-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    {statusLabel}
                  </span>
                </div>

                <h4 className="mt-1.5 text-sm font-bold text-slate-800 line-clamp-1">{item.perihal}</h4>

                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${unitColor.bg} ${unitColor.text}`}>
                    {item.unitKerja}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="line-clamp-1">{formatLokasiDisplay(item.lokasiPenugasan)}</span>
                  </span>
                </div>
              </button>
            );
          })}
          {recentAjuan.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada proses ajuan surat tugas terbaru.
            </div>
          )}
        </div>
      </div>

      {/* Baris Bawah 2 Kolom: Peta Lokasi & Presensi Pegawai */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Widget Section */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1D4ED8]" />
                Visualisasi Pemetaan Lokasi Penugasan
              </h3>
              <p className="text-xs text-slate-500">Peta sebaran penugasan pegawai secara realtime.</p>
            </div>
            <Link
              to="/pemetaan"
              className="flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 bg-[#EEF3FB] px-3 py-1.5 rounded-full transition-colors"
            >
              <span>Lihat Detail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <PenugasanMap
            locations={ajuanMapLocations}
            height="h-[340px]"
            showBoundary={false}
            defaultCenter={[-2.5, 118]}
            defaultZoom={5}
            autoFitBounds={false}
          />
        </div>

        {/* Ringkasan Presensi Pegawai Hari Ini */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                Presensi Pegawai Hari Ini
              </h3>
            </div>
            <Link
              to="/absensi"
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 transition-colors"
            >
              Lihat Detail
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
            {recentPresensi.map((p) => {
              const unitColor = UNIT_COLORS[p.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };

              return (
                <div key={p.id} className="rounded-xl border border-slate-100 bg-[#F8FAFD] p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{p.nama}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${unitColor.bg} ${unitColor.text}`}>
                        {p.unitKerja}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">NIP: {p.nip}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <div className="rounded-lg bg-white border border-slate-100 px-2.5 py-1.5 text-center">
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Masuk</div>
                      <div className="font-mono font-bold text-emerald-600">{p.jamMasuk}</div>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-100 px-2.5 py-1.5 text-center">
                      <div className="text-[10px] font-semibold uppercase text-slate-400">Keluar</div>
                      <div className="font-mono font-semibold text-slate-600">{p.jamKeluar || '-'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {recentPresensi.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada aktivitas presensi pegawai hari ini.
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardAjuanDetailModal
        ajuan={selectedAjuan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formatLokasiDisplay={formatLokasiDisplay}
      />

      {/* Modal Kalender Khusus Rekapan Penugasan */}
      <KalenderRekapDinasModal
        isOpen={isKalenderRekapOpen}
        onClose={() => setIsKalenderRekapOpen(false)}
        pegawai={user}
        tasks={tasks}
      />
    </div>
  );
};

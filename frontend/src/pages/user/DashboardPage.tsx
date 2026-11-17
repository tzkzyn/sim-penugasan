import { useState, useMemo } from 'react';
import { formatDate } from '@/utils/formatter';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { CalendarWidget } from '@/components/ui/CalendarWidget';
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
} from 'lucide-react';
import { DashboardAjuanDetailModal } from '@/components/ui/DashboardAjuanDetailModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { myTasks: tasks } = usePenugasan();
  const todayFormatted = formatDate(new Date().toISOString());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
  const activeLocations = ajuanMapLocations.filter((l) => l.status === 'AKTIF');
  const recentAjuan = tasks.filter((item) => {
    if (!selectedDate) return true;
    const itemDate = new Date(item.tanggalMulai);
    return itemDate.toDateString() === selectedDate.toDateString();
  }).slice(0, 8);
  const recentPresensi = dummyPresensiPegawaiLain.slice(0, 8);

  const draftApprovalCount = useMemo(() => {
    return tasks.filter(
      (t) => t.status === 'DRAFT' || t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN'
    ).length;
  }, [tasks]);

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
      <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] text-white p-7 rounded-2xl shadow-[0_14px_34px_-12px_rgba(29,78,216,0.45)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 text-blue-50 rounded-full text-xs font-semibold backdrop-blur-md border border-white/25">
            <Building className="w-3.5 h-3.5" />
            <span>{user?.unitKerja} • {user?.role}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, <span className="text-sky-200">{user?.nama}</span>
          </h2>
          <p className="text-blue-100/90 text-sm max-w-xl">
            Sistem Informasi Manajemen Penugasan, Presensi Pegawai, & Visualisasi Pemetaan Lokasi Terpadu.
          </p>
        </div>

        <div className="z-10 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/25 text-right font-mono text-xs sm:text-sm">
          <span className="text-blue-100 block text-[11px] font-sans">Hari ini:</span>
          <span className="font-bold text-white text-base">{todayFormatted}</span>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-40 top-0 w-32 h-32 bg-sky-300/15 rounded-full blur-xl" />
      </div>

      {/* Executive Stats Cards (Atas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="relative overflow-hidden bg-white p-5 pl-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] transition-all flex items-center gap-4">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-rose-400" />
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block">Penugasan Aktif</span>
            <span className="text-2xl font-black text-slate-800 leading-tight">{activeLocations.length}</span>
            <span className="text-[11px] text-slate-400 block">Pegawai On-Site di Lapangan</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 pl-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] transition-all flex items-center gap-4">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block">Presensi Hari Ini</span>
            <span className="text-2xl font-black text-slate-800 leading-tight">{dummyPresensiPribadi.persentaseKehadiran}%</span>
            <span className="text-[11px] text-emerald-600 font-medium block">Tingkat Kehadiran Instansi</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 pl-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] transition-all flex items-center gap-4">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" />
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block">Draft Butuh Approval</span>
            <span className="text-2xl font-black text-slate-800 leading-tight">{draftApprovalCount}</span>
            <span className="text-[11px] text-slate-400 block">Ajuan Tahap Verifikasi</span>
          </div>
        </div>
      </div>

      {/* Rekapan Frekuensi Dinas Akun Anda (Bawah) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center font-bold shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Rekapan Frekuensi Dinas Anda
              </h3>
              <p className="text-xs text-slate-500">
                Statistik penugasan resmi khusus akun <strong>{user?.nama || 'Anda'}</strong> ({user?.nip || '-'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsKalenderRekapOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-full shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Buka Kalender Khusus Rekapan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 pl-5 flex items-center gap-3.5">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#1D4ED8]" />
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#1D4ED8] flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Frekuensi Dinas ({user?.nama?.split(' ')[0] || 'Akun'})
              </p>
              <p className="text-xl font-black text-slate-800 leading-tight">
                {myDinasStats.totalDinas}x Dinas
              </p>
              <p className="text-[11px] text-[#1D4ED8] font-medium truncate">
                Akumulasi seluruh penugasan
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 pl-5 flex items-center gap-3.5">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500" />
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Rekap Minggu Ini
              </p>
              <p className="text-xl font-black text-slate-800 leading-tight">
                {myDinasStats.dinasMingguIni}x Dinas
              </p>
              <p className="text-[11px] text-emerald-600 font-medium truncate">
                Aktif pada minggu berjalan
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 pl-5 flex items-center gap-3.5">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" />
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                Rekap Bulan ({currentMonthLabel})
              </p>
              <p className="text-xl font-black text-slate-800 leading-tight">
                {myDinasStats.dinasBulanIni}x Dinas
              </p>
              <p className="text-[11px] text-amber-600 font-medium truncate">
                Aktif pada bulan berjalan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Utama 2 Kolom: Aktivitas Ajuan Terbaru + Kalender */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Ajuan Surat Tugas Terbaru (List Vertikal Rapi) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                Proses Ajuan Surat Tugas Terbaru
              </h3>
            </div>
            <Link
              to="/tugas"
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 transition-colors"
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
                  className="w-full rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 text-left transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-[#1D4ED8] truncate">{item.nomorSurat}</span>
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

        {/* Calendar Widget */}
        <div className="lg:col-span-5">
          <CalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} />
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

import { useState, useMemo } from 'react';
import { formatDate } from '@/utils/formatter';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { CalendarWidget } from '@/components/ui/CalendarWidget';
import { PenugasanMap } from '@/components/map/PenugasanMap';
import { PenugasanCalendar } from '@/components/calendar/PenugasanCalendar';
import {
  dummyPresensiPegawaiLain,
  dummyPresensiPribadi,
  UNIT_COLORS,
} from '@/data/dummyData';
import type { AjuanSuratTugas } from '@/types';
import { Link } from 'react-router-dom';
import { usePemetaanFilter } from '@/hooks/usePemetaanFilter';
import { PemetaanFilterBar } from '@/components/penugasan/PemetaanFilterBar';
import {
  FileText,
  CalendarCheck,
  MapPin,
  Clock,
  ChevronRight,
  UserCheck,
  Building,
  X,
  FileCheck,
  CheckCircle2,
  Map as MapIcon,
  Calendar,
  BarChart3,
  Umbrella,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const todayFormatted = formatDate(new Date().toISOString());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAjuan, setSelectedAjuan] = useState<AjuanSuratTugas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'peta' | 'kalender'>('peta');

  const {
    filterMode, handleModeChange,
    selectedUnit, setSelectedUnit,
    selectedPegawaiId, setSelectedPegawaiId,
    searchQuery, setSearchQuery,
    filteredLocations,
    allPegawaiInPenugasan,
    mapLocations,
  } = usePemetaanFilter();

  const { tasks } = usePenugasan();
  const activeLocations = mapLocations.filter((l) => l.status === 'AKTIF');
  const recentAjuan = tasks.slice(0, 8);
  const recentPresensi = dummyPresensiPegawaiLain.slice(0, 8);

  const draftApprovalCount = useMemo(() => {
    return tasks.filter(
      (t) => t.status === 'DRAFT' || t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN'
    ).length;
  }, [tasks]);

  const currentYear = new Date().getFullYear();
  const monthlyStats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    tasks.forEach((t) => {
      const d = new Date(t.tanggalMulai);
      if (d.getFullYear() === currentYear || d.getFullYear() === 2026) {
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          counts[m] += t.pegawaiDitugaskan?.length || 1;
        }
      }
    });
    const maxVal = Math.max(...counts, 1);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT', 'SEP', 'OKT', 'NOV', 'DES'];
    return months.map((label, idx) => {
      const count = counts[idx];
      const hPercent = count === 0 ? '4%' : `${Math.min(Math.round((count / maxVal) * 95), 95)}%`;
      return { label, count, h: hPercent, hasData: count > 0 };
    });
  }, [tasks, currentYear]);

  const cutiStats = useMemo(() => {
    let terpakai = 0;
    try {
      const saved = localStorage.getItem('sim_pengajuan_cuti');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          list.forEach((item: any) => {
            if (item.status === 'DISETUJUI' && item.mulai && item.selesai) {
              const d1 = new Date(item.mulai).getTime();
              const d2 = new Date(item.selesai).getTime();
              const days = Math.max(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1, 1);
              terpakai += days;
            }
          });
        }
      }
    } catch {
      // ignore
    }
    const kuota = 12;
    const sisa = Math.max(kuota - terpakai, 0);
    const persenTersisa = Math.round((sisa / kuota) * 100);
    return { kuota, terpakai, sisa, persenTersisa };
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

      {/* Executive Stats Cards */}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rekap Penugasan (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] flex flex-col h-[280px]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-[15px]">Rekap Penugasan {currentYear}</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Total pegawai yang tercatat dalam penugasan per bulan.</p>
              </div>
            </div>
            <Link to="../rekap-penugasan" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-lg text-xs font-bold whitespace-nowrap">
              Lihat rekap <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {/* Bar Chart */}
          <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 px-1">
            {monthlyStats.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group" title={`${item.label}: ${item.count} orang ditugaskan`}>
                <div className="w-full max-w-[36px] bg-slate-50 rounded-t-lg h-[130px] relative overflow-hidden flex items-end">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ease-out ${item.hasData ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-slate-200/60'}`}
                    style={{ height: item.h }}
                  ></div>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-3">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rekap Izin & Cuti (Spans 1 column) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] flex flex-col h-[280px]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Umbrella className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-[15px]">Rekap Izin & Cuti</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Kuota izin/cuti tahun {currentYear}.</p>
              </div>
            </div>
            <Link to="../absensi?tab=pegawai-lain" className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap mt-1">Detail</Link>
          </div>
          
          {/* Donut Chart and Stats */}
          <div className="flex-1 flex items-center justify-center gap-6">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 * (1 - cutiStats.persenTersisa / 100)} 
                  strokeLinecap="round" 
                  className={cutiStats.terpakai > 0 ? "text-emerald-500" : "text-emerald-400"} 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800">{cutiStats.persenTersisa}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tersisa</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xl font-black text-emerald-700">{cutiStats.sisa}</div>
                <div className="text-xs font-medium text-slate-500">Sisa hari izin/cuti</div>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>
              <div>
                <div className="text-xl font-black text-slate-700">{cutiStats.terpakai}</div>
                <div className="text-xs font-medium text-slate-500">Hari telah terpakai</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Widget Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1D4ED8]" />
              Sebaran Penugasan Pegawai
            </h3>
            <p className="text-xs text-slate-500">Visualisasi sebaran penugasan pegawai dari unit yang berbeda-beda secara realtime.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#EEF3FB] rounded-full p-1 gap-0.5">
              <button
                onClick={() => setMapViewMode('peta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${mapViewMode === 'peta' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Peta
              </button>
              <button
                onClick={() => setMapViewMode('kalender')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${mapViewMode === 'kalender' ? 'bg-white text-[#1D4ED8] shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Kalender
              </button>
            </div>

            <Link
              to="/admin/pemetaan"
              className="flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 bg-[#EEF3FB] px-3.5 py-1.5 rounded-full transition-colors"
            >
              <span>Lihat Detail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <PemetaanFilterBar
          filterMode={filterMode}
          handleModeChange={handleModeChange}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          selectedPegawaiId={selectedPegawaiId}
          setSelectedPegawaiId={setSelectedPegawaiId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allPegawaiInPenugasan={allPegawaiInPenugasan}
          mapLocations={mapLocations}
        />

        {mapViewMode === 'peta' ? (
          <PenugasanMap
            locations={filteredLocations}
            selectedUnit="ALL"
            height="h-[420px]"
            showBoundary={true}
            defaultCenter={[-2.5, 118]}
            defaultZoom={5}
            autoFitBounds={false}
          />
        ) : (
          <PenugasanCalendar
            locations={filteredLocations}
            height="h-[580px]"
          />
        )}
      </div>

      {/* Baris 2 Kolom Seimbang: Ajuan Terbaru (7) + Kalender (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Ajuan Surat Tugas Terbaru */}
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
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 transition-colors"
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

      {/* Ringkasan Presensi Pegawai Hari Ini (Grid Kartu Rapi) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              Ringkasan Presensi Pegawai Hari Ini
            </h3>
          </div>
          <Link
            to="/absensi"
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 transition-colors"
          >
            Lihat Detail
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recentPresensi.map((p) => {
            const unitColor = UNIT_COLORS[p.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };

            return (
              <div key={p.id} className="rounded-xl border border-slate-100 bg-[#F8FAFD] p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{p.nama}</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${unitColor.bg} ${unitColor.text}`}>
                      {p.unitKerja}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">NIP: {p.nip}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white border border-slate-100 p-2">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">Masuk</div>
                    <div className="font-mono font-bold text-emerald-600">{p.jamMasuk}</div>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-100 p-2">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">Keluar</div>
                    <div className="font-mono font-semibold text-slate-600">{p.jamKeluar || '-'}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {recentPresensi.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              Belum ada aktivitas presensi pegawai hari ini.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedAjuan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Detail Ajuan Surat Tugas
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700">{selectedAjuan.nomorSurat}</span>
                <span className="text-xs text-slate-500">{selectedAjuan.unitKerja}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedAjuan.perihal}</h4>
              <p className="text-xs text-slate-600">{selectedAjuan.deskripsi}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Tanggal Penugasan</div>
                <div className="text-sm font-semibold text-slate-800">{selectedAjuan.tanggalMulai} s/d {selectedAjuan.tanggalSelesai}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Lokasi</div>
                <div className="text-sm font-semibold text-slate-800">{formatLokasiDisplay(selectedAjuan.lokasiPenugasan)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-3">Pegawai Ditugaskan</div>
                <div className="space-y-2">
                  {selectedAjuan.pegawaiDitugaskan.map((p) => (
                    <div key={p.id} className="rounded-xl bg-white border border-slate-200 p-3 text-sm font-medium text-slate-800">
                      {p.nama} • {p.jabatan}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-3">Riwayat Workflow</div>
                <div className="space-y-3">
                  {selectedAjuan.workflow.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                      {w.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                      )}
                      <div className="w-full space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>{w.label}</span>
                          <span className="text-slate-400 font-normal">{w.tanggal || 'Menunggu'}</span>
                        </div>
                        <p className="text-xs text-slate-600">Aktor: {w.actor}</p>
                        {w.catatan && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">{w.catatan}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

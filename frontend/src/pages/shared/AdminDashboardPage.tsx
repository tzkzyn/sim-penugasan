import { useState, useMemo } from 'react';
import { formatDate } from '@/utils/formatter';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { PenugasanMap } from '@/components/map/PenugasanMap';
import { PenugasanCalendar } from '@/components/calendar/PenugasanCalendar';
import {
  dummyPresensiPegawaiLain,
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
  CheckCircle2,
  Map as MapIcon,
  Calendar,
  BarChart3,
  Umbrella,
  ArrowUpRight,
  Users,
} from 'lucide-react';
import { DashboardAjuanDetailModal } from '@/components/ui/DashboardAjuanDetailModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const basePrefix = user?.role === 'SUPER_ADMIN' ? '/super-admin' : '/admin';
  const todayFormatted = formatDate(new Date().toISOString());

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

  const { tasks, pegawaiList } = usePenugasan();
  const recentAjuan = tasks.slice(0, 8);
  const recentPresensi = dummyPresensiPegawaiLain.slice(0, 8);

  const summaryStats = useMemo(() => {
    const total = tasks.length;
    const terbit = tasks.filter((t) => t.status === 'SURAT_TERBIT').length;
    const proses = tasks.filter(
      (t) => t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN'
    ).length;
    return { total, terbit, proses };
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
          list.forEach((item: { status?: string; mulai?: string; selesai?: string }) => {
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

      {/* Ringkasan Status Penugasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`${basePrefix}/arsip`}
          className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-[#5D87FF]/40 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Penugasan</p>
            <p className="text-xl font-bold text-slate-900">{summaryStats.total}</p>
          </div>
        </Link>

        <Link
          to={`${basePrefix}/arsip`}
          className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-emerald-300 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Selesai / Terbit</p>
            <p className="text-xl font-bold text-slate-900">{summaryStats.terbit}</p>
          </div>
        </Link>

        <Link
          to={`${basePrefix}/arsip`}
          className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-amber-300 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Dalam Proses</p>
            <p className="text-xl font-bold text-slate-900">{summaryStats.proses}</p>
          </div>
        </Link>

        <Link
          to={`${basePrefix}/anggota`}
          className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] hover:border-indigo-300 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Pegawai</p>
            <p className="text-xl font-bold text-slate-900">{pegawaiList.length}</p>
          </div>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rekap Penugasan (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rekap Penugasan {currentYear}</h3>
                <p className="text-xs text-slate-500">Jumlah pegawai ditugaskan per bulan</p>
              </div>
            </div>
            <Link
              to={`${basePrefix}/rekap-penugasan`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ECF2FF] text-[#5D87FF] hover:bg-blue-100 transition-colors rounded-lg text-xs font-semibold whitespace-nowrap"
            >
              Lihat rekap <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Clean Modern Bar Chart */}
          <div className="relative pt-2">
            {/* Subtle horizontal guide lines */}
            <div className="pointer-events-none absolute inset-x-0 top-2 bottom-7 flex flex-col justify-between">
              <div className="border-t border-dashed border-slate-100" />
              <div className="border-t border-dashed border-slate-100" />
              <div className="border-t border-dashed border-slate-100" />
            </div>

            <div className="relative flex items-end justify-between gap-2 border-b border-slate-200/80 pb-1.5">
              {monthlyStats.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center flex-1 group"
                  title={`${item.label}: ${item.count} orang ditugaskan`}
                >
                  <div className="w-full max-w-[30px] h-[120px] flex flex-col items-center justify-end">
                    <span
                      className={`text-[11px] font-bold mb-1 transition-colors ${
                        item.hasData
                          ? 'text-[#5D87FF]'
                          : 'text-slate-300 group-hover:text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                        item.hasData
                          ? 'bg-gradient-to-t from-[#5D87FF] to-[#87A8FF] shadow-sm shadow-[#5D87FF]/25 group-hover:from-[#4A75F2] group-hover:to-[#6E94FF]'
                          : 'bg-slate-200/80 group-hover:bg-slate-300'
                      }`}
                      style={{ height: item.hasData ? item.h : '5px' }}
                    />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] mt-2 ${
                      item.hasData ? 'font-bold text-[#5D87FF]' : 'font-medium text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rekap Izin & Cuti (Spans 1 column) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-5">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Umbrella className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rekap Izin &amp; Cuti</h3>
                <p className="text-xs text-slate-500">Kuota tahun {currentYear}</p>
              </div>
            </div>
            <Link
              to={`${basePrefix}/absensi?tab=pegawai-lain`}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-xs font-semibold text-slate-700 whitespace-nowrap transition"
            >
              Detail
            </Link>
          </div>

          {/* Donut Chart and Stats */}
          <div className="flex-1 flex items-center justify-center gap-6 py-2">
            <div className="relative w-26 h-26 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - cutiStats.persenTersisa / 100)}
                  strokeLinecap="round"
                  className="text-emerald-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{cutiStats.persenTersisa}%</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Tersisa</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xl font-bold text-emerald-600">{cutiStats.sisa} Hari</div>
                <div className="text-xs text-slate-500">Sisa kuota izin/cuti</div>
              </div>
              <div className="h-px bg-slate-100 w-full" />
              <div>
                <div className="text-xl font-bold text-slate-800">{cutiStats.terpakai} Hari</div>
                <div className="text-xs text-slate-500">Telah terpakai</div>
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
              to={user?.role === 'SUPER_ADMIN' ? '/super-admin/pemetaan' : '/admin/pemetaan'}
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

      {/* Ajuan Surat Tugas Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] flex flex-col">
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

      <DashboardAjuanDetailModal
        ajuan={selectedAjuan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formatLokasiDisplay={formatLokasiDisplay}
      />
    </div>
  );
};

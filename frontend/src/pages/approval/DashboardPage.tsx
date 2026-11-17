import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatter';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { CalendarWidget } from '@/components/ui/CalendarWidget';
import {
  UNIT_COLORS,
} from '@/data/dummyData';
import type { AjuanSuratTugas } from '@/types';
import { Link } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Clock,
  Building,
  X,
  FileCheck,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks } = usePenugasan();
  const todayFormatted = formatDate(new Date().toISOString());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAjuan, setSelectedAjuan] = useState<AjuanSuratTugas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [pendingCutiCount, setPendingCutiCount] = useState(0);

  useEffect(() => {
    const checkCuti = () => {
      try {
        const saved = localStorage.getItem('sim_pengajuan_cuti');
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPendingCutiCount(
              parsed.filter(
                (p): p is { status?: unknown } =>
                  Boolean(p && typeof p === 'object' && (p as { status?: unknown }).status === 'MENUNGGU')
              ).length
            );
          }
        }
      } catch {
        // ignore invalid localStorage data
      }
    };
    checkCuti();
    window.addEventListener('storage', checkCuti);
    const interval = setInterval(checkCuti, 3000);
    return () => {
      window.removeEventListener('storage', checkCuti);
      clearInterval(interval);
    };
  }, []);
  const myUnitData = tasks;

  const recentAjuan = myUnitData.filter((item) => {
    if (tableFilter === 'APPROVED' && item.status !== 'SURAT_TERBIT') return false;
    if (tableFilter === 'PENDING' && item.status !== 'VERIFIKASI_SUBBAGIAN' && item.status !== 'PERSETUJUAN_PIMPINAN' && item.status !== 'DRAFT') return false;
    if (!selectedDate) return true;
    const itemDate = new Date(item.tanggalMulai);
    return itemDate.toDateString() === selectedDate.toDateString();
  }).slice(0, 8);
  const approvedLettersCount = myUnitData.filter(item => item.status === 'SURAT_TERBIT').length;
  const pendingLettersCount = myUnitData.filter(item => item.status === 'VERIFIKASI_SUBBAGIAN' || item.status === 'PERSETUJUAN_PIMPINAN' || item.status === 'DRAFT').length;

  const formatLokasiDisplay = (lokasi?: string | null) => {
    const cleaned = (lokasi ?? '').trim();
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <button
          onClick={() => setTableFilter(prev => prev === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`relative overflow-hidden text-left p-5 pl-6 rounded-2xl border shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] transition-all flex items-center gap-4 focus:outline-none cursor-pointer ${
            tableFilter === 'APPROVED'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400 ring-offset-2'
              : 'bg-white border-slate-100 hover:border-blue-200'
          }`}
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#1D4ED8]" />
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tableFilter === 'APPROVED' ? 'bg-blue-100 text-[#1D4ED8]' : 'bg-[#EEF3FB] text-[#1D4ED8]'}`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block">Surat Disetujui</span>
            <span className="text-2xl font-black text-slate-800 leading-tight">{approvedLettersCount}</span>
            <span className="text-[11px] text-slate-400 block">Surat Tugas terbit</span>
          </div>
        </button>

        <button
          onClick={() => setTableFilter(prev => prev === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`relative overflow-hidden text-left p-5 pl-6 rounded-2xl border shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] transition-all flex items-center gap-4 focus:outline-none cursor-pointer ${
            tableFilter === 'PENDING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400 ring-offset-2'
              : 'bg-white border-slate-100 hover:border-amber-200'
          }`}
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" />
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tableFilter === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-500'}`}>
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block">Butuh Approval</span>
            <span className="text-2xl font-black text-slate-800 leading-tight">{pendingLettersCount}</span>
            <span className="text-[11px] text-slate-400 block">Ajuan menunggu ACC</span>
          </div>
        </button>

        <Link
          to="/approval/approval-cuti"
          className="relative overflow-hidden text-left p-5 pl-6 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] transition-all flex items-center gap-4"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500" />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 block">Izin & Cuti Menunggu</span>
            <span className="text-2xl font-black text-slate-800 leading-tight">{pendingCutiCount}</span>
            <span className="text-[11px] text-slate-400 block">Butuh persetujuan</span>
          </div>
        </Link>
      </div>

      {/* Table (7 cols) & Calendar (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ajuan Surat Tugas Terbaru */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1D4ED8]" />
              {tableFilter === 'APPROVED' ? 'Surat Tugas Disetujui' : tableFilter === 'PENDING' ? 'Surat Tugas Butuh Approval' : 'Proses Ajuan Surat Tugas Terbaru'}
            </h3>
            <Link
              to="/tugas"
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-[#F8FAFD]">
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">No. Surat / Perihal</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Unit &amp; Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAjuan.map((item) => {
                  const unitColor = UNIT_COLORS[item.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };
                  const statusIsApproved = item.status === 'SURAT_TERBIT';
                  const statusIsRejected = item.status === 'DITOLAK';
                  const statusLabel = statusIsApproved ? 'Disetujui' : statusIsRejected ? 'Ditolak' : 'Diproses';
                  const statusBadgeClass = statusIsApproved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : statusIsRejected
                      ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                      : 'bg-amber-50 text-amber-700 border-amber-200/60';

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => {
                        setSelectedAjuan(item);
                        setIsModalOpen(true);
                      }}
                      className="group hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-blue-700 mb-1">{item.nomorSurat}</div>
                        <div className="font-medium text-slate-800 line-clamp-1">{item.perihal}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusBadgeClass}`}>
                          {statusIsApproved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : statusIsRejected ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${unitColor.bg} ${unitColor.text}`}>
                            {item.unitKerja}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="line-clamp-1">{formatLokasiDisplay(item.lokasiPenugasan)}</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="lg:col-span-5">
          <CalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} />
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
                  {(selectedAjuan.pegawaiDitugaskan || []).map((p) => (
                    <div key={p.id} className="rounded-xl bg-white border border-slate-200 p-3 text-sm font-medium text-slate-800">
                      {p.nama} • {p.jabatan}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-3">Riwayat Workflow</div>
                <div className="space-y-3">
                  {(selectedAjuan.workflow || []).map((w, idx) => (
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

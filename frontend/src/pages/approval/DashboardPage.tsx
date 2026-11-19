import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatter';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
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
    return true;
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

      {/* Executive Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <button
          onClick={() => setTableFilter(prev => prev === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`text-left p-6 rounded-2xl border shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] transition-all flex items-start justify-between gap-4 focus:outline-none cursor-pointer ${
            tableFilter === 'APPROVED'
              ? 'bg-[#ECF2FF]/60 border-[#5D87FF]/40 ring-2 ring-[#5D87FF]/50'
              : 'bg-white border-slate-200/70 hover:border-[#5D87FF]/40'
          }`}
        >
          <div className="min-w-0">
            <span className="text-sm font-medium text-slate-500 block">Surat Disetujui</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mt-1 block">{approvedLettersCount}</span>
            <span className="text-xs text-slate-400 mt-1 block">Surat Tugas terbit</span>
          </div>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tableFilter === 'APPROVED' ? 'bg-[#5D87FF] text-white' : 'bg-[#ECF2FF] text-[#5D87FF]'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setTableFilter(prev => prev === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`text-left p-6 rounded-2xl border shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] transition-all flex items-start justify-between gap-4 focus:outline-none cursor-pointer ${
            tableFilter === 'PENDING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50'
              : 'bg-white border-slate-200/70 hover:border-amber-200'
          }`}
        >
          <div className="min-w-0">
            <span className="text-sm font-medium text-slate-500 block">Butuh Approval</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mt-1 block">{pendingLettersCount}</span>
            <span className="text-xs text-slate-400 mt-1 block">Ajuan menunggu ACC</span>
          </div>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tableFilter === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </button>

        <Link
          to="/approval/approval-cuti"
          className="text-left p-6 rounded-2xl border border-slate-200/70 bg-white hover:border-emerald-200 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] transition-all flex items-start justify-between gap-4"
        >
          <div className="min-w-0">
            <span className="text-sm font-medium text-slate-500 block">Izin & Cuti Menunggu</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mt-1 block">{pendingCutiCount}</span>
            <span className="text-xs text-slate-400 mt-1 block">Butuh persetujuan</span>
          </div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Ajuan Surat Tugas Terbaru (Full-width) */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#5D87FF]" />
            {tableFilter === 'APPROVED' ? 'Surat Tugas Disetujui' : tableFilter === 'PENDING' ? 'Surat Tugas Butuh Approval' : 'Proses Ajuan Surat Tugas Terbaru'}
          </h3>
          <Link
            to="/tugas"
            className="inline-flex items-center rounded-full border border-[#5D87FF]/25 bg-[#ECF2FF] px-3 py-1 text-xs font-bold text-[#5D87FF] hover:bg-blue-100 transition-colors"
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
                      <div className="font-mono text-xs font-bold text-[#5D87FF] mb-1">{item.nomorSurat}</div>
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

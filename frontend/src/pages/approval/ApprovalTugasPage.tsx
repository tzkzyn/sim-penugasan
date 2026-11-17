import React, { useMemo, useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import type { AjuanSuratTugas, WorkflowStep } from '@/types';
import {
  detectScheduleConflicts,
  downloadFileUrl,
  formatJamRange,
  getKategoriLabel,
  getPegawaiDinasStats,
  getRekapMingguanBulanan,
  resolveKategoriTemplate,
  type ScheduleConflict,
} from '@/utils/penugasanHelpers';
import {
  FileText, CheckCircle2, XCircle, Clock, Eye, Download,
  MapPin, Calendar as CalendarIcon, Users, X, Printer,
  AlertTriangle, BarChart3,
} from 'lucide-react';
import { ApprovalConfirmModal } from '@/components/approval/ApprovalConfirmModal';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';

export const ApprovalTugasPage = () => {
  const { tasks, pegawaiList, updateTask, updateTaskStatus } = usePenugasan();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RIWAYAT'>('PENDING');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [rejectModalTask, setRejectModalTask] = useState<AjuanSuratTugas | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedSuratForA4, setSelectedSuratForA4] = useState<AjuanSuratTugas | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  // Ambil data surat tugas yang membutuhkan persetujuan pimpinan
  const myUnitData = tasks.filter(t => selectedUnit === 'ALL' || t.unitKerja === selectedUnit);

  const pendingApprovals = myUnitData.filter(
    t => t.status === 'VERIFIKASI_SUBBAGIAN' || t.status === 'PERSETUJUAN_PIMPINAN' || t.status === 'DRAFT'
  );

  const historyApprovals = myUnitData.filter(
    t => t.status === 'SURAT_TERBIT' || t.status === 'DITOLAK'
  );

  const displayData = activeTab === 'PENDING' ? pendingApprovals : historyApprovals;

  // Group data by Month and Year
  const groupedData = displayData.reduce((acc, curr) => {
    const dateObj = new Date(curr.tanggalMulai);
    const monthYear = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(curr);
    return acc;
  }, {} as Record<string, typeof displayData>);

  const sortedGroups = Object.keys(groupedData).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateA = new Date(parseInt(yearA), months.indexOf(monthA), 1);
    const dateB = new Date(parseInt(yearB), months.indexOf(monthB), 1);
    return dateB.getTime() - dateA.getTime();
  });

  const rekapStats = useMemo(
    () => getRekapMingguanBulanan(tasks, pegawaiList),
    [tasks, pegawaiList],
  );

  const conflictPendingCount = pendingApprovals.filter(
    (t) => detectScheduleConflicts(t, tasks).length > 0,
  ).length;

  const handleApprove = (id: string) => {
    updateTaskStatus(id, 'SURAT_TERBIT');
    setConfirmApproveId(null);
  };

  const handleReject = async (id: string, reason?: string) => {
    const target = tasks.find((t) => t.id === id);
    if (reason && target) {
      const updatedWorkflow: WorkflowStep[] = (target.workflow || []).map((w) =>
        w.stage === 'PERSETUJUAN_PIMPINAN'
          ? {
              ...w,
              status: 'REJECTED',
              tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
              catatan: reason,
            }
          : w,
      );
      await updateTask(id, {
        status: 'DITOLAK',
        alasanPenolakan: reason,
        workflow: updatedWorkflow,
      });
    } else {
      await updateTaskStatus(id, 'DITOLAK');
    }
    setConfirmApproveId(null);
  };

  const handleRejectBentrok = async (
    tugas: AjuanSuratTugas,
    conflicts: ScheduleConflict[],
  ) => {
    const names = Array.from(new Set(conflicts.map((c) => c.pegawai.nama))).join(', ');
    const nos = Array.from(new Set(conflicts.map((c) => c.conflictingTask.nomorSurat))).join(', ');
    const reason = `Ditolak karena bentrok jadwal (tanggal & jam sama) untuk ${names} dengan surat ${nos}. Harus ganti orangnya lalu kirim ulang.`;
    await handleReject(tugas.id, reason);
    setActionMsg(`Surat ${tugas.nomorSurat} ditolak otomatis karena bentrok jadwal (${names}).`);
  };

  const confirmTargetTask = confirmApproveId
    ? tasks.find((t) => t.id === confirmApproveId) || null
    : null;
  const confirmTargetConflicts = confirmTargetTask
    ? detectScheduleConflicts(confirmTargetTask, tasks)
    : [];

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-5">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Persetujuan Surat Tugas</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tinjau dan proses pengajuan surat tugas dari unit kerja Anda.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFD] px-3 py-2 text-xs sm:text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Unit Kerja</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>

          <div className="flex bg-[#EEF3FB] p-1 rounded-full w-full md:w-fit">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === 'PENDING' 
                  ? 'bg-white text-[#1D4ED8] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu Persetujuan
              {pendingApprovals.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('RIWAYAT')}
              className={`flex-1 md:flex-none px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === 'RIWAYAT' 
                  ? 'bg-white text-[#1D4ED8] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat
            </button>
          </div>
        </div>
      </div>

      {/* Rekap Mingguan & Bulanan + Indikator Bentrok */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rekap Minggu Ini ({rekapStats.weekLabel})
            </p>
            <p className="text-lg font-extrabold text-slate-800">
              {rekapStats.suratMingguIni} Surat &bull; {rekapStats.totalPenugasanOrangMingguIni} Penugasan
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rekap Bulan Ini ({rekapStats.monthLabel})
            </p>
            <p className="text-lg font-extrabold text-slate-800">
              {rekapStats.suratBulanIni} Surat &bull; {rekapStats.totalPenugasanOrangBulanIni} Penugasan
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-xs flex items-center gap-3 ${
            conflictPendingCount > 0
              ? 'border-rose-200 bg-rose-50/70'
              : 'border-emerald-200 bg-emerald-50/50'
          }`}
        >
          <div
            className={`rounded-lg p-2.5 ${
              conflictPendingCount > 0
                ? 'bg-rose-100 text-rose-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Pendeteksi Bentrok Jadwal
            </p>
            <p
              className={`text-sm font-extrabold ${
                conflictPendingCount > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              {conflictPendingCount > 0
                ? `${conflictPendingCount} Ajuan Bentrok (Harus Ditolak / Ganti Orang)`
                : 'Tidak Ada Jadwal Bentrok'}
            </p>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          <span>{actionMsg}</span>
          <button
            type="button"
            onClick={() => setActionMsg('')}
            className="rounded p-1 hover:bg-amber-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFD] border-b border-slate-100 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-5">Informasi Surat</th>
                <th className="py-3.5 px-5">Pegawai Ditugaskan</th>
                <th className="py-3.5 px-5">Pelaksanaan</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedGroups.length > 0 ? (
                sortedGroups.map((groupMonth) => (
                  <React.Fragment key={groupMonth}>
                    <tr className="bg-slate-100/80">
                      <td colSpan={5} className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {groupMonth}
                      </td>
                    </tr>
                    {groupedData[groupMonth].map((tugas) => {
                      const tugasConflicts =
                        tugas.status === 'DITOLAK'
                          ? []
                          : detectScheduleConflicts(tugas, tasks);
                      const kategori = resolveKategoriTemplate(
                        tugas.pegawaiDitugaskan.length,
                        tugas.kategoriTemplate,
                      );
                      const fileUntukDiunduh = tugas.filePerbaikanUrl || tugas.fileDraftUrl;
                      const namaFileUntukDiunduh =
                        tugas.filePerbaikanNama ||
                        tugas.fileDraftNama ||
                        `Perbaikan_${(tugas.nomorSurat || tugas.id).replace(/[^a-zA-Z0-9._-]/g, '_')}.docx`;

                      return (
                      <tr key={tugas.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-100 last:border-0">
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-800 text-sm">{tugas.nomorSurat}</span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                {getKategoriLabel(kategori)}
                              </span>
                            </div>
                            <span className="text-slate-600 text-xs line-clamp-2" title={tugas.perihal}>
                              {tugas.perihal}
                            </span>
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                              <FileText className="w-3 h-3" />
                              <span>Oleh: {tugas.pengaju.nama} ({tugas.unitKerja})</span>
                            </div>
                            {tugas.filePerbaikanNama && (
                              <span className="text-[11px] font-semibold text-indigo-700">
                                File Perbaikan: {tugas.filePerbaikanNama}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{tugas.pegawaiDitugaskan.length} Orang</span>
                            </div>
                            <div className="space-y-1">
                              {tugas.pegawaiDitugaskan.slice(0, 3).map((peg, idx) => {
                                const pegStats = getPegawaiDinasStats(
                                  peg,
                                  tasks,
                                  tugas.tanggalMulai,
                                );
                                const isConflictingPerson = tugasConflicts.some(
                                  (c) => c.pegawai.id === peg.id || c.pegawai.nama === peg.nama,
                                );
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center gap-1.5 text-[11px] ${
                                      isConflictingPerson ? 'text-rose-700 font-bold' : 'text-slate-600'
                                    }`}
                                  >
                                    <img
                                      className="inline-block h-5 w-5 rounded-full ring-1 ring-slate-200 bg-slate-200 object-cover shrink-0"
                                      src={peg.fotoAvatar || `https://ui-avatars.com/api/?name=${peg.nama}&background=random`}
                                      alt={peg.nama}
                                    />
                                    <span className="truncate max-w-[130px]" title={peg.nama}>
                                      {peg.nama}
                                    </span>
                                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 shrink-0">
                                      {pegStats.totalDinas}x (Mgg:{pegStats.dinasMingguIni} | Bln:{pegStats.dinasBulanIni})
                                    </span>
                                  </div>
                                );
                              })}
                              {tugas.pegawaiDitugaskan.length > 3 && (
                                <span className="text-[10px] font-medium text-slate-500">
                                  +{tugas.pegawaiDitugaskan.length - 3} pegawai lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                            <div className="flex items-start gap-1.5">
                              <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                              <div>
                                <span>
                                  {tugas.tanggalMulai} <br/>s/d {tugas.tanggalSelesai}
                                </span>
                                <p className="text-[11px] font-semibold text-blue-700 mt-0.5">
                                  {formatJamRange(tugas.jamMulai, tugas.jamSelesai)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="line-clamp-2">{tugas.lokasiPenugasan}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col items-start gap-1.5">
                            {tugas.status === 'DRAFT' ||
                            tugas.status === 'VERIFIKASI_SUBBAGIAN' ||
                            tugas.status === 'PERSETUJUAN_PIMPINAN' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200/60">
                                <Clock className="w-3.5 h-3.5" />
                                Perlu Review
                              </span>
                            ) : tugas.status === 'SURAT_TERBIT' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Disetujui
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200/60">
                                <XCircle className="w-3.5 h-3.5" />
                                Ditolak
                              </span>
                            )}

                            {tugasConflicts.length > 0 && tugas.status !== 'SURAT_TERBIT' && (
                              <div className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-800 space-y-0.5 max-w-[220px]">
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Bentrok Jadwal (Harus Ganti Orang)</span>
                                </div>
                                <p className="text-[10px] font-normal text-rose-700">
                                  {tugasConflicts[0].pegawai.nama} &bull; {tugasConflicts[0].conflictingTask.nomorSurat}
                                </p>
                              </div>
                            )}

                            {tugas.alasanPenolakan && (
                              <p className="text-[10px] text-rose-700 max-w-[220px] italic">
                                {tugas.alasanPenolakan}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-top text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => setSelectedSuratForA4(tugas)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Lihat & Edit di Kertas A4 (Nomor / Isi Surat)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedSuratForA4(tugas)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                title="Cetak Kertas A4 / Unduh Word / Upload Perbaikan"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {fileUntukDiunduh && (
                                <button
                                  type="button"
                                  onClick={() => downloadFileUrl(fileUntukDiunduh, namaFileUntukDiunduh)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                  title="Unduh File Word / Perbaikan"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}

                              {activeTab === 'PENDING' && (
                                <>
                                  <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
                                  <button 
                                    onClick={() => setConfirmApproveId(tugas.id)}
                                    disabled={tugasConflicts.length > 0}
                                    className={`p-1.5 rounded-md transition-colors font-medium ${
                                      tugasConflicts.length > 0
                                        ? 'text-slate-300 cursor-not-allowed'
                                        : 'text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                                    }`}
                                    title={
                                      tugasConflicts.length > 0
                                        ? 'Tidak dapat disetujui karena bentrok jadwal (Harus Ganti Orang)'
                                        : 'Setujui'
                                    }
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (tugasConflicts.length > 0) {
                                        handleRejectBentrok(tugas, tugasConflicts);
                                      } else {
                                        setRejectReason('');
                                        setRejectModalTask(tugas);
                                      }
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors font-medium cursor-pointer"
                                    title="Tolak"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>

                            {activeTab === 'PENDING' && tugasConflicts.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRejectBentrok(tugas, tugasConflicts)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" /> Tolak (Bentrok - Ganti Orang)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    {activeTab === 'PENDING' 
                      ? 'Belum ada surat tugas yang menunggu persetujuan Anda.' 
                      : 'Belum ada riwayat persetujuan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ApprovalConfirmModal
        confirmApproveId={confirmApproveId}
        confirmTargetTask={confirmTargetTask ?? undefined}
        confirmTargetConflicts={confirmTargetConflicts}
        onClose={() => setConfirmApproveId(null)}
        onOpenA4={(task) => setSelectedSuratForA4(task)}
        onRejectBentrok={handleRejectBentrok}
        onApproveDirect={(id) => handleApprove(id)}
      />

      {/* Modal Tolak dengan Catatan Pimpinan */}
      {rejectModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Tolak Pengajuan Surat Tugas
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Surat <span className="font-mono font-bold text-slate-800">{rejectModalTask.nomorSurat}</span> akan dikembalikan dengan status <strong>Ditolak</strong>. Berikan catatan perbaikan agar pengaju / Admin dapat menindaklanjuti:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Jadwal atau lokasi penugasan perlu disesuaikan..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const finalReason =
                    rejectReason.trim() || 'Ditolak oleh Pimpinan, mohon periksa kembali ajuan surat.';
                  await handleReject(rejectModalTask.id, finalReason);
                  setActionMsg(`Surat ${rejectModalTask.nomorSurat} ditolak dengan catatan.`);
                  setRejectModalTask(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor & Cetak Kertas A4 (Approval Mode: Edit, Simpan, ACC & Print) */}
      <CetakSuratTugasModal
        surat={selectedSuratForA4}
        isOpen={Boolean(selectedSuratForA4)}
        onClose={() => setSelectedSuratForA4(null)}
        showApprovalActions={true}
      />
    </div>
  );
};

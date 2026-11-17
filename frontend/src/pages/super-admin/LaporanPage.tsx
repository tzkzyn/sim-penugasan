import { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Filter,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';
import type { AjuanSuratTugas } from '@/types';

const hasLaporan = (task: AjuanSuratTugas): boolean =>
  Boolean(task.fileLaporanUrl || task.fileDraftUrl);

const downloadLaporanTugas = (task: AjuanSuratTugas) => {
  const fileUrl = task.fileLaporanUrl || task.fileDraftUrl;
  if (!fileUrl) return;
  const isSafeUrl =
    fileUrl.startsWith('data:') ||
    fileUrl.startsWith('blob:') ||
    fileUrl.startsWith('https://') ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('/');
  if (!isSafeUrl) return;
  const safeNomor = (task.nomorSurat || task.id).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = task.fileLaporanNama || `Laporan_${safeNomor}.pdf`;
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const LaporanPage = () => {
  const { tasks, pegawaiList } = usePenugasan();
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedUnit, setSelectedUnit] = useState('ALL');

  const unitList = ['RBI', 'Fastingkom', 'Kepeg', 'PM'];

  const unitStats = unitList.map((unit) => {
    const unitTasks = tasks.filter((t) => t.unitKerja === unit);
    const completedTasks = unitTasks.filter((t) => t.status === 'SURAT_TERBIT');
    const staffInvolved = pegawaiList.filter((p) => p.unitKerja === unit).length;
    const totalJP = completedTasks.length * 16; // 16 JP per completed task

    return {
      unit,
      totalTasks: unitTasks.length,
      completedTasks: completedTasks.length,
      staffInvolved,
      totalJP,
      effectiveness: unitTasks.length > 0 ? Math.round((completedTasks.length / unitTasks.length) * 100) : 100,
    };
  });

  const archiveTasks = tasks.filter((t) => {
    const matchUnit = selectedUnit === 'ALL' || t.unitKerja === selectedUnit;
    const matchYear =
      selectedYear === 'ALL' || (t.tanggalMulai || '').startsWith(selectedYear);
    return matchUnit && matchYear;
  });

  const totalCompleted = tasks.filter((t) => t.status === 'SURAT_TERBIT').length;
  const totalJPAll = totalCompleted * 16;
  const totalStaff = pegawaiList.length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const header = 'Unit Kerja,Total Penugasan,Penugasan Selesai,Pegawai Terlibat,Total Beban Jam (JP),Efektivitas\n';
    const rows = unitStats
      .map(
        (u) =>
          `"${u.unit}",${u.totalTasks},${u.completedTasks},${u.staffInvolved},${u.totalJP},${u.effectiveness}%`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_penugasan_eksekutif_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            Laporan Kinerja & Akuntabilitas Penugasan (Super Admin)
          </h1>
          <p className="text-sm text-slate-500">
            Arsip eksekutif realisasi surat tugas, capaian jam pelajaran (JP), dan produktivitas unit kerja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Cetak Laporan
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4" /> Unduh Laporan Eksekutif
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Surat Tugas Diterbitkan</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalCompleted} ST</p>
          <p className="text-[11px] text-slate-400 mt-2">Dari total {tasks.length} usulan penugasan</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Total Akumulasi Beban JP</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totalJPAll} JP</p>
          <p className="text-[11px] text-slate-400 mt-2">Beban jam kerja efektif dinas luar</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total Personil Terlibat</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalStaff} Pegawai</p>
          <p className="text-[11px] text-slate-400 mt-2">Tercakup di 4 unit kerja/POKJA</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Efektivitas Penyelesaian</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 100}%
          </p>
          <p className="text-[11px] text-slate-400 mt-2">Tingkat realisasi usulan surat tugas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="h-4 w-4 text-purple-600" />
          Filter Rekapitulasi:
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" /> Tahun:
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Unit Kerja</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      {/* Table Performance Unit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Kinerja Penugasan Per Unit Kerja (POKJA)
          </h2>
          <span className="text-xs font-semibold text-slate-500">Tahun Anggaran {selectedYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Unit Kerja</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Total Usulan ST</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-emerald-700">ST Diterbitkan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Pegawai Terlibat</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-purple-700">Akumulasi Beban (JP)</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Efektivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitStats
                .filter((u) => selectedUnit === 'ALL' || u.unit === selectedUnit)
                .map((u) => (
                  <tr key={u.unit} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 text-sm">{u.unit}</span>
                      <p className="text-xs text-slate-400 mt-0.5">POKJA Satker Balai Besar</p>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{u.totalTasks} ST</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{u.completedTasks} ST</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{u.staffInvolved} Orang</td>
                    <td className="px-6 py-4 text-center font-bold text-purple-700">{u.totalJP} JP</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              u.effectiveness >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${u.effectiveness}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-slate-800">{u.effectiveness}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arsip Berkas Laporan Pelaksanaan Tugas Pegawai */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Arsip Berkas Laporan Pelaksanaan Tugas Pegawai
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {archiveTasks.length} Penugasan ({archiveTasks.filter(hasLaporan).length} Laporan Masuk)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Nomor Surat & Perihal</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Unit Kerja & Pengaju</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status Laporan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archiveTasks.map((t) => {
                const uploaded = hasLaporan(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 max-w-sm">
                      <p className="font-mono text-xs font-bold text-blue-700">{t.nomorSurat}</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{t.perihal}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.tanggalMulai} s/d {t.tanggalSelesai}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <span className="inline-block rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">
                        {t.unitKerja}
                      </span>
                      <p className="font-medium text-slate-800 mt-1">{t.pengaju?.nama || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {uploaded ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Berkas Lengkap
                          </span>
                          {t.fileLaporanNama && (
                            <p className="text-xs font-medium text-slate-700 max-w-[220px] truncate" title={t.fileLaporanNama}>
                              {t.fileLaporanNama}
                            </p>
                          )}
                          {t.catatanLaporan && (
                            <p className="text-[11px] text-slate-500 max-w-[220px] truncate italic" title={t.catatanLaporan}>
                              &quot;{t.catatanLaporan}&quot;
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          <Clock className="h-3 w-3" /> Belum Diunggah
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {uploaded ? (
                        <button
                          type="button"
                          onClick={() => downloadLaporanTugas(t)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" /> Unduh Laporan
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Menunggu unggahan</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {archiveTasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                    Tidak ada data penugasan pada filter tahun dan unit ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import { useState, useMemo } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  Download,
  UploadCloud,
  Search,
  BarChart3,
} from 'lucide-react';

export const LaporanTugasPage = () => {
  const { tasks } = usePenugasan();

  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [selectedJenisDinas, setSelectedJenisDinas] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper detect jenis dinas
  const getJenisDinas = (lokasi: string) => {
    const l = (lokasi || '').toLowerCase();
    if (l.includes('daring') || l.includes('zoom') || l.includes('online')) return 'Daring';
    if (l.includes('pusat') || l.includes('kantor') || l.includes('internal')) return 'Dalam';
    return 'Luar';
  };

  // Helper calculate JP (Jam Penugasan) based on days
  const calculateJP = (mulai: string, selesai: string) => {
    const d1 = new Date(mulai).getTime();
    const d2 = new Date(selesai).getTime();
    const diffDays = Math.max(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1, 1);
    return diffDays * 6; // Standard 6 JP per hari penugasan
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Year filter
      if (selectedTahun !== 'ALL') {
        const year = new Date(t.tanggalMulai).getFullYear().toString();
        if (year !== selectedTahun) return false;
      }

      // Month filter
      if (selectedBulan !== 'ALL') {
        const month = (new Date(t.tanggalMulai).getMonth() + 1).toString();
        if (month !== selectedBulan) return false;
      }

      // Jenis dinas filter
      const jenis = getJenisDinas(t.lokasiPenugasan);
      if (selectedJenisDinas !== 'ALL' && jenis !== selectedJenisDinas) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.perihal.toLowerCase().includes(q) ||
          t.nomorSurat.toLowerCase().includes(q) ||
          (t.lokasiPenugasan || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [tasks, selectedTahun, selectedBulan, selectedJenisDinas, searchQuery]);

  // Aggregate metrics
  const summary = useMemo(() => {
    let totalJP = 0;
    let terbit = 0;
    let sudahLaporan = 0;

    filteredTasks.forEach((t) => {
      const jp = calculateJP(t.tanggalMulai, t.tanggalSelesai);
      totalJP += jp;
      if (t.status === 'SURAT_TERBIT') terbit++;
      if (t.fileDraftUrl) sudahLaporan++;
    });

    return {
      totalJP,
      terbit,
      sudahLaporan,
      belumLaporan: Math.max(filteredTasks.length - sudahLaporan, 0),
      totalSurat: filteredTasks.length
    };
  }, [filteredTasks]);

  const handleExport = () => {
    alert(`Rekapitulasi Laporan Penugasan Tahun ${selectedTahun} berhasil diunduh dalam format PDF.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan & Rekapitulasi Penugasan</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Rekapitulasi jam penugasan (JP), status berkas laporan kegiatan, dan arsip resmi surat tugas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Download className="h-4 w-4 text-slate-500" /> Cetak / Unduh Rekap
            </button>
            <Link
              to="/user/upload-surat"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <UploadCloud className="h-4 w-4" /> Unggah Laporan Tugas
            </Link>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <span className="text-xs font-semibold text-blue-600 block">Total Jam Beban (JP)</span>
            <span className="text-2xl font-extrabold text-blue-900 mt-1 block">{summary.totalJP} JP</span>
            <span className="text-[11px] text-blue-600 mt-0.5 block">Akumulasi JP periode terpilih</span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <span className="text-xs font-semibold text-emerald-600 block">Surat Tugas Resmi Terbit</span>
            <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">{summary.terbit}</span>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">Disetujui pimpinan</span>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <span className="text-xs font-semibold text-indigo-600 block">Laporan Telah Diunggah</span>
            <span className="text-2xl font-extrabold text-indigo-900 mt-1 block">{summary.sudahLaporan}</span>
            <span className="text-[11px] text-indigo-600 mt-0.5 block">Berkas bukti tersimpan</span>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <span className="text-xs font-semibold text-amber-600 block">Menunggu Bukti Laporan</span>
            <span className="text-2xl font-extrabold text-amber-900 mt-1 block">{summary.belumLaporan}</span>
            <span className="text-[11px] text-amber-600 mt-0.5 block">Perlu diunggah pegawai</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari surat tugas atau kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
              <option value="ALL">Semua Tahun</option>
            </select>

            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              value={selectedJenisDinas}
              onChange={(e) => setSelectedJenisDinas(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">Semua Jenis Dinas</option>
              <option value="Luar">Dinas Luar</option>
              <option value="Dalam">Dinas Dalam</option>
              <option value="Daring">Daring / Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* Laporan Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Tabel Rincian Laporan Penugasan & JP</h2>
          <span className="text-xs text-slate-500 font-medium">Ditemukan {filteredTasks.length} data laporan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/40 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Jenis Dinas</th>
                <th className="px-6 py-3.5">Kegiatan / Perihal</th>
                <th className="px-6 py-3.5">Tanggal Pelaksanaan</th>
                <th className="px-6 py-3.5 text-center">Beban JP</th>
                <th className="px-6 py-3.5 text-center">Dokumen Laporan</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const jenis = getJenisDinas(t.lokasiPenugasan);
                const jp = calculateJP(t.tanggalMulai, t.tanggalSelesai);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        jenis === 'Luar' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        jenis === 'Dalam' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {jenis === 'Luar' ? 'Dinas Luar' : jenis === 'Dalam' ? 'Dinas Dalam' : 'Daring'}
                      </span>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{t.perihal}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{t.nomorSurat}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.lokasiPenugasan}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                      <p className="font-medium text-slate-700">{t.tanggalMulai} s/d {t.tanggalSelesai}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Unit: {t.unitKerja}</p>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="inline-block bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-lg text-xs">
                        {jp} JP
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {t.fileDraftUrl ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Berkas Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Clock className="h-3 w-3 text-slate-400" /> Belum Diunggah
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to="/user/upload-surat"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                          title="Unggah laporan pelaksanaan tugas"
                        >
                          <UploadCloud className="h-3.5 w-3.5" /> Upload
                        </Link>
                        <button
                          onClick={() => alert(`Mengunduh lembar Surat Tugas ${t.nomorSurat}...`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                          title="Unduh berkas surat tugas"
                        >
                          <Download className="h-3.5 w-3.5" /> Unduh
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">Belum ada laporan penugasan</p>
                    <p className="text-xs text-slate-400 mt-1">Tidak ditemukan surat tugas pada kriteria filter ini.</p>
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

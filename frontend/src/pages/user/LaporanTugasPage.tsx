import { useState, useMemo } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import type { AjuanSuratTugas } from '@/types';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  Download,
  UploadCloud,
  Search,
  BarChart3,
  AlertCircle,
  X,
} from 'lucide-react';

const hasLaporan = (task: AjuanSuratTugas): boolean =>
  Boolean(task.fileLaporanUrl || task.fileDraftUrl);

const toLocalYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getOffsetYmd = (daysAgo: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return toLocalYmd(dt);
};

export const LaporanTugasPage = () => {
  const { myTasks: tasks } = usePenugasan();

  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [selectedJenisDinas, setSelectedJenisDinas] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isRekapModalOpen, setIsRekapModalOpen] = useState(false);
  const [rekapStartDate, setRekapStartDate] = useState<string>(() => toLocalYmd(new Date()));
  const [rekapEndDate, setRekapEndDate] = useState<string>(() => toLocalYmd(new Date()));

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
      if (hasLaporan(t)) sudahLaporan++;
    });

    return {
      totalJP,
      terbit,
      sudahLaporan,
      belumLaporan: Math.max(filteredTasks.length - sudahLaporan, 0),
      totalSurat: filteredTasks.length
    };
  }, [filteredTasks]);

  const handleDownloadLaporan = (t: AjuanSuratTugas) => {
    const fileUrl = t.fileLaporanUrl || t.fileDraftUrl;
    if (!fileUrl) {
      setFeedbackMsg(
        `Berkas laporan untuk ${t.nomorSurat} belum diunggah. Silakan klik tombol Upload terlebih dahulu.`,
      );
      return;
    }

    const isSafeUrl =
      fileUrl.startsWith('data:') ||
      fileUrl.startsWith('blob:') ||
      fileUrl.startsWith('https://') ||
      fileUrl.startsWith('http://') ||
      fileUrl.startsWith('/');
    if (!isSafeUrl) {
      setFeedbackMsg(`Format tautan berkas untuk ${t.nomorSurat} tidak valid.`);
      return;
    }

    const safeNomor = (t.nomorSurat || t.id).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = t.fileLaporanNama || `Laporan_${safeNomor}.pdf`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rekapFilteredTasks = useMemo(() => {
    const start = rekapStartDate || '0000-01-01';
    const end = rekapEndDate || '9999-12-31';
    return tasks.filter((t) => {
      const tStart = t.tanggalMulai;
      const tEnd = t.tanggalSelesai || t.tanggalMulai;
      return tStart <= end && tEnd >= start;
    });
  }, [tasks, rekapStartDate, rekapEndDate]);

  const handleDownloadCsvRekap = () => {
    if (rekapFilteredTasks.length === 0) {
      setFeedbackMsg('Tidak ada data penugasan pada rentang tanggal yang dipilih.');
      return;
    }

    const escapeCsv = (val: string | number) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'No',
      'Nomor Surat',
      'Perihal',
      'Unit Kerja',
      'Jenis Dinas',
      'Lokasi',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Beban JP',
      'Status Laporan',
    ];

    const rows = rekapFilteredTasks.map((t, idx) => [
      idx + 1,
      t.nomorSurat,
      t.perihal,
      t.unitKerja,
      getJenisDinas(t.lokasiPenugasan),
      t.lokasiPenugasan,
      t.tanggalMulai,
      t.tanggalSelesai || t.tanggalMulai,
      calculateJP(t.tanggalMulai, t.tanggalSelesai),
      hasLaporan(t) ? 'Sudah Diunggah' : 'Belum Diunggah',
    ]);

    const csvContent =
      '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Penugasan_${rekapStartDate || 'awal'}_sd_${rekapEndDate || 'akhir'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsRekapModalOpen(false);
  };

  const handleExport = () => {
    setIsRekapModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <p>{feedbackMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="rounded-lg p-1 text-amber-600 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Laporan &amp; Rekapitulasi Penugasan</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4 text-slate-500" /> Cetak / Unduh Rekap
          </button>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#5D87FF]" />
            Total Jam Beban (JP)
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{summary.totalJP} JP</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Akumulasi JP periode terpilih</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Surat Tugas Resmi Terbit
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{summary.terbit}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Disetujui pimpinan</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Laporan Telah Diunggah
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{summary.sudahLaporan}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Berkas bukti tersimpan</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Menunggu Bukti Laporan
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{summary.belumLaporan}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Perlu diunggah pegawai</span>
        </div>
      </div>

      {/* Unified Filter Toolbar + Laporan Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-100 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900 text-base">Tabel Rincian Laporan Penugasan &amp; JP</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Ditemukan {filteredTasks.length} data laporan
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari surat tugas atau kegiatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-[#5D87FF] focus:bg-white focus:ring-2 focus:ring-[#5D87FF]/15"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#5D87FF]"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
                <option value="2024">Tahun 2024</option>
                <option value="ALL">Semua Tahun</option>
              </select>

              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#5D87FF]"
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
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#5D87FF]"
              >
                <option value="ALL">Semua Jenis Dinas</option>
                <option value="Luar">Dinas Luar</option>
                <option value="Dalam">Dinas Dalam</option>
                <option value="Daring">Daring / Online</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                const uploaded = hasLaporan(t);

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
                      {uploaded ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Berkas Lengkap
                          </span>
                          {t.fileLaporanNama && (
                            <span
                              className="max-w-[160px] truncate text-[11px] text-slate-500"
                              title={t.fileLaporanNama}
                            >
                              {t.fileLaporanNama}
                            </span>
                          )}
                          {t.catatanLaporan && (
                            <span
                              className="max-w-[160px] truncate text-[10px] text-slate-400"
                              title={t.catatanLaporan}
                            >
                              {t.catatanLaporan}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Clock className="h-3 w-3 text-slate-400" /> Belum Diunggah
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/user/upload-surat?id=${encodeURIComponent(t.id)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                          title={
                            uploaded
                              ? 'Ganti berkas laporan tugas'
                              : 'Unggah laporan pelaksanaan tugas'
                          }
                        >
                          <UploadCloud className="h-3.5 w-3.5" />{' '}
                          {uploaded ? 'Ganti' : 'Upload'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownloadLaporan(t)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                          title={
                            uploaded
                              ? 'Unduh berkas laporan tugas'
                              : 'Berkas laporan belum diunggah'
                          }
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

      {/* Modal Unduh Rekap Berdasarkan Tanggal */}
      {isRekapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Unduh Rekap Penugasan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih rentang tanggal (hari ini, 2 hari lalu, atau tanggal tertentu).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRekapModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600">Pilih Cepat</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Hari Ini', start: getOffsetYmd(0), end: getOffsetYmd(0) },
                  { label: '2 Hari Terakhir', start: getOffsetYmd(2), end: getOffsetYmd(0) },
                  { label: '7 Hari Terakhir', start: getOffsetYmd(7), end: getOffsetYmd(0) },
                  {
                    label: 'Bulan Ini',
                    start: `${toLocalYmd(new Date()).slice(0, 8)}01`,
                    end: getOffsetYmd(0),
                  },
                ].map((preset) => {
                  const isActive = rekapStartDate === preset.start && rekapEndDate === preset.end;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setRekapStartDate(preset.start);
                        setRekapEndDate(preset.end);
                      }}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'border-[#5D87FF] bg-[#ECF2FF] text-[#5D87FF]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={rekapStartDate}
                  onChange={(e) => setRekapStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#5D87FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={rekapEndDate}
                  onChange={(e) => setRekapEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#5D87FF]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 flex items-center justify-between">
              <span>Data ditemukan pada rentang ini:</span>
              <strong className="text-slate-900">{rekapFilteredTasks.length} penugasan</strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRekapModalOpen(false);
                  window.print();
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cetak / PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadCsvRekap}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5D87FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4A75F2] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh CSV (Excel)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

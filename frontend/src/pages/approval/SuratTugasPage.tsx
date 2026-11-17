import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MapPin,
  Calendar,
  X,
  Printer,
  Download,
} from 'lucide-react';
import type { AjuanSuratTugas } from '@/types';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';

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

export const SuratTugasPage = () => {
  const { user } = useAuth();
  const { tasks } = usePenugasan();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SURAT_TERBIT' | 'PROSES' | 'DITOLAK'>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedSurat, setSelectedSurat] = useState<AjuanSuratTugas | null>(null);
  const [suratToPrint, setSuratToPrint] = useState<AjuanSuratTugas | null>(null);

  // Filter berdasarkan unit kerja approval (default: Semua Unit Kerja)
  const unitTasks = tasks.filter(
    (t) => selectedUnit === 'ALL' || t.unitKerja === selectedUnit
  );

  const filteredSurat = unitTasks.filter((surat) => {
    const matchSearch =
      (surat.nomorSurat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (surat.perihal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (surat.lokasiPenugasan || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'SURAT_TERBIT') return surat.status === 'SURAT_TERBIT';
    if (statusFilter === 'PROSES')
      return surat.status === 'VERIFIKASI_SUBBAGIAN' || surat.status === 'PERSETUJUAN_PIMPINAN' || surat.status === 'DRAFT';
    if (statusFilter === 'DITOLAK') return surat.status === 'DITOLAK';

    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Daftar Surat Tugas Unit {user?.unitKerja || ''}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Kelola dan pantau seluruh arsip surat tugas di unit kerja Anda.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nomor surat, perihal, atau lokasi..."
            className="w-full rounded-xl border border-slate-200 bg-[#F8FAFD] py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFD] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Unit Kerja</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>

          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'SURAT_TERBIT' | 'PROSES' | 'DITOLAK')}
            className="rounded-xl border border-slate-200 bg-[#F8FAFD] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Status</option>
            <option value="SURAT_TERBIT">Surat Terbit</option>
            <option value="PROSES">Dalam Proses Verifikasi</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFD] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">No. Surat &amp; Perihal</th>
                <th className="py-3.5 px-5">Pengaju &amp; Tim</th>
                <th className="py-3.5 px-5">Lokasi &amp; Waktu</th>
                <th className="py-3.5 px-5">Status &amp; Laporan</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSurat.length > 0 ? (
                filteredSurat.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 align-top max-w-sm">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80 inline-block mb-1">
                        {item.nomorSurat}
                      </span>
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">{item.perihal}</p>
                    </td>
                    <td className="py-4 px-5 align-top text-xs text-slate-600 whitespace-nowrap">
                      <p className="font-semibold text-slate-800">{item.pengaju.nama}</p>
                      <p className="text-slate-400 mt-0.5">
                        {item.pegawaiDitugaskan.length > 0
                          ? `${item.pegawaiDitugaskan.length} pegawai ditugaskan`
                          : '1 pegawai'} • {item.unitKerja}
                      </p>
                    </td>
                    <td className="py-4 px-5 align-top text-xs text-slate-600 min-w-[200px]">
                      <div className="flex items-start gap-1.5 font-medium text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.lokasiPenugasan}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1 whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.tanggalMulai} s/d {item.tanggalSelesai}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <div className="flex flex-col items-start gap-1.5">
                        {item.status === 'SURAT_TERBIT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Terbit
                          </span>
                        )}
                        {(item.status === 'VERIFIKASI_SUBBAGIAN' || item.status === 'PERSETUJUAN_PIMPINAN' || item.status === 'DRAFT') && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" /> Menunggu Review
                          </span>
                        )}
                        {item.status === 'DITOLAK' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-300">
                            <XCircle className="h-3 w-3 text-rose-600" /> Ditolak
                          </span>
                        )}
                        {hasLaporan(item) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/80">
                            <CheckCircle2 className="h-3 w-3" /> Berkas Laporan Ada
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum ada berkas laporan</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSurat(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {hasLaporan(item) && (
                          <button
                            type="button"
                            onClick={() => downloadLaporanTugas(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                            title="Unduh Berkas Laporan Pegawai"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSuratToPrint(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer"
                          title="Cetak Surat Tugas Resmi"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    Tidak ditemukan surat tugas yang sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Surat Tugas */}
      {selectedSurat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Detail Surat Tugas</h3>
              </div>
              <button
                onClick={() => setSelectedSurat(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Nomor Surat</p>
                <p className="font-bold text-slate-800">{selectedSurat.nomorSurat}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Perihal</p>
                <p className="text-slate-700">{selectedSurat.perihal}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Unit Kerja</p>
                  <p className="font-semibold text-slate-700">{selectedSurat.unitKerja}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
                  <p className="font-semibold text-slate-700">{selectedSurat.status.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Lokasi Penugasan</p>
                <p className="text-slate-700">{selectedSurat.lokasiPenugasan}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Periode Waktu</p>
                <p className="text-slate-700">
                  {selectedSurat.tanggalMulai} s.d {selectedSurat.tanggalSelesai}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Pegawai Ditugaskan</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-xs text-slate-600">
                  {selectedSurat.pegawaiDitugaskan.map((pegawai) => (
                    <li key={pegawai.id}>
                      {pegawai.nama} ({pegawai.nip}) - {pegawai.jabatan}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Berkas Laporan Pelaksanaan Tugas
                </p>
                {hasLaporan(selectedSurat) ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Berkas Lengkap
                      </span>
                      <p className="text-xs font-semibold text-slate-800 truncate pt-1">
                        {selectedSurat.fileLaporanNama || 'Dokumen Laporan Tugas'}
                      </p>
                      {selectedSurat.tanggalLaporan && (
                        <p className="text-[11px] text-slate-500">
                          Diunggah: {selectedSurat.tanggalLaporan}
                        </p>
                      )}
                      {selectedSurat.catatanLaporan && (
                        <p className="text-xs text-slate-600 italic">
                          &quot;{selectedSurat.catatanLaporan}&quot;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadLaporanTugas(selectedSurat)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" /> Unduh Berkas Laporan
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Pegawai belum mengunggah berkas laporan pelaksanaan tugas.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSurat(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak & Edit Kertas A4 Surat Tugas Resmi */}
      <CetakSuratTugasModal
        surat={suratToPrint}
        isOpen={Boolean(suratToPrint)}
        onClose={() => setSuratToPrint(null)}
        showApprovalActions={true}
      />
    </div>
  );
};

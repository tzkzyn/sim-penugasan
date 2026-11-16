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
} from 'lucide-react';
import type { AjuanSuratTugas } from '@/types';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';

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
      surat.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.lokasiPenugasan.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'SURAT_TERBIT') return surat.status === 'SURAT_TERBIT';
    if (statusFilter === 'PROSES')
      return surat.status === 'VERIFIKASI_SUBBAGIAN' || surat.status === 'PERSETUJUAN_PIMPINAN' || surat.status === 'DRAFT';
    if (statusFilter === 'DITOLAK') return surat.status === 'DITOLAK';

    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Daftar Surat Tugas Unit {user?.unitKerja || ''}</h1>
          <p className="text-sm text-slate-500">Kelola dan pantau seluruh arsip surat tugas di unit kerja Anda.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nomor surat, perihal, atau lokasi..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="SURAT_TERBIT">Surat Terbit</option>
            <option value="PROSES">Dalam Proses Verifikasi</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">No. Surat & Perihal</th>
                <th className="py-3.5 px-4">Pengaju / Ditugaskan</th>
                <th className="py-3.5 px-4">Lokasi & Waktu</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSurat.length > 0 ? (
                filteredSurat.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-bold text-slate-800">{item.nomorSurat}</p>
                      <p className="line-clamp-2 text-xs text-slate-500 mt-0.5">{item.perihal}</p>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{item.pengaju.nama}</p>
                      <p className="text-slate-400">
                        {item.pegawaiDitugaskan.length > 0
                          ? `${item.pegawaiDitugaskan.length} pegawai ditugaskan`
                          : '1 pegawai'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        <span className="truncate max-w-[180px]">{item.lokasiPenugasan}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{item.tanggalMulai} s.d {item.tanggalSelesai}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {item.status === 'SURAT_TERBIT' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Terbit
                        </span>
                      )}
                      {(item.status === 'VERIFIKASI_SUBBAGIAN' || item.status === 'PERSETUJUAN_PIMPINAN' || item.status === 'DRAFT') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" /> Menunggu Review
                        </span>
                      )}
                      {item.status === 'DITOLAK' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-300">
                          <XCircle className="h-3 w-3 text-rose-600" /> Ditolak (Perhatian Khusus)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedSurat(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
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

      {/* Modal Cetak Surat Tugas Resmi */}
      <CetakSuratTugasModal
        surat={suratToPrint}
        isOpen={Boolean(suratToPrint)}
        onClose={() => setSuratToPrint(null)}
      />
    </div>
  );
};

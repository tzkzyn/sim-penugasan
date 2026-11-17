import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import type { AjuanSuratTugas } from '@/types';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';
import {
  History,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  UserCheck,
  Building,
} from 'lucide-react';

export const RiwayatApprovalPage = () => {
  const { user } = useAuth();
  const { tasks } = usePenugasan();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'SURAT_TERBIT' | 'DITOLAK'>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedSuratForA4, setSelectedSuratForA4] = useState<AjuanSuratTugas | null>(null);

  // Ambil data riwayat (SURAT_TERBIT atau DITOLAK)
  const historyData = tasks.filter(
    (t) =>
      (t.status === 'SURAT_TERBIT' || t.status === 'DITOLAK') &&
      (selectedUnit === 'ALL' || t.unitKerja === selectedUnit)
  );

  const filteredHistory = historyData.filter((item) => {
    const matchSearch =
      (item.nomorSurat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.perihal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.lokasiPenugasan || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (filterDecision !== 'ALL' && item.status !== filterDecision) return false;

    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <History className="h-7 w-7 text-blue-600" />
          Riwayat Keputusan Approval
        </h1>
        <p className="text-sm text-slate-500">
          Catatan riwayat surat tugas yang telah disetujui (terbit) maupun ditolak di unit {user?.unitKerja || ''}.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari riwayat berdasarkan nomor surat atau perihal..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Unit</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterDecision('ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterDecision === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({historyData.length})
          </button>
          <button
            onClick={() => setFilterDecision('SURAT_TERBIT')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterDecision === 'SURAT_TERBIT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Disetujui ({historyData.filter((h) => h.status === 'SURAT_TERBIT').length})
          </button>
          <button
            onClick={() => setFilterDecision('DITOLAK')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterDecision === 'DITOLAK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Ditolak ({historyData.filter((h) => h.status === 'DITOLAK').length})
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.status === 'SURAT_TERBIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {item.status === 'SURAT_TERBIT' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800">{item.nomorSurat}</span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        item.status === 'SURAT_TERBIT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.status === 'SURAT_TERBIT' ? 'DISETUJUI & TERBIT' : 'DITOLAK'}
                    </span>
                    <span className="text-xs text-slate-400">• Unit {item.unitKerja}</span>
                  </div>

                  <p className="text-sm font-medium text-slate-700">{item.perihal}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      Pengaju: {item.pengaju.nama}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Pelaksanaan: {item.tanggalMulai} s.d {item.tanggalSelesai}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      Lokasi: {item.lokasiPenugasan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                <button
                  onClick={() => setSelectedSuratForA4(item)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors cursor-pointer"
                >
                  Lihat &amp; Cetak Kertas A4
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <History className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Tidak ada riwayat approval yang ditemukan.</p>
          </div>
        )}
      </div>

      <CetakSuratTugasModal
        surat={selectedSuratForA4}
        isOpen={Boolean(selectedSuratForA4)}
        onClose={() => setSelectedSuratForA4(null)}
        showApprovalActions={true}
      />
    </div>
  );
};

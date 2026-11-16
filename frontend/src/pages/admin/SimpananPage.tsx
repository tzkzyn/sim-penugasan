import { useState, useMemo } from 'react';
import { Wallet, Download, Search, Filter } from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';

interface AnggaranItem {
  id: string;
  nomorST: string;
  unitKerja: string;
  kegiatan: string;
  pegawaiCount: number;
  uangHarian: number;
  transportasi: number;
  akomodasi: number;
  total: number;
  status: 'DICAIRKAN' | 'MENUNGGU_VERIFIKASI' | 'DRAFT';
}

export const SimpananPage = () => {
  const { tasks } = usePenugasan();
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const anggaranList = useMemo<AnggaranItem[]>(() => {
    return tasks.map((t) => {
      const start = new Date(t.tanggalMulai).getTime();
      const end = new Date(t.tanggalSelesai).getTime();
      const diffDays = Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1, 1);
      const count = Math.max(t.pegawaiDitugaskan?.length || 1, 1);

      const uangHarian = count * diffDays * 430000;
      const transportasi = count * 250000;
      const akomodasi = diffDays > 1 ? count * (diffDays - 1) * 400000 : 0;
      const total = uangHarian + transportasi + akomodasi;

      const status: AnggaranItem['status'] =
        t.status === 'SURAT_TERBIT'
          ? 'DICAIRKAN'
          : t.status === 'PERSETUJUAN_PIMPINAN' || t.status === 'VERIFIKASI_SUBBAGIAN'
          ? 'MENUNGGU_VERIFIKASI'
          : 'DRAFT';

      return {
        id: t.id,
        nomorST: t.nomorSurat,
        unitKerja: t.unitKerja,
        kegiatan: t.perihal,
        pegawaiCount: count,
        uangHarian,
        transportasi,
        akomodasi,
        total,
        status,
      };
    });
  }, [tasks]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const paguTotal = 250000000;
  const totalRealisasi = anggaranList
    .filter((a) => a.status === 'DICAIRKAN')
    .reduce((sum, a) => sum + a.total, 0);
  const totalMenunggu = anggaranList
    .filter((a) => a.status === 'MENUNGGU_VERIFIKASI')
    .reduce((sum, a) => sum + a.total, 0);
  const sisaPagu = paguTotal - totalRealisasi;

  const filtered = anggaranList.filter((a) => {
    const matchSearch = a.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) || a.nomorST.toLowerCase().includes(searchTerm.toLowerCase());
    const matchUnit = unitFilter === 'ALL' || a.unitKerja === unitFilter;
    return matchSearch && matchUnit;
  });

  const handleExport = () => {
    alert('Mengekspor rekapitulasi realisasi anggaran belanja SPPD penugasan (Excel/CSV)...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Rekapitulasi Anggaran & Biaya Penugasan (Admin)
          </h1>
          <p className="text-sm text-slate-500">
            Pengelolaan dana operasional surat tugas, realisasi pencairan uang harian, tiket, dan akomodasi.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
        >
          <Download className="h-4 w-4" /> Unduh Rekap Realisasi
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pagu Anggaran SPPD</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatRupiah(paguTotal)}</p>
          <p className="text-[11px] text-slate-400 mt-2">DIPA Satker Tahun 2026</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Realisasi Terserap</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalRealisasi)}</p>
          <p className="text-[11px] text-slate-400 mt-2">{Math.round((totalRealisasi / paguTotal) * 100)}% dari total pagu</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Menunggu Verifikasi</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatRupiah(totalMenunggu)}</p>
          <p className="text-[11px] text-slate-400 mt-2">Berkas klaim siap dicairkan</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Sisa Pagu Anggaran</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatRupiah(sisaPagu)}</p>
          <p className="text-[11px] text-slate-400 mt-2">Saldo siap dialokasikan</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor ST atau nama kegiatan penugasan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Semua Unit Kerja</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Surat Tugas</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Uang Harian</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Transportasi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Akomodasi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Total Realisasi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-blue-700">{item.nomorST}</p>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5 max-w-sm truncate">{item.kegiatan}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.pegawaiCount} Pegawai Ditugaskan</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.unitKerja}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{formatRupiah(item.uangHarian)}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{formatRupiah(item.transportasi)}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{formatRupiah(item.akomodasi)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900">{formatRupiah(item.total)}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'DICAIRKAN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

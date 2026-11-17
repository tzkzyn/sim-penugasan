import { useMemo } from 'react';
import { Wallet, Download, Clock, ArrowUpRight } from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';

interface KlaimBiaya {
  id: string;
  nomorST: string;
  perihal: string;
  tanggal: string;
  uangHarian: number;
  transportasi: number;
  akomodasi: number;
  total: number;
  status: 'DICAIRKAN' | 'PROSES_VERIFIKASI' | 'DRAFT';
}

export const SimpananPage = () => {
  const { myTasks: tasks } = usePenugasan();

  const klaimList = useMemo<KlaimBiaya[]>(() => {
    return tasks.map((t) => {
      const start = new Date(t.tanggalMulai).getTime();
      const end = new Date(t.tanggalSelesai).getTime();
      const diffDays = Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1, 1);

      const uangHarian = diffDays * 430000;
      const transportasi = 250000;
      const akomodasi = diffDays > 1 ? (diffDays - 1) * 400000 : 0;
      const total = uangHarian + transportasi + akomodasi;

      const status: KlaimBiaya['status'] =
        t.status === 'SURAT_TERBIT'
          ? 'DICAIRKAN'
          : t.status === 'PERSETUJUAN_PIMPINAN' || t.status === 'VERIFIKASI_SUBBAGIAN'
          ? 'PROSES_VERIFIKASI'
          : 'DRAFT';

      return {
        id: t.id,
        nomorST: t.nomorSurat,
        perihal: t.perihal,
        tanggal: `${t.tanggalMulai} s/d ${t.tanggalSelesai}`,
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

  const totalDicairkan = klaimList
    .filter((k) => k.status === 'DICAIRKAN')
    .reduce((sum, k) => sum + k.total, 0);

  const totalMenunggu = klaimList
    .filter((k) => k.status === 'PROSES_VERIFIKASI')
    .reduce((sum, k) => sum + k.total, 0);

  const handleDownloadBukti = (nomorST: string) => {
    alert(`Mengunduh rincian kuitansi dan SPPD untuk ${nomorST}...`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Simpanan & Dana Realisasi Biaya Penugasan
          </h1>
          <p className="text-sm text-slate-500">
            Rekapitulasi hak penerimaan uang harian, tiket/transport, dan akomodasi dinas Anda.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Telah Dicairkan</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalDicairkan)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Dana telah ditransfer ke rekening pegawai</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sedang Diverifikasi</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatRupiah(totalMenunggu)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Menunggu verifikasi bukti kuitansi bendahara</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Akumulasi Klaim</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatRupiah(totalDicairkan + totalMenunggu)}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Tahun Anggaran Berjalan 2026</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Riwayat Pencairan & Klaim Per Surat Tugas</h2>
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {klaimList.length} Rincian Biaya
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Surat Tugas & Kegiatan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Uang Harian</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Transportasi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Akomodasi</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Total Biaya</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status Pencairan</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {klaimList.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-blue-700">{k.nomorST}</p>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5 max-w-xs">{k.perihal}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{k.tanggal}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{formatRupiah(k.uangHarian)}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{formatRupiah(k.transportasi)}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{formatRupiah(k.akomodasi)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900">{formatRupiah(k.total)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        k.status === 'DICAIRKAN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {k.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownloadBukti(k.nomorST)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Unduh Rincian SPPD"
                    >
                      <Download className="h-4 w-4" />
                    </button>
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

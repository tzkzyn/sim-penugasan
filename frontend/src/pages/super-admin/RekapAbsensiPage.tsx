import { useState } from 'react';
import { ChartNoAxesCombined, Download, Printer, Search } from 'lucide-react';
import { dummyPegawaiList, dummyPresensiPegawaiLain } from '@/data/dummyData';

export const RekapAbsensiPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('08');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Recap data derived from actual presensi logs
  const recapData = dummyPegawaiList.map((p) => {
    const pLogs = dummyPresensiPegawaiLain.filter((l) => l.pegawaiId === p.id);
    const hadir = pLogs.filter((l) => l.status === 'HADIR').length;
    const terlambat = pLogs.filter((l) => l.status === 'TERLAMBAT').length;
    const izinCuti = pLogs.filter((l) => l.status === 'IZIN' || l.status === 'SAKIT').length;
    const alfa = pLogs.filter((l) => l.status === 'ALFA').length;
    const totalRecorded = pLogs.length;
    const persentase = totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 0;

    return {
      ...p,
      hariKerja: totalRecorded,
      hadir,
      terlambat,
      izinCuti,
      alfa,
      persentase,
    };
  });

  const filteredRecap = recapData.filter((r) => {
    const matchSearch = r.nama.toLowerCase().includes(searchTerm.toLowerCase()) || r.nip.includes(searchTerm);
    const matchUnit = unitFilter === 'ALL' || r.unitKerja === unitFilter;
    return matchSearch && matchUnit;
  });

  const handleExportCSV = () => {
    const header = 'Nama,NIP,Unit Kerja,Hari Kerja,Hadir,Terlambat,Izin/Cuti,Alfa,Persentase Kehadiran\n';
    const rows = filteredRecap
      .map(
        (r) =>
          `"${r.nama}","${r.nip}","${r.unitKerja}",${r.hariKerja},${r.hadir},${r.terlambat},${r.izinCuti},${r.alfa},${r.persentase}%`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_absensi_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ChartNoAxesCombined className="h-6 w-6 text-purple-600" />
            Rekapitulasi Absensi Bulanan
          </h1>
          <p className="text-sm text-slate-500">
            Laporan agregasi tingkat kehadiran, ketepatan waktu, dan rekap cuti pegawai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Cetak
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="ALL">Semua Unit Kerja</option>
            <option value="RBI">RBI</option>
            <option value="Fastingkom">Fastingkom</option>
            <option value="Kepeg">Kepeg</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Pegawai</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Hari Kerja</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-emerald-700">Hadir</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-amber-700">Terlambat</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-blue-700">Izin/Cuti</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-rose-700">Alfa</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecap.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{r.nama}</div>
                    <div className="text-xs text-slate-400">NIP: {r.nip}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {r.unitKerja}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-700">{r.hariKerja}</td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-600">{r.hadir}</td>
                  <td className="px-6 py-4 text-center font-bold text-amber-600">{r.terlambat}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{r.izinCuti}</td>
                  <td className="px-6 py-4 text-center font-bold text-rose-600">{r.alfa}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.persentase >= 90
                              ? 'bg-emerald-500'
                              : r.persentase >= 75
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${r.persentase}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-slate-800">{r.persentase}%</span>
                    </div>
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

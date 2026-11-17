import { useMemo, useState } from 'react';
import { dummyPresensiPegawaiLain, UNIT_COLORS } from '@/data/dummyData';
import type { PresensiItem } from '@/types';
import { Filter, Search } from 'lucide-react';

interface UserPresensiPegawaiLainTabProps {
  riwayatPresensi: PresensiItem[];
}

export function UserPresensiPegawaiLainTab({
  riwayatPresensi,
}: UserPresensiPegawaiLainTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [isUnitFilterOpen, setIsUnitFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const combinedPresensiLain = useMemo(() => {
    const list = [...riwayatPresensi];
    dummyPresensiPegawaiLain.forEach((dummy) => {
      if (!list.some((l) => l.nip === dummy.nip && l.tanggal === dummy.tanggal)) {
        list.push(dummy);
      }
    });
    return list;
  }, [riwayatPresensi]);

  const filteredPresensiLain = useMemo(() => {
    return combinedPresensiLain.filter((item) => {
      const matchesSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nip.includes(searchQuery) ||
        (item.lokasiPresensiMasuk &&
          item.lokasiPresensiMasuk.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unitKerja);
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [combinedPresensiLain, searchQuery, selectedUnits, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Pegawai, NIP, Lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 outline-none focus:border-blue-500 w-56 sm:w-64"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUnitFilterOpen((open) => !open)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>{selectedUnits.length === 0 ? 'Semua Unit Kerja' : `${selectedUnits.length} unit dipilih`}</span>
            </button>
            {isUnitFilterOpen && (
              <div
                className="absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                onMouseLeave={() => setIsUnitFilterOpen(false)}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
                  <span className="text-xs font-bold text-slate-700">Filter Unit Kerja</span>
                  {selectedUnits.length > 0 && (
                    <button type="button" onClick={() => setSelectedUnits([])} className="text-[11px] font-semibold text-blue-600 hover:underline">
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1 pt-2">
                  {['RBI', 'Fastingkom', 'Kepeg', 'PM'].map((unit) => (
                    <label key={unit} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit)}
                        onChange={() =>
                          setSelectedUnits((current) =>
                            current.includes(unit) ? current.filter((selected) => selected !== unit) : [...current, unit]
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                      />
                      <span>{unit}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">Hadir</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="IZIN">Izin / Sakit</option>
              <option value="ALFA">Alfa</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-800">{filteredPresensiLain.length}</span> data presensi.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Log Presensi Pegawai Lintas Unit Kerja</h3>
          <span className="text-xs text-slate-400">
            Update Realtime • {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-slate-700 sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-6 py-3">Nama Pegawai &amp; NIP</th>
                <th className="px-6 py-3">Unit Kerja</th>
                <th className="px-6 py-3">Jam Masuk</th>
                <th className="px-6 py-3">Jam Keluar</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPresensiLain.map((item, idx) => {
                const unitColor = UNIT_COLORS[item.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-3">
                      <p className="font-bold text-slate-900">{item.nama}</p>
                      <p className="text-[11px] text-slate-400 font-mono">NIP: {item.nip}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${unitColor.bg} ${unitColor.text}`}>
                        {item.unitKerja}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono font-semibold text-emerald-700">{item.jamMasuk}</td>
                    <td className="px-6 py-3 font-mono font-semibold text-amber-700">{item.jamKeluar || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'HADIR'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'TERLAMBAT'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold ring-1 ring-rose-400'
                            : item.status === 'ALFA'
                            ? 'bg-red-200 text-red-900 border border-red-500 font-black ring-2 ring-red-500'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredPresensiLain.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Belum ada log presensi pegawai untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


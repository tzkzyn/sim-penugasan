import { useState } from 'react';
import { CalendarCheck, Search, Clock, MapPin, CheckCircle2, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { dummyPresensiPegawaiLain, dummyPegawaiList } from '@/data/dummyData';

export const LihatAbsensiPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().substring(0, 10));

  const filteredPresensi = dummyPresensiPegawaiLain.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nip.includes(searchTerm) ||
      item.lokasiPresensiMasuk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchUnit = unitFilter === 'ALL' || item.unitKerja === unitFilter;
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchUnit && matchStatus;
  });

  const stats = {
    total: dummyPresensiPegawaiLain.length,
    hadir: dummyPresensiPegawaiLain.filter((p) => p.status === 'HADIR').length,
    terlambat: dummyPresensiPegawaiLain.filter((p) => p.status === 'TERLAMBAT').length,
    izinSakit: dummyPresensiPegawaiLain.filter((p) => p.status === 'IZIN' || p.status === 'SAKIT').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-purple-600" />
            Pemantauan Presensi Harian (Super Admin)
          </h1>
          <p className="text-sm text-slate-500">
            Daftar absensi kehadiran harian, waktu check-in, dan lokasi GPS seluruh pegawai.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Calendar className="h-4 w-4 text-purple-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pegawai</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-2">Pegawai wajib absen hari ini</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Hadir Tepat Waktu</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.hadir}</p>
          <p className="text-[11px] text-slate-400 mt-2">Check-in sebelum 07:30 WIB</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Terlambat</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.terlambat}</p>
          <p className="text-[11px] text-slate-400 mt-2">Presensi setelah batas toleransi</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Izin / Sakit / Dinas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.izinSakit}</p>
          <p className="text-[11px] text-slate-400 mt-2">Disertai surat tugas/keterangan</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai, NIP, atau lokasi presensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="IZIN">Izin</option>
            <option value="SAKIT">Sakit</option>
            <option value="ALFA">Alfa</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Pegawai</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Unit Kerja</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Jam Masuk</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Jam Pulang</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Lokasi / GPS</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPresensi.map((p) => {
                const avatar = dummyPegawaiList.find((peg) => peg.id === p.pegawaiId)?.fotoAvatar;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatar}
                          alt={p.nama}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{p.nama}</p>
                          <p className="text-xs text-slate-400">NIP: {p.nip}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                        {p.unitKerja}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> {p.jamMasuk}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {p.jamKeluar || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{p.lokasiPresensiMasuk}</span>
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'HADIR'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'TERLAMBAT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : p.status === 'IZIN' || p.status === 'SAKIT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.status === 'HADIR' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {p.status === 'TERLAMBAT' && <AlertTriangle className="h-3.5 w-3.5" />}
                      {p.status === 'ALFA' && <XCircle className="h-3.5 w-3.5" />}
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
              {filteredPresensi.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data presensi pada kriteria pencarian ini.
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

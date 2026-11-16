import { useState } from 'react';
import { Users, Search, KeyRound, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { dummyPegawaiList } from '@/data/dummyData';

export const UserPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [userStatuses, setUserStatuses] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    dummyPegawaiList.forEach((p) => {
      init[p.id] = true;
    });
    return init;
  });

  const toggleUserStatus = (id: string) => {
    setUserStatuses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleResetPassword = (nama: string) => {
    alert(`Instruksi pengaturan ulang sandi untuk akun pegawai "${nama}" berhasil dikirimkan.`);
  };

  const filteredUsers = dummyPegawaiList.filter((pegawai) => {
    const matchesSearch =
      pegawai.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pegawai.nip.includes(searchTerm) ||
      (pegawai.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'ALL' || pegawai.unitKerja === unitFilter;
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Manajemen Akun Pegawai (User)
          </h1>
          <p className="text-sm text-slate-500">
            Daftar kredensial dan hak akses seluruh pegawai pelaksana tugas di lingkungan balai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200">
            Total {dummyPegawaiList.length} Akun Terdaftar
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai, NIP, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto cursor-pointer"
        >
          <option value="ALL">Semua Unit Kerja</option>
          <option value="RBI">RBI</option>
          <option value="Fastingkom">Fastingkom</option>
          <option value="Kepeg">Kepeg</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Pegawai</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Jabatan & Unit</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status Akun</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Verifikasi Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.map((p) => {
                const isActive = userStatuses[p.id] ?? true;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.fotoAvatar}
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
                      <p className="font-medium text-slate-700 text-xs">{p.jabatan}</p>
                      <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {p.unitKerja}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(p.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" /> Ditangguhkan
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi
                      </span>
                      <span className="text-[11px] text-slate-400">{p.email}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleResetPassword(p.nama)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Reset Sandi
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Tidak ditemukan data pegawai yang sesuai.
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

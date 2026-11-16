import { useState } from 'react';
import { Search, Shield, KeyRound, CheckCircle2, XCircle, Plus, Mail } from 'lucide-react';
import { dummyPegawaiList } from '@/data/dummyData';

interface AdminAccount {
  id: string;
  nama: string;
  nip: string;
  email: string;
  unitKerja: string;
  role: string;
  status: 'AKTIF' | 'NONAKTIF';
  terakhirLogin: string;
}

export const AdminPage = () => {
  const [admins, setAdmins] = useState<AdminAccount[]>(() => {
    return dummyPegawaiList
      .filter((p) => p.role === 'ADMIN' || p.role === 'SUPER_ADMIN')
      .map((p) => ({
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        email: p.email || `${p.nama.toLowerCase().replace(/\s+/g, '')}@pemda.go.id`,
        unitKerja: p.unitKerja,
        role: p.role || 'ADMIN',
        status: 'AKTIF',
        terakhirLogin: 'Hari ini, Aktif',
      }));
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');

  const toggleStatus = (id: string) => {
    setAdmins((prev) =>
      prev.map((adm) =>
        adm.id === id
          ? { ...adm, status: adm.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF' }
          : adm
      )
    );
  };

  const handleResetPassword = (nama: string) => {
    alert(`Tautan instruksi reset kata sandi telah dikirimkan ke email administrator "${nama}".`);
  };

  const filteredAdmins = admins.filter((adm) => {
    const matchSearch =
      adm.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.nip.includes(searchTerm) ||
      adm.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchUnit = unitFilter === 'ALL' || adm.unitKerja === unitFilter;
    return matchSearch && matchUnit;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Manajemen Akun Administrator
          </h1>
          <p className="text-sm text-slate-500">
            Daftar akun admin yang memiliki hak kelola data penugasan dan absensi tiap unit kerja.
          </p>
        </div>
        <button
          onClick={() => alert('Form pendaftaran akun admin baru siap diintegrasikan.')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tambah Admin Baru
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIP, atau email admin..."
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
          <option value="Tata Usaha Pusat">Tata Usaha Pusat</option>
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Administrator</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Unit Kerja</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Level Hak Akses</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Terakhir Aktif</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAdmins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{adm.nama}</div>
                    <div className="text-xs text-slate-400 mt-0.5">NIP: {adm.nip}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-slate-400" /> {adm.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {adm.unitKerja}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {adm.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{adm.terakhirLogin}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(adm.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                        adm.status === 'AKTIF'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {adm.status === 'AKTIF' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Nonaktif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleResetPassword(adm.nama)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset Sandi
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Tidak ditemukan akun administrator yang sesuai.
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

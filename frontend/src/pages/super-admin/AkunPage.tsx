import { useState } from 'react';
import {
  Plus,
  Search,
  KeyRound,
  UserCog,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';
import type { Pegawai, UnitKerjaType } from '@/types';

type PegawaiRole = NonNullable<Pegawai['role']>;

export const AkunPage = () => {
  const { pegawaiList, addPegawai, updatePegawai } = usePenugasan();

  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Selected Account State
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string | null>(null);

  // Form States
  const [newAkun, setNewAkun] = useState<{
    nama: string;
    nip: string;
    jabatan: string;
    unitKerja: UnitKerjaType;
    email: string;
    username: string;
    role: PegawaiRole;
    password: string;
  }>({
    nama: '',
    nip: '',
    jabatan: '',
    unitKerja: 'RBI',
    email: '',
    username: '',
    role: 'USER',
    password: 'password123',
  });
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<PegawaiRole>('USER');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPegawai = pegawaiList.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nama.toLowerCase().includes(q) ||
      p.nip.toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  });

  // --- Handlers ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setBanner(null);
    setModalError(null);

    if (!newAkun.nama.trim() || !newAkun.nip.trim() || !newAkun.username.trim()) {
      setModalError('Nama, NIP, dan Username wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const res = await addPegawai({
      nama: newAkun.nama.trim(),
      nip: newAkun.nip.trim(),
      jabatan: newAkun.jabatan.trim() || 'Pelaksana',
      unitKerja: newAkun.unitKerja,
      email: newAkun.email.trim() || `${newAkun.username.trim().toLowerCase()}@pemda.go.id`,
      username: newAkun.username.trim().toLowerCase(),
      password: newAkun.password.trim() || 'password123',
      role: newAkun.role,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setModalError(res.message || 'Gagal membuat akun pegawai.');
      return;
    }

    setBanner({
      type: 'success',
      text: `Pegawai & akun "${newAkun.nama.trim()}" (${newAkun.username.trim().toLowerCase()}) berhasil disimpan ke tabel pegawai.`,
    });
    setIsAddModalOpen(false);
    setNewAkun({
      nama: '',
      nip: '',
      jabatan: '',
      unitKerja: 'RBI',
      email: '',
      username: '',
      role: 'USER',
      password: 'password123',
    });
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPegawaiId || isSubmitting) return;
    setBanner(null);
    setModalError(null);

    if (newPassword.trim().length < 6) {
      setModalError('Password baru minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const res = await updatePegawai(selectedPegawaiId, {
      password: newPassword.trim(),
    });
    setIsSubmitting(false);

    if (!res.success) {
      setModalError(res.message || 'Gagal mereset password.');
      return;
    }

    setBanner({
      type: 'success',
      text: `Password akun "${res.data?.nama || ''}" berhasil diperbarui di database.`,
    });
    setIsResetModalOpen(false);
    setNewPassword('');
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPegawaiId || isSubmitting) return;
    setBanner(null);
    setModalError(null);

    setIsSubmitting(true);
    const res = await updatePegawai(selectedPegawaiId, { role: newRole });
    setIsSubmitting(false);

    if (!res.success) {
      setModalError(res.message || 'Gagal memperbarui role akun.');
      return;
    }

    setBanner({
      type: 'success',
      text: `Role "${res.data?.nama || ''}" berhasil diubah menjadi ${newRole}.`,
    });
    setIsRoleModalOpen(false);
  };

  const openResetModal = (id: string) => {
    setSelectedPegawaiId(id);
    setNewPassword('');
    setModalError(null);
    setIsResetModalOpen(true);
  };

  const openRoleModal = (pegawai: Pegawai) => {
    setSelectedPegawaiId(pegawai.id);
    setNewRole(pegawai.role || 'USER');
    setModalError(null);
    setIsRoleModalOpen(true);
  };

  const getRoleBadgeClass = (role?: string) => {
    if (role === 'SUPER_ADMIN') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (role === 'ADMIN') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (role === 'APPROVAL') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Manajemen Akun & Pegawai</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah pegawai, atur hak akses role, dan reset kata sandi akun dalam satu halaman.
          </p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#5D87FF] hover:bg-[#4B74E8] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pegawai & Akun
        </button>
      </div>

      {banner && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, atau username..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Nama Lengkap</th>
                <th className="px-5 py-3.5 font-semibold">NIP</th>
                <th className="px-5 py-3.5 font-semibold">Username</th>
                <th className="px-5 py-3.5 font-semibold">Password</th>
                <th className="px-5 py-3.5 font-semibold">Level Akun</th>
                <th className="px-5 py-3.5 font-semibold text-center w-64">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPegawai.map((pegawai) => {
                const username = pegawai.username || pegawai.email?.split('@')[0] || '-';
                const isRootSuperAdmin = pegawai.id === 'peg-01';
                return (
                  <tr key={pegawai.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{pegawai.nama}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[13px]">{pegawai.nip}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[13px]">{username}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[13px]">••••••••</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getRoleBadgeClass(pegawai.role)}`}
                      >
                        {pegawai.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openRoleModal(pegawai)}
                          disabled={isRootSuperAdmin}
                          title={isRootSuperAdmin ? 'Role akun utama Super Admin terlindungi' : 'Ubah Role'}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors shadow-sm w-full ${
                            isRootSuperAdmin
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          Ubah Role
                        </button>
                        <button
                          onClick={() => openResetModal(pegawai.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors shadow-sm w-full cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Reset Pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPegawai.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Belum ada data pegawai / akun yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Pegawai & Akun */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Tambah Pegawai & Akun Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5">
              {modalError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input required type="text" value={newAkun.nama} onChange={e => setNewAkun({ ...newAkun, nama: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label>
                  <input required type="text" value={newAkun.nip} onChange={e => setNewAkun({ ...newAkun, nip: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Kerja</label>
                  <select value={newAkun.unitKerja} onChange={e => setNewAkun({ ...newAkun, unitKerja: e.target.value as UnitKerjaType })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                    <option value="RBI">RBI</option>
                    <option value="Fastingkom">Fastingkom</option>
                    <option value="Kepeg">Kepeg</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
                <input required type="text" placeholder="Contoh: Staf Pelaksana" value={newAkun.jabatan} onChange={e => setNewAkun({ ...newAkun, jabatan: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Kedinasan</label>
                <input type="email" placeholder="nama@pemda.go.id" value={newAkun.email} onChange={e => setNewAkun({ ...newAkun, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input required type="text" value={newAkun.username} onChange={e => setNewAkun({ ...newAkun, username: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select value={newAkun.role} onChange={e => setNewAkun({ ...newAkun, role: e.target.value as PegawaiRole })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="APPROVAL">APPROVAL</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Awal</label>
                <input required minLength={6} type="password" value={newAkun.password} onChange={e => setNewAkun({ ...newAkun, password: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pegawai & Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Reset Password</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="p-4 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (min. 6 karakter)</label>
                <input required minLength={6} type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Masukkan password baru" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  {isSubmitting ? 'Memperbarui...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ubah Role */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Ubah Role Akun</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-4 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Level Akses</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as PegawaiRole)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option value="USER">USER (Pegawai Pelaksana)</option>
                  <option value="PEGAWAI">PEGAWAI (User Biasa)</option>
                  <option value="ADMIN">ADMIN (Administrator Unit)</option>
                  <option value="APPROVAL">APPROVAL (Pejabat Approval)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

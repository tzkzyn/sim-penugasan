import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import type { UnitKerjaType } from '@/types';

export const TambahAnggotaPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    jabatan: '',
    unitKerja: 'RBI' as UnitKerjaType,
    email: '',
    role: 'PEGAWAI',
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nip) {
      alert('Nama dan NIP wajib diisi.');
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      alert(`Pegawai baru "${formData.nama}" berhasil ditambahkan ke unit ${formData.unitKerja}!`);
      navigate('/super-admin/anggota');
    }, 800);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate('/super-admin/anggota')}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-purple-600" />
            Tambah Data Pegawai Baru
          </h1>
          <p className="text-sm text-slate-500">
            Daftarkan pegawai aparatur baru ke dalam database SIM Penugasan.
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">Data pegawai berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nama Lengkap Pegawai Beserta Gelar
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Dr. H. Bambang Setiawan, M.Ed."
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nomor Induk Pegawai (NIP)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 198507112009021002"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Kedinasan
            </label>
            <input
              type="email"
              required
              placeholder="nama@kemdikbud.go.id"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Jabatan / Posisi
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pranata Komputer Ahli Muda"
              value={formData.jabatan}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Unit Kerja / POKJA
            </label>
            <select
              value={formData.unitKerja}
              onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value as UnitKerjaType })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
            >
              <option value="RBI">RBI (Reformasi Birokrasi)</option>
              <option value="Fastingkom">Fastingkom (Fasilitas & Mutu)</option>
              <option value="Kepeg">Kepeg (Kepegawaian)</option>
              <option value="PM">PM (Penjaminan Mutu)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Hak Akses Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
            >
              <option value="PEGAWAI">PEGAWAI (User Biasa)</option>
              <option value="ADMIN">ADMINISTRATOR UNIT</option>
              <option value="APPROVAL">PEJABAT APPROVAL</option>
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/super-admin/anggota')}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer"
          >
            <Save className="h-4 w-4" /> Simpan Pegawai
          </button>
        </div>
      </form>
    </div>
  );
};

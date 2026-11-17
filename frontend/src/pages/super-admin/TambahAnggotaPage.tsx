import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';
import type { Pegawai, UnitKerjaType } from '@/types';

type PegawaiRole = NonNullable<Pegawai['role']>;

export const TambahAnggotaPage = () => {
  const navigate = useNavigate();
  const { addPegawai } = usePenugasan();
  const [formData, setFormData] = useState<{
    nama: string;
    nip: string;
    jabatan: string;
    unitKerja: UnitKerjaType;
    email: string;
    username: string;
    password: string;
    role: PegawaiRole;
  }>({
    nama: '',
    nip: '',
    jabatan: '',
    unitKerja: 'RBI',
    email: '',
    username: '',
    password: 'password123',
    role: 'USER',
  });
  const [isUsernameManual, setIsUsernameManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEmailChange = (nextEmail: string) => {
    if (!isUsernameManual) {
      const autoUsername = nextEmail.includes('@')
        ? nextEmail.split('@')[0].trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
        : '';
      setFormData((prev) => ({
        ...prev,
        email: nextEmail,
        username: autoUsername,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, email: nextEmail }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    const nama = formData.nama.trim();
    const nip = formData.nip.trim();
    const jabatan = formData.jabatan.trim();
    const username = formData.username.trim().toLowerCase();
    const password = formData.password.trim();

    if (!nama || !nip || !jabatan) {
      setErrorMsg('Nama, NIP, dan Jabatan wajib diisi.');
      return;
    }
    if (!username) {
      setErrorMsg('Username akun login wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password akun minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const result = await addPegawai({
      nama,
      nip,
      jabatan,
      unitKerja: formData.unitKerja,
      email: formData.email.trim(),
      username,
      password,
      role: formData.role,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.message || 'Gagal menambahkan data pegawai baru.');
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      navigate('/super-admin/anggota');
    }, 650);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => navigate('/super-admin/anggota')}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-purple-600" />
            Tambah Pegawai & Akun Login
          </h1>
          <p className="text-sm text-slate-500">
            Simpan data kepegawaian sekaligus aktifkan akun login dalam satu tabel PostgreSQL.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {isSaved && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">
            Pegawai "{formData.nama}" beserta akun login "{formData.username}" berhasil disimpan!
          </span>
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
              placeholder="nama@pemda.go.id"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
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
        </div>

        {/* Akun Login Section */}
        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Kredensial Akun Login (Otomatis Aktif)
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username Login
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: bambang.setiawan"
                value={formData.username}
                onChange={(e) => {
                  setIsUsernameManual(true);
                  setFormData({ ...formData, username: e.target.value });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Terisi otomatis dari email, atau ubah sesuai keinginan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password Awal Akun
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Default: <span className="font-mono font-semibold">password123</span> (minimal 6 karakter).
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Hak Akses Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as PegawaiRole })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
              >
                <option value="USER">USER (Pegawai Pelaksana)</option>
                <option value="PEGAWAI">PEGAWAI (User Biasa)</option>
                <option value="ADMIN">ADMIN (Administrator Unit)</option>
                <option value="APPROVAL">APPROVAL (Pejabat Approval)</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
              </select>
            </div>
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60 transition cursor-pointer"
          >
            <Save className="h-4 w-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Pegawai & Akun'}
          </button>
        </div>
      </form>
    </div>
  );
};

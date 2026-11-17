import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserCheck,
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

interface EditAnggotaFormProps {
  pegawai: Pegawai;
  onSave: (id: string, data: Partial<Pegawai>) => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
}

const EditAnggotaForm = ({ pegawai, onSave, onCancel }: EditAnggotaFormProps) => {
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
    nama: pegawai.nama,
    nip: pegawai.nip,
    jabatan: pegawai.jabatan,
    unitKerja: pegawai.unitKerja,
    email: pegawai.email || '',
    username: pegawai.username || pegawai.email?.split('@')[0] || '',
    password: '',
    role: pegawai.role || 'USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    const trimmedPassword = formData.password.trim();
    if (trimmedPassword && trimmedPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const payload: Partial<Pegawai> = {
      nama: formData.nama.trim(),
      nip: formData.nip.trim(),
      jabatan: formData.jabatan.trim(),
      unitKerja: formData.unitKerja,
      email: formData.email.trim(),
      username: formData.username.trim().toLowerCase(),
      role: formData.role,
    };
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

    const res = await onSave(pegawai.id, payload);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Gagal memperbarui data pegawai.');
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      onCancel();
    }, 650);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {isSaved && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">Perubahan data pegawai & akun berhasil disimpan ke database!</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Nama Lengkap Pegawai Beserta Gelar
          </label>
          <input
            type="text"
            required
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

      {/* Kredensial Akun Section */}
      <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-bold text-slate-800">Kredensial Akun Login</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Username Login
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password Baru (Opsional)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Kosongkan jika tidak diubah"
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
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60 transition cursor-pointer"
        >
          <Save className="h-4 w-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
};

export const EditAnggotaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { pegawaiList, updatePegawai } = usePenugasan();

  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(() => {
    if (queryId && pegawaiList.some((p) => p.id === queryId)) return queryId;
    return pegawaiList[0]?.id || '';
  });

  const activePegawai =
    pegawaiList.find((p) => p.id === selectedPegawaiId) ||
    (queryId ? pegawaiList.find((p) => p.id === queryId) : undefined) ||
    pegawaiList[0];

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
            <UserCheck className="h-6 w-6 text-purple-600" />
            Edit Data Pegawai
          </h1>
          <p className="text-sm text-slate-500">
            Perbarui data identitas, jabatan, mutasi unit kerja, dan tingkat akses pegawai.
          </p>
        </div>
      </div>

      {/* Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Pegawai:</label>
        <select
          value={activePegawai?.id || ''}
          onChange={(e) => setSelectedPegawaiId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 max-w-md"
        >
          {pegawaiList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} ({p.unitKerja}) - NIP: {p.nip}
            </option>
          ))}
        </select>
      </div>

      {activePegawai && (
        <EditAnggotaForm
          key={activePegawai.id}
          pegawai={activePegawai}
          onSave={updatePegawai}
          onCancel={() => navigate('/super-admin/anggota')}
        />
      )}
    </div>
  );
};

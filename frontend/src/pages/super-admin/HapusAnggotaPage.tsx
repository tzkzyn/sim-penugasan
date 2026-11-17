import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserMinus, ArrowLeft, AlertTriangle, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePenugasan } from '@/context/PenugasanContext';

export const HapusAnggotaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { pegawaiList, tasks, deletePegawai } = usePenugasan();

  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(() => {
    if (queryId && pegawaiList.some((p) => p.id === queryId)) return queryId;
    return pegawaiList[1]?.id || pegawaiList[0]?.id || '';
  });
  const [alasanHapus, setAlasanHapus] = useState('Mutasi ke instansi lain');
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPegawai =
    pegawaiList.find((p) => p.id === selectedPegawaiId) ||
    (queryId ? pegawaiList.find((p) => p.id === queryId) : undefined) ||
    pegawaiList[0];

  const targetId = currentPegawai?.id || '';
  const isProtectedRootAdmin = targetId === 'peg-01';

  // Check active tasks
  const activeTasks = tasks.filter(
    (t) =>
      t.status === 'SURAT_TERBIT' &&
      t.pegawaiDitugaskan.some((p) => p.id === targetId)
  );

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPegawai || isSubmitting) return;
    setErrorMsg(null);

    if (isProtectedRootAdmin) {
      setErrorMsg('Akun utama Super Admin tidak dapat dihapus atau dinonaktifkan.');
      return;
    }

    if (activeTasks.length > 0) {
      setErrorMsg(
        `Pegawai "${currentPegawai.nama}" masih memiliki ${activeTasks.length} tugas aktif yang sedang berjalan.`
      );
      return;
    }

    if (
      confirm(
        `Konfirmasi: Apakah Anda yakin ingin menghapus data pegawai "${currentPegawai.nama}" (${alasanHapus})?`
      )
    ) {
      setIsSubmitting(true);
      const res = await deletePegawai(currentPegawai.id);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.message || 'Gagal menghapus data pegawai.');
        return;
      }

      setIsDeleted(true);
      setTimeout(() => {
        navigate('/super-admin/anggota');
      }, 700);
    }
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
            <UserMinus className="h-6 w-6 text-rose-600" />
            Penonaktifan / Hapus Data Pegawai
          </h1>
          <p className="text-sm text-slate-500">
            Prosedur penonaktifan akun kedinasan dan pemutusan akses sistem penugasan.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {isDeleted && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">Pegawai berhasil dihapus dari database sistem.</span>
        </div>
      )}

      {/* Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Pilih Pegawai yang Akan Dihapus:
        </label>
        <select
          value={targetId}
          onChange={(e) => {
            setSelectedPegawaiId(e.target.value);
            setErrorMsg(null);
          }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 max-w-md"
        >
          {pegawaiList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} ({p.unitKerja}) - NIP: {p.nip}
            </option>
          ))}
        </select>
      </div>

      {currentPegawai && (
        <form onSubmit={handleDelete} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Target Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={currentPegawai.fotoAvatar || `${import.meta.env.BASE_URL}pp-navbar-2.jpg`}
              alt={currentPegawai.nama}
              className="h-14 w-14 rounded-full object-cover border-2 border-slate-300"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-slate-800">{currentPegawai.nama}</h3>
              <p className="text-xs text-slate-500">NIP: {currentPegawai.nip} • {currentPegawai.email || '-'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md">
                  Unit: {currentPegawai.unitKerja}
                </span>
                <span className="text-xs font-medium text-slate-600">{currentPegawai.jabatan}</span>
              </div>
            </div>
          </div>

          {isProtectedRootAdmin ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block text-sm font-bold">Akun Utama Super Admin Terlindungi</strong>
                <p className="mt-1">Akun master Super Admin tidak diperbolehkan untuk dihapus demi menjaga akses administrasi sistem.</p>
              </div>
            </div>
          ) : activeTasks.length > 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block text-sm font-bold">Pegawai memiliki {activeTasks.length} tugas aktif:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {activeTasks.map((t) => (
                    <li key={t.id}>
                      {t.nomorSurat} - {t.perihal}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-amber-900 font-semibold">
                  Selesaikan penugasan atau alihkan pegawai sebelum melanjutkan penghapusan.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Pegawai ini tidak memiliki tugas aktif berjalan. Aman untuk dihapus.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Alasan Penghapusan / Penonaktifan
            </label>
            <select
              value={alasanHapus}
              onChange={(e) => setAlasanHapus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-white"
            >
              <option value="Mutasi ke instansi lain">Mutasi ke instansi lain</option>
              <option value="Pensiun / Purna Tugas">Pensiun / Purna Tugas</option>
              <option value="Pengunduran Diri">Pengunduran Diri</option>
              <option value="Penugasan Selesai (Tenaga Kontrak)">Penugasan Selesai (Tenaga Kontrak)</option>
              <option value="Pelanggaran Disiplin">Pelanggaran Disiplin</option>
            </select>
          </div>

          {/* Action */}
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
              disabled={activeTasks.length > 0 || isProtectedRootAdmin || isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                activeTasks.length > 0 || isProtectedRootAdmin || isSubmitting
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
              }`}
            >
              <Trash2 className="h-4 w-4" /> {isSubmitting ? 'Menghapus...' : 'Konfirmasi Nonaktifkan Pegawai'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

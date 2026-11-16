import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserMinus, ArrowLeft, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { dummyPegawaiList } from '@/data/dummyData';
import { usePenugasan } from '@/context/PenugasanContext';

export const HapusAnggotaPage = () => {
  const navigate = useNavigate();
  const { tasks } = usePenugasan();
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(dummyPegawaiList[0]?.id || '');
  const [alasanHapus, setAlasanHapus] = useState('Mutasi ke instansi lain');
  const [isDeleted, setIsDeleted] = useState(false);

  const currentPegawai = dummyPegawaiList.find((p) => p.id === selectedPegawaiId);

  // Check active tasks
  const activeTasks = tasks.filter(
    (t) =>
      t.status === 'SURAT_TERBIT' &&
      t.pegawaiDitugaskan.some((p) => p.id === selectedPegawaiId)
  );

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTasks.length > 0) {
      alert(
        `PERINGATAN: Pegawai "${currentPegawai?.nama}" masih memiliki ${activeTasks.length} tugas aktif yang sedang berjalan. Alihkan atau selesaikan tugas terlebih dahulu!`
      );
      return;
    }

    if (
      confirm(
        `Konfirmasi: Apakah Anda yakin ingin menonaktifkan akun & menghapus data pegawai "${currentPegawai?.nama}"?`
      )
    ) {
      setIsDeleted(true);
      setTimeout(() => {
        alert(`Pegawai "${currentPegawai?.nama}" telah dinonaktifkan dari sistem.`);
        navigate('/super-admin/anggota');
      }, 900);
    }
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
            <UserMinus className="h-6 w-6 text-rose-600" />
            Penonaktifan / Hapus Data Pegawai
          </h1>
          <p className="text-sm text-slate-500">
            Prosedur penonaktifan akun kedinasan dan pemutusan akses sistem penugasan.
          </p>
        </div>
      </div>

      {isDeleted && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">Pegawai berhasil dinonaktifkan dari sistem.</span>
        </div>
      )}

      {/* Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Pilih Pegawai yang Akan Dihapus:
        </label>
        <select
          value={selectedPegawaiId}
          onChange={(e) => setSelectedPegawaiId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 max-w-md"
        >
          {dummyPegawaiList.map((p) => (
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
              src={currentPegawai.fotoAvatar}
              alt={currentPegawai.nama}
              className="h-14 w-14 rounded-full object-cover border-2 border-slate-300"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-slate-800">{currentPegawai.nama}</h3>
              <p className="text-xs text-slate-500">NIP: {currentPegawai.nip} • {currentPegawai.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md">
                  Unit: {currentPegawai.unitKerja}
                </span>
                <span className="text-xs font-medium text-slate-600">{currentPegawai.jabatan}</span>
              </div>
            </div>
          </div>

          {/* Warning / Active Task Guard */}
          {activeTasks.length > 0 ? (
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
              <span>Pegawai ini tidak memiliki tugas aktif berjalan. Aman untuk dinonaktifkan.</span>
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
              disabled={activeTasks.length > 0}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                activeTasks.length > 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
              }`}
            >
              <Trash2 className="h-4 w-4" /> Konfirmasi Nonaktifkan Pegawai
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

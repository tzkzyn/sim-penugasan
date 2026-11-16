import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePenugasan } from '@/context/PenugasanContext';
import { dummyPegawaiList } from '@/data/dummyData';
import type { UnitKerjaType, StatusSuratTugas } from '@/types';
import { FileEdit, ArrowLeft, Save, Trash2, Calendar, MapPin, Users, CheckCircle2, ShieldCheck } from 'lucide-react';

export const EditTugasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { tasks, updateTask, deleteTask } = usePenugasan();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    if (queryId && tasks.some((t) => t.id === queryId)) return queryId;
    return tasks[0]?.id || '';
  });

  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  const [formData, setFormData] = useState({
    nomorSurat: '',
    perihal: '',
    unitKerja: 'RBI' as UnitKerjaType,
    status: 'DRAFT' as StatusSuratTugas,
    tanggalMulai: '',
    tanggalSelesai: '',
    lokasiPenugasan: '',
    lokasiSpesifik: '',
    deskripsi: '',
    pegawaiIds: [] as string[],
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (currentTask) {
      setFormData({
        nomorSurat: currentTask.nomorSurat,
        perihal: currentTask.perihal,
        unitKerja: currentTask.unitKerja as UnitKerjaType,
        status: currentTask.status as StatusSuratTugas,
        tanggalMulai: currentTask.tanggalMulai,
        tanggalSelesai: currentTask.tanggalSelesai,
        lokasiPenugasan: currentTask.lokasiPenugasan,
        lokasiSpesifik: currentTask.lokasiSpesifik || '',
        deskripsi: currentTask.deskripsi || '',
        pegawaiIds: currentTask.pegawaiDitugaskan.map((p) => p.id),
      });
      setIsSaved(false);
    }
  }, [currentTask]);

  const handlePegawaiToggle = (id: string) => {
    setFormData((prev) => {
      const exists = prev.pegawaiIds.includes(id);
      if (exists) {
        if (prev.pegawaiIds.length === 1) {
          alert('Minimal harus ada 1 pegawai yang ditugaskan.');
          return prev;
        }
        return { ...prev, pegawaiIds: prev.pegawaiIds.filter((pId) => pId !== id) };
      }
      return { ...prev, pegawaiIds: [...prev.pegawaiIds, id] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !currentTask) return;

    const assignedPegawai = dummyPegawaiList.filter((p) => formData.pegawaiIds.includes(p.id));

    await updateTask(selectedTaskId, {
      nomorSurat: formData.nomorSurat,
      perihal: formData.perihal,
      unitKerja: formData.unitKerja,
      status: formData.status,
      tanggalMulai: formData.tanggalMulai,
      tanggalSelesai: formData.tanggalSelesai,
      lokasiPenugasan: formData.lokasiPenugasan,
      lokasiSpesifik: formData.lokasiSpesifik,
      deskripsi: formData.deskripsi,
      pegawaiDitugaskan: assignedPegawai,
    });

    setIsSaved(true);
    setTimeout(() => {
      navigate('/super-admin/tugas');
    }, 1200);
  };

  const handleDelete = async () => {
    if (!selectedTaskId) return;
    if (confirm(`Apakah Anda yakin ingin menghapus surat tugas "${formData.nomorSurat}"? Tindakan ini tidak dapat dibatalkan.`)) {
      await deleteTask(selectedTaskId);
      alert('Surat tugas berhasil dihapus.');
      navigate('/super-admin/tugas');
    }
  };

  if (!currentTask) {
    return (
      <div className="mx-auto max-w-4xl p-12 text-center bg-white rounded-2xl border border-slate-200">
        <FileEdit className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-700">Tidak Ada Data Penugasan</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Belum ada surat tugas yang dapat diedit di sistem.</p>
        <button
          onClick={() => navigate('/super-admin/tugas/buat')}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
        >
          Buat Tugas Baru
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/super-admin/tugas')}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-purple-600" />
              Edit Surat Tugas (Super Admin)
            </h1>
            <p className="text-sm text-slate-500">Perbarui rincian, status persetujuan, lokasi, dan personil surat tugas.</p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
        >
          <Trash2 className="h-4 w-4" /> Hapus Surat Tugas
        </button>
      </div>

      {isSaved && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">Perubahan data surat tugas berhasil disimpan! Mengalihkan ke daftar tugas...</span>
        </div>
      )}

      {/* Task Selector Dropdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Tugas yang Diedit:</label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 max-w-md"
        >
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nomorSurat} - {t.perihal.substring(0, 45)}...
            </option>
          ))}
        </select>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nomor Surat
            </label>
            <input
              type="text"
              required
              value={formData.nomorSurat}
              onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Status Surat Tugas
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusSuratTugas })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="VERIFIKASI_SUBBAGIAN">VERIFIKASI SUBBAGIAN</option>
              <option value="PERSETUJUAN_PIMPINAN">PERSETUJUAN PIMPINAN</option>
              <option value="SURAT_TERBIT">SURAT TERBIT (Aktif)</option>
              <option value="DITOLAK">DITOLAK</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Perihal Penugasan
            </label>
            <input
              type="text"
              required
              value={formData.perihal}
              onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Unit Kerja
            </label>
            <select
              value={formData.unitKerja}
              onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value as UnitKerjaType })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
            >
              <option value="RBI">RBI</option>
              <option value="Fastingkom">Fastingkom</option>
              <option value="Kepeg">Kepeg</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-purple-500" /> Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-purple-500" /> Selesai
              </label>
              <input
                type="date"
                required
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-rose-500" /> Lokasi Penugasan (Kota/Kabupaten)
            </label>
            <input
              type="text"
              required
              value={formData.lokasiPenugasan}
              onChange={(e) => setFormData({ ...formData, lokasiPenugasan: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Lokasi Spesifik / Instansi Tujuan
            </label>
            <input
              type="text"
              value={formData.lokasiSpesifik}
              onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })}
              placeholder="Contoh: Gedung Disdikbud Prov. Jawa Barat"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Deskripsi / Ruang Lingkup Penugasan
            </label>
            <textarea
              rows={3}
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Pegawai Ditugaskan Checkbox Selector */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-purple-600" />
            Personil Pegawai Ditugaskan ({formData.pegawaiIds.length} Dipilih)
          </label>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
            {dummyPegawaiList.map((p) => {
              const isSelected = formData.pegawaiIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handlePegawaiToggle(p.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <img
                    src={p.fotoAvatar}
                    alt={p.nama}
                    className="h-8 w-8 rounded-full object-cover border border-slate-300 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{p.nama}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.unitKerja} • {p.jabatan}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/super-admin/tugas')}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition cursor-pointer"
          >
            <Save className="h-4 w-4" /> Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};

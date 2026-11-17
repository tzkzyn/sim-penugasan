import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  Pegawai,
  StatusSuratTugas,
  UnitKerjaType,
  WorkflowStep,
} from '@/types';
import {
  DEFAULT_JAM_MULAI,
  DEFAULT_JAM_SELESAI,
  detectScheduleConflicts,
  downloadFileUrl,
  getPegawaiDinasStats,
  readFileAsDataUrl,
  resolveKategoriTemplate,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import {
  Save,
  Trash2,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Send,
  Clock,
} from 'lucide-react';

interface AdminEditTugasFormProps {
  currentTask: AjuanSuratTugas;
  allTasks: AjuanSuratTugas[];
  pegawaiList: Pegawai[];
  onSaveTask: (id: string, updatedData: Partial<AjuanSuratTugas>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export const AdminEditTugasForm = ({
  currentTask,
  allTasks,
  pegawaiList,
  onSaveTask,
  onDeleteTask,
}: AdminEditTugasFormProps) => {
  const navigate = useNavigate();

  const initialPegawaiIds = currentTask.pegawaiDitugaskan.map((p) => {
    const found = pegawaiList.find(
      (item) => item.id === p.id || (p.nip && item.nip === p.nip) || item.nama === p.nama,
    );
    return found ? found.id : p.id;
  });

  const [formData, setFormData] = useState({
    nomorSurat: currentTask.nomorSurat,
    perihal: currentTask.perihal,
    unitKerja: currentTask.unitKerja as UnitKerjaType,
    kategoriTemplate: (currentTask.kategoriTemplate ??
      resolveKategoriTemplate(currentTask.pegawaiDitugaskan.length)) as KategoriTemplateSurat,
    status: currentTask.status as StatusSuratTugas,
    tanggalMulai: currentTask.tanggalMulai,
    tanggalSelesai: currentTask.tanggalSelesai,
    jamMulai: currentTask.jamMulai || DEFAULT_JAM_MULAI,
    jamSelesai: currentTask.jamSelesai || DEFAULT_JAM_SELESAI,
    lokasiPenugasan: currentTask.lokasiPenugasan,
    lokasiSpesifik: currentTask.lokasiSpesifik || '',
    deskripsi: currentTask.deskripsi || '',
    pegawaiIds: initialPegawaiIds,
    filePerbaikan: null as File | null,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const assignedPegawai = useMemo(
    () => pegawaiList.filter((p) => formData.pegawaiIds.includes(p.id)),
    [pegawaiList, formData.pegawaiIds],
  );

  const scheduleConflicts = useMemo(
    () =>
      detectScheduleConflicts(
        {
          id: currentTask.id,
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
          jamMulai: formData.jamMulai,
          jamSelesai: formData.jamSelesai,
          pegawaiDitugaskan: assignedPegawai,
        },
        allTasks,
      ),
    [
      currentTask.id,
      formData.tanggalMulai,
      formData.tanggalSelesai,
      formData.jamMulai,
      formData.jamSelesai,
      assignedPegawai,
      allTasks,
    ],
  );

  const handlePegawaiToggle = (id: string) => {
    setErrorMsg('');
    setFormData((prev) => {
      const exists = prev.pegawaiIds.includes(id);
      if (exists && prev.pegawaiIds.length === 1) {
        setErrorMsg('Minimal harus ada 1 pegawai yang ditugaskan.');
        return prev;
      }
      const nextIds = exists
        ? prev.pegawaiIds.filter((pId) => pId !== id)
        : [...prev.pegawaiIds, id];
      return {
        ...prev,
        pegawaiIds: nextIds,
        kategoriTemplate: resolveKategoriTemplate(nextIds.length),
      };
    });
  };

  const handleSave = async (e: React.FormEvent, resendToQueue = false) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedNotice('');

    if (assignedPegawai.length === 0) {
      setErrorMsg('Minimal harus ada 1 pegawai yang ditugaskan.');
      return;
    }

    const nextStatus: StatusSuratTugas = resendToQueue ? 'DRAFT' : formData.status;
    if (nextStatus !== 'DITOLAK' && scheduleConflicts.length > 0) {
      const names = Array.from(new Set(scheduleConflicts.map((c) => c.pegawai.nama))).join(', ');
      setErrorMsg(
        `Tidak dapat menyimpan karena bentrok tanggal & jam pada: ${names}. Silakan ganti personil yang ditugaskan.`,
      );
      return;
    }

    let uploadedUrl = currentTask.filePerbaikanUrl;
    let uploadedName = currentTask.filePerbaikanNama;
    if (formData.filePerbaikan) {
      const validation = validateDocumentFile(formData.filePerbaikan);
      if (validation) {
        setErrorMsg(validation);
        return;
      }
      try {
        uploadedUrl = await readFileAsDataUrl(formData.filePerbaikan);
        uploadedName = formData.filePerbaikan.name;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Gagal membaca file perbaikan.');
        return;
      }
    }

    const updatedWorkflow: WorkflowStep[] = resendToQueue
      ? [
          ...(currentTask.workflow || []),
          {
            stage: 'DRAFT',
            label: 'Perbaikan & Kirim Ulang (Admin)',
            actor: 'Admin',
            tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: 'COMPLETED',
            catatan: `Surat diperbarui (${formData.nomorSurat}) dan dikirim kembali ke persetujuan.`,
          },
        ]
      : currentTask.workflow;

    await onSaveTask(currentTask.id, {
      nomorSurat: formData.nomorSurat.trim() || currentTask.nomorSurat,
      perihal: formData.perihal,
      unitKerja: formData.unitKerja,
      kategoriTemplate: formData.kategoriTemplate,
      status: nextStatus,
      tanggalMulai: formData.tanggalMulai,
      tanggalSelesai: formData.tanggalSelesai,
      jamMulai: formData.jamMulai || DEFAULT_JAM_MULAI,
      jamSelesai: formData.jamSelesai || DEFAULT_JAM_SELESAI,
      lokasiPenugasan: formData.lokasiPenugasan,
      lokasiSpesifik: formData.lokasiSpesifik,
      deskripsi: formData.deskripsi,
      pegawaiDitugaskan: assignedPegawai,
      filePerbaikanUrl: uploadedUrl,
      filePerbaikanNama: uploadedName,
      alasanPenolakan: resendToQueue ? undefined : currentTask.alasanPenolakan,
      workflow: updatedWorkflow,
    });

    setSavedNotice(
      resendToQueue
        ? 'Perubahan surat & file perbaikan disimpan dan dikirim kembali ke antrian persetujuan!'
        : 'Perubahan data surat tugas berhasil disimpan! Mengalihkan ke daftar tugas...',
    );
    setTimeout(() => {
      navigate('/admin/tugas');
    }, 1000);
  };

  const handleDelete = async () => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus surat tugas "${formData.nomorSurat}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      await onDeleteTask(currentTask.id);
      navigate('/admin/tugas');
    }
  };

  return (
    <>
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {savedNotice && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{savedNotice}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSave(e, false)} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Hapus Surat Tugas
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nomor Surat (Bisa Diubah)
            </label>
            <input
              type="text"
              required
              value={formData.nomorSurat}
              onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Kategori Template SPT
            </label>
            <select
              value={formData.kategoriTemplate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kategoriTemplate: e.target.value as KategoriTemplateSurat,
                })
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="INDIVIDU">Individu (1 Orang)</option>
              <option value="BERDUA">Berdua (2 Orang)</option>
              <option value="KELOMPOK">Kelompok (Tim)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Status Surat Tugas
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusSuratTugas })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="VERIFIKASI_SUBBAGIAN">VERIFIKASI SUBBAGIAN</option>
              <option value="PERSETUJUAN_PIMPINAN">PERSETUJUAN PIMPINAN</option>
              <option value="SURAT_TERBIT">SURAT TERBIT (Aktif)</option>
              <option value="DITOLAK">DITOLAK</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Unit Kerja
            </label>
            <select
              value={formData.unitKerja}
              onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value as UnitKerjaType })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="RBI">RBI</option>
              <option value="Fastingkom">Fastingkom</option>
              <option value="Kepeg">Kepeg</option>
              <option value="PM">PM</option>
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:col-span-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" /> Tgl Mulai
              </label>
              <input
                type="date"
                required
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" /> Tgl Selesai
              </label>
              <input
                type="date"
                required
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" /> Jam Mulai
              </label>
              <input
                type="time"
                required
                value={formData.jamMulai}
                onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" /> Jam Selesai
              </label>
              <input
                type="time"
                required
                value={formData.jamSelesai}
                onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {scheduleConflicts.length > 0 && (
            <div className="md:col-span-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 space-y-1.5 text-xs text-rose-800">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                Bentrok Tanggal &amp; Jam Terdeteksi — Harus Ganti Orangnya
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {scheduleConflicts.map((c, idx) => (
                  <li key={`${c.pegawai.id}-${c.conflictingTask.id}-${idx}`}>
                    <strong>{c.pegawai.nama}</strong> bentrok dengan{' '}
                    <span className="font-mono font-bold">{c.conflictingTask.nomorSurat}</span> ({c.overlapStartDate} s/d {c.overlapEndDate}, {c.conflictTimeRange})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-rose-500" /> Lokasi Penugasan (Kota/Kabupaten)
            </label>
            <input
              type="text"
              required
              value={formData.lokasiPenugasan}
              onChange={(e) => setFormData({ ...formData, lokasiPenugasan: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="md:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-indigo-600" />
                Upload File Perbaikan (Jika Diedit di Microsoft Word / PDF)
              </label>
              {currentTask.filePerbaikanUrl && (
                <button
                  type="button"
                  onClick={() =>
                    downloadFileUrl(
                      currentTask.filePerbaikanUrl,
                      currentTask.filePerbaikanNama || `${formData.nomorSurat}.docx`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Unduh: {currentTask.filePerbaikanNama || 'File Perbaikan'}
                </button>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  filePerbaikan: e.target.files?.[0] || null,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {formData.filePerbaikan && (
              <p className="text-xs font-semibold text-emerald-700">
                File baru siap diunggah: {formData.filePerbaikan.name}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue-600" />
            Personil Pegawai Ditugaskan ({formData.pegawaiIds.length} Dipilih)
          </label>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
            {pegawaiList.map((p) => {
              const isSelected = formData.pegawaiIds.includes(p.id);
              const pStats = getPegawaiDinasStats(
                p,
                allTasks,
                formData.tanggalMulai || undefined,
                currentTask.id,
              );
              const pConflicts = detectScheduleConflicts(
                {
                  id: currentTask.id,
                  tanggalMulai: formData.tanggalMulai,
                  tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
                  jamMulai: formData.jamMulai,
                  jamSelesai: formData.jamSelesai,
                  pegawaiDitugaskan: [p],
                },
                allTasks,
              );
              const hasConflict = pConflicts.length > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => handlePegawaiToggle(p.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                    hasConflict
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
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
                    <p className="text-[10px] font-semibold text-blue-700">
                      Dinas: {pStats.totalDinas}x (Mgg: {pStats.dinasMingguIni}x • Bln: {pStats.dinasBulanIni}x)
                    </p>
                    {hasConflict && (
                      <p className="text-[10px] font-bold text-rose-700 truncate">
                        Bentrok: {pConflicts[0].conflictingTask.nomorSurat}
                      </p>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/admin/tugas')}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={(e) => handleSave(e, true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
          >
            <Send className="h-4 w-4" /> Simpan &amp; Kirim Kembali
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
          >
            <Save className="h-4 w-4" /> Simpan Perubahan
          </button>
        </div>
      </form>
    </>
  );
};


import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePenugasan } from '@/context/PenugasanContext';
import { useAuth } from '@/hooks/useAuth';
import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  UnitKerjaType,
} from '@/types';
import {
  DEFAULT_JAM_MULAI,
  DEFAULT_JAM_SELESAI,
  detectScheduleConflicts,
  readFileAsDataUrl,
  resolveKategoriTemplate,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import { sendEmailNotification } from '@/utils/emailService';
import { FileText, Send, ArrowLeft, AlertTriangle } from 'lucide-react';
import {
  AdminBuatTugasPreviewColumn,
  AdminPegawaiPickerDropdown,
} from '@/components/admin/AdminBuatTugasSections';

type Wilayah = { id: string; name: string };

export const BuatTugasPage = () => {
  const navigate = useNavigate();
  const { tasks: allTasks, pegawaiList, createTask } = usePenugasan();
  const { user } = useAuth();
  const currentAdmin = user || pegawaiList[0];
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [cities, setCities] = useState<Wilayah[]>([]);
  const [isWilayahLoading, setIsWilayahLoading] = useState(false);
  const [isPegawaiDropdownOpen, setIsPegawaiDropdownOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState(() => ({
    nomorSurat: `DRAFT-ST/RBI/2026/${String(allTasks.length + 1).padStart(3, '0')}`,
    perihal: '',
    unitKerja: 'RBI' as UnitKerjaType,
    kategoriTemplate: 'INDIVIDU' as KategoriTemplateSurat,
    pegawaiIds: pegawaiList[0] ? [pegawaiList[0].id] : [],
    tanggalMulai: '',
    tanggalSelesai: '',
    jamMulai: DEFAULT_JAM_MULAI,
    jamSelesai: DEFAULT_JAM_SELESAI,
    lokasiPenugasan: '',
    lokasiSpesifik: '',
    provinsiId: '',
    kotaId: '',
    koordinatLat: -6.9147,
    koordinatLng: 107.6098,
    deskripsi: '',
    file: null as File | null,
    docMode: 'editor' as 'editor' | 'upload',
    dokumenDraftText: '',
    ttdUserPng: '',
    ttdUserSignerName: '',
    ttdUserSignedAt: '',
  }));

  const toggleFormPegawai = (id: string) => {
    setFormData((prev) => {
      const exists = prev.pegawaiIds.includes(id);
      const nextIds = exists
        ? prev.pegawaiIds.filter((item) => item !== id)
        : [...prev.pegawaiIds, id];
      return {
        ...prev,
        pegawaiIds: nextIds,
        kategoriTemplate: resolveKategoriTemplate(nextIds.length),
      };
    });
    setFormError('');
  };

  const previewAssignedPegawai = pegawaiList.filter((p) => formData.pegawaiIds.includes(p.id));
  const formScheduleConflicts = useMemo(
    () =>
      detectScheduleConflicts(
        {
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
          jamMulai: formData.jamMulai,
          jamSelesai: formData.jamSelesai,
          pegawaiDitugaskan: previewAssignedPegawai,
        },
        allTasks,
      ),
    [
      formData.tanggalMulai,
      formData.tanggalSelesai,
      formData.jamMulai,
      formData.jamSelesai,
      previewAssignedPegawai,
      allTasks,
    ],
  );
  const previewProvinsi = provinces.find((item) => item.id === formData.provinsiId)?.name || '';
  const previewKota = cities.find((item) => item.id === formData.kotaId)?.name || '';
  const previewLokasi = [previewKota, previewProvinsi].filter(Boolean).join(', ') || formData.lokasiPenugasan;

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Wilayah[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!formData.provinsiId) { setTimeout(() => setCities([]), 0); return; }
    setIsWilayahLoading(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinsiId}.json`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Wilayah[]) => setCities(data))
      .catch(() => setCities([]))
      .finally(() => setIsWilayahLoading(false));
  }, [formData.provinsiId]);
  
  useEffect(() => {
    if (formData.kotaId && cities.length > 0) {
      const kotaName = cities.find(c => c.id === formData.kotaId)?.name;
      if (kotaName) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${kotaName}, Indonesia`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              setFormData(prev => ({
                ...prev,
                koordinatLat: parseFloat(data[0].lat),
                koordinatLng: parseFloat(data[0].lon)
              }));
            }
          })
          .catch(err => console.error("Geocoding failed", err));
      }
    }
  }, [formData.kotaId, cities]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const assignedPegawai = pegawaiList.filter((p) => formData.pegawaiIds.includes(p.id));
    if (assignedPegawai.length === 0 && pegawaiList[0]) assignedPegawai.push(pegawaiList[0]);

    if (formScheduleConflicts.length > 0) {
      const names = Array.from(new Set(formScheduleConflicts.map((c) => c.pegawai.nama))).join(', ');
      setFormError(
        `Pengajuan ditolak karena bentrok tanggal & jam untuk: ${names}. Silakan ganti personil yang ditugaskan.`,
      );
      return;
    }

    let uploadedFileUrl: string | undefined;
    let uploadedFileName: string | undefined;
    if (formData.file) {
      const validationError = validateDocumentFile(formData.file);
      if (validationError) {
        setFormError(validationError);
        return;
      }
      try {
        uploadedFileUrl = await readFileAsDataUrl(formData.file);
        uploadedFileName = formData.file.name;
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Gagal membaca berkas unggahan.');
        return;
      }
    }

    const provinsi = provinces.find((item) => item.id === formData.provinsiId)?.name;
    const kota = cities.find((item) => item.id === formData.kotaId)?.name;
    const newId = `st-new-${Date.now()}`;
    const newNomor =
      formData.nomorSurat.trim() ||
      `DRAFT-ST/${formData.unitKerja.toUpperCase().replace(/\s+/g, '')}/2026/${String(allTasks.length + 1).padStart(3, '0')}`;

    const newAjuan: AjuanSuratTugas = {
      id: newId,
      nomorSurat: newNomor,
      perihal: formData.perihal,
      pengaju: currentAdmin,
      pegawaiDitugaskan: assignedPegawai,
      unitKerja: formData.unitKerja,
      kategoriTemplate: formData.kategoriTemplate,
      tanggalMulai: formData.tanggalMulai,
      tanggalSelesai: formData.tanggalSelesai,
      jamMulai: formData.jamMulai || DEFAULT_JAM_MULAI,
      jamSelesai: formData.jamSelesai || DEFAULT_JAM_SELESAI,
      lokasiPenugasan: [kota, provinsi].filter(Boolean).join(', ') || formData.lokasiPenugasan,
      lokasiSpesifik: formData.lokasiSpesifik,
      koordinat: [formData.koordinatLat, formData.koordinatLng],
      deskripsi: formData.deskripsi,
      filePerbaikanUrl: uploadedFileUrl,
      filePerbaikanNama: uploadedFileName,
      dokumenDraftText: formData.docMode === 'editor' && formData.dokumenDraftText ? formData.dokumenDraftText : undefined,
      ttdUserPng: formData.ttdUserPng || undefined,
      ttdUserSignerName: formData.ttdUserSignerName || undefined,
      ttdUserSignedAt: formData.ttdUserSignedAt || undefined,
      status: 'DRAFT',
      workflow: [
        {
          stage: 'DRAFT',
          label: 'Pengajuan Draft ST',
          actor: currentAdmin.nama,
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'COMPLETED',
          catatan: 'Draft baru telah diajukan dari Admin.',
        }
      ],
    };

    await createTask(newAjuan);
    
    // Kirim notifikasi email ke semua pegawai yang ditugaskan
    try {
      for (const pegawai of assignedPegawai) {
        await sendEmailNotification({
          to_email: pegawai.email || 'user@example.com',
          to_name: pegawai.nama,
          nomor_surat: newAjuan.nomorSurat,
          perihal: newAjuan.perihal,
          tanggal_mulai: newAjuan.tanggalMulai,
          tanggal_selesai: newAjuan.tanggalSelesai,
          lokasi: newAjuan.lokasiPenugasan,
          pesan_tambahan: newAjuan.deskripsi
        });
      }
    } catch (err) {
      console.error('Failed to send email notifications', err);
    }

    navigate('/admin/tugas');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:max-w-none print:m-0 print:p-0">
      <div className="no-print flex items-center gap-4 border-b border-slate-200 pb-4 print:hidden">
        <button 
          type="button"
          onClick={() => navigate('/admin/tugas')}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Tugas Baru &amp; Dokumen Kertas A4</h1>
          <p className="text-sm text-slate-500">Isi form di sebelah kiri — lembar kertas A4 di sebelah kanan terisi otomatis &amp; dapat diedit langsung ala MS Word.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="no-print lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm print:hidden">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor Surat</label>
                  <button
                    type="button"
                    onClick={() => {
                      const year = new Date().getFullYear();
                      const prefix = `DRAFT-ST/${formData.unitKerja}/${year}/`;
                      let seq = allTasks.length + 1;
                      let candidate = `${prefix}${String(seq).padStart(3, '0')}`;
                      while (allTasks.some((t) => t.nomorSurat.trim().toLowerCase() === candidate.toLowerCase())) {
                        seq += 1;
                        candidate = `${prefix}${String(seq).padStart(3, '0')}`;
                      }
                      setFormData({ ...formData, nomorSurat: candidate });
                    }}
                    className="text-[11px] font-semibold text-[#5D87FF] hover:underline cursor-pointer"
                  >
                    Generate Otomatis
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.nomorSurat}
                  onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                />
                {formData.nomorSurat.trim() &&
                  allTasks.some(
                    (t) => t.nomorSurat.trim().toLowerCase() === formData.nomorSurat.trim().toLowerCase(),
                  ) && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">
                      Nomor surat ini sudah digunakan pada tugas lain. Klik &ldquo;Generate Otomatis&rdquo; atau ubah nomor.
                    </p>
                  )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Template SPT</label>
                <select
                  value={formData.kategoriTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kategoriTemplate: e.target.value as KategoriTemplateSurat,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                >
                  <option value="INDIVIDU">Individu (1 Orang)</option>
                  <option value="BERDUA">Berdua (2 Orang)</option>
                  <option value="KELOMPOK">Kelompok (Tim)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Perihal Penugasan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Pendampingan Monitoring Posko Kesehatan..."
                value={formData.perihal}
                onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja Pengaju</label>
                <select
                  value={formData.unitKerja}
                  onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value as UnitKerjaType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                >
                  <option value="RBI">RBI</option>
                  <option value="Fastingkom">Fastingkom</option>
                  <option value="Kepeg">Kepeg</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <AdminPegawaiPickerDropdown
                pegawaiList={pegawaiList}
                selectedIds={formData.pegawaiIds}
                allTasks={allTasks}
                tanggalMulai={formData.tanggalMulai}
                tanggalSelesai={formData.tanggalSelesai}
                jamMulai={formData.jamMulai}
                jamSelesai={formData.jamSelesai}
                isOpen={isPegawaiDropdownOpen}
                onToggleOpen={() => setIsPegawaiDropdownOpen((prev) => !prev)}
                onClose={() => setIsPegawaiDropdownOpen(false)}
                onSelectAll={() =>
                  setFormData((prev) => ({
                    ...prev,
                    pegawaiIds: pegawaiList.map((p) => p.id),
                    kategoriTemplate: resolveKategoriTemplate(pegawaiList.length),
                  }))
                }
                onReset={() => setFormData((prev) => ({ ...prev, pegawaiIds: [] }))}
                onTogglePegawai={toggleFormPegawai}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Mulai</label>
                <input
                  type="date"
                  required
                  value={formData.tanggalMulai}
                  onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Selesai</label>
                <input
                  type="date"
                  required
                  value={formData.tanggalSelesai}
                  onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  required
                  value={formData.jamMulai}
                  onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  required
                  value={formData.jamSelesai}
                  onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
                />
              </div>
            </div>

            {formScheduleConflicts.length > 0 && (
              <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 space-y-1 text-xs text-rose-800">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  Bentrok Tanggal &amp; Jam — Harus Ganti Orangnya
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5">
                  {formScheduleConflicts.map((c, idx) => (
                    <li key={`${c.pegawai.id}-${c.conflictingTask.id}-${idx}`}>
                      <strong>{c.pegawai.nama}</strong> bentrok dengan{' '}
                      <span className="font-mono font-bold">{c.conflictingTask.nomorSurat}</span> ({c.overlapStartDate} s/d {c.overlapEndDate}, {c.conflictTimeRange})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domisili Lokasi Penugasan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select required value={formData.provinsiId} onChange={(e) => setFormData({ ...formData, provinsiId: e.target.value, kotaId: '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors">
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
                </select>
                <select required value={formData.kotaId} disabled={!formData.provinsiId || isWilayahLoading} onChange={(e) => setFormData({ ...formData, kotaId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 bg-slate-50 hover:bg-white transition-colors">
                  <option value="">Pilih Kota/Kabupaten</option>
                  {cities.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Penugasan Spesifik</label>
              <input type="text" required placeholder="Contoh: Kantor, lembaga, atau sekolah tujuan" value={formData.lokasiSpesifik} onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tugas</label>
              <textarea
                rows={3}
                placeholder="Penjelasan rinci mengenai agenda dan uraian tugas..."
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors"
              />
            </div>

            {/* Bagian Pilihan Metode Dokumen */}
            <div className="space-y-2.5 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Metode Dokumen Surat
                </label>
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, docMode: 'editor' })}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      formData.docMode === 'editor'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lembar Kertas A4 (Word/Docs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, docMode: 'upload' })}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      formData.docMode === 'upload'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unggah File
                  </button>
                </div>
              </div>

              {formData.docMode === 'editor' ? (
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Gunakan lembar kerja <strong>Kertas A4 di sebelah kanan</strong> untuk menyusun, mengedit teks/format ala Microsoft Word, mengunduh file <code>.doc</code>, atau mencetaknya langsung.
                </p>
              ) : (
                <div className="mt-1 flex justify-center px-4 pt-4 pb-5 border-2 border-slate-300 border-dashed rounded-xl bg-white hover:bg-slate-50 transition-colors">
                  <div className="space-y-1.5 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-xs text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-blue-600 hover:text-blue-500">
                        <span>Pilih file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                        />
                      </label>
                      <p className="pl-1">atau seret berkas ke sini</p>
                    </div>
                    <p className="text-[11px] text-slate-500">PDF, Word, Excel (Maks 10MB)</p>
                    {formData.file && (
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        Terpilih: {formData.file.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/admin/tugas')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formScheduleConflicts.length > 0}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all ${
                  formScheduleConflicts.length > 0
                    ? 'bg-rose-200 text-rose-700 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {formScheduleConflicts.length > 0
                    ? 'Ditolak (Ganti Orang Bentrok)'
                    : 'Simpan Tugas'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* KOLOM KANAN: LEMBAR KERJA KERTAS A4 HIDUP ALA WORD */}
        <AdminBuatTugasPreviewColumn
          docMode={formData.docMode}
          file={formData.file}
          nomorSurat={formData.nomorSurat}
          perihal={formData.perihal}
          unitKerja={formData.unitKerja}
          kategoriTemplate={formData.kategoriTemplate}
          tanggalMulai={formData.tanggalMulai}
          tanggalSelesai={formData.tanggalSelesai}
          jamMulai={formData.jamMulai}
          jamSelesai={formData.jamSelesai}
          previewLokasi={previewLokasi}
          lokasiSpesifik={formData.lokasiSpesifik}
          deskripsi={formData.deskripsi}
          currentAdmin={currentAdmin}
          previewAssignedPegawai={previewAssignedPegawai}
          fallbackPegawai={pegawaiList[0]}
          ttdUserPng={formData.ttdUserPng}
          ttdUserSignerName={formData.ttdUserSignerName}
          ttdUserSignedAt={formData.ttdUserSignedAt}
          onChangeHtml={(html) => setFormData((prev) => ({ ...prev, dokumenDraftText: html }))}
          onSwitchToEditor={() => setFormData({ ...formData, docMode: 'editor' })}
        />
      </div>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  Pegawai,
  UnitKerjaType,
  WorkflowStep,
} from '@/types';
import {
  DEFAULT_JAM_MULAI,
  DEFAULT_JAM_SELESAI,
  detectScheduleConflicts,
  getPegawaiDinasStats,
  readFileAsDataUrl,
  resolveKategoriTemplate,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import { buildInitialFormState, type Wilayah } from '@/utils/userDraftAjuanHelpers';
import { UserDraftAjuanPreview } from '@/components/user/UserDraftAjuanPreview';
import { sendEmailNotification } from '@/utils/emailService';
import {
  AlertTriangle,
  ChevronDown,
  Download,
  FileEdit,
  Plus,
  Send,
  Upload,
  X,
} from 'lucide-react';

interface UserDraftAjuanModalProps {
  editingTask: AjuanSuratTugas | null;
  currentPegawai: Pegawai;
  pegawaiOptions: Pegawai[];
  nextDraftNumber: number;
  onClose: () => void;
}

export const UserDraftAjuanModal = ({
  editingTask,
  currentPegawai,
  pegawaiOptions,
  nextDraftNumber,
  onClose,
}: UserDraftAjuanModalProps) => {
  const { tasks: allTasks, templates, createTask, updateTask, downloadTemplateDocx } = usePenugasan();
  const activeApprovalTemplates = useMemo(() => templates.filter((t) => t.aktif), [templates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() =>
    !editingTask && activeApprovalTemplates[0] ? activeApprovalTemplates[0].id : '',
  );
  const [formData, setFormData] = useState(() =>
    buildInitialFormState(editingTask, currentPegawai, pegawaiOptions, activeApprovalTemplates[0]),
  );
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [cities, setCities] = useState<Wilayah[]>([]);
  const [isWilayahLoading, setIsWilayahLoading] = useState(false);
  const [isPegawaiDropdownOpen, setIsPegawaiDropdownOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const effectiveSelectedTemplateId =
    selectedTemplateId && activeApprovalTemplates.some((t) => t.id === selectedTemplateId)
      ? selectedTemplateId
      : !editingTask && activeApprovalTemplates[0]
        ? activeApprovalTemplates[0].id
        : '';

  const selectedApprovalTemplate = useMemo(
    () => activeApprovalTemplates.find((t) => t.id === effectiveSelectedTemplateId) || null,
    [activeApprovalTemplates, effectiveSelectedTemplateId],
  );

  const editingTaskId = editingTask?.id || null;

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: Wilayah[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!formData.provinsiId) {
      setTimeout(() => setCities([]), 0);
      return;
    }
    setIsWilayahLoading(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinsiId}.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: Wilayah[]) => setCities(data))
      .catch(() => setCities([]))
      .finally(() => setIsWilayahLoading(false));
  }, [formData.provinsiId]);

  useEffect(() => {
    if (formData.kotaId && cities.length > 0) {
      const kotaName = cities.find((c) => c.id === formData.kotaId)?.name;
      if (kotaName) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${kotaName}, Indonesia`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setFormData((prev) => ({
                ...prev,
                koordinatLat: parseFloat(data[0].lat),
                koordinatLng: parseFloat(data[0].lon),
              }));
            }
          })
          .catch((err) => console.error('Geocoding failed', err));
      }
    }
  }, [formData.kotaId, cities]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const applyApprovalTemplateToForm = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = activeApprovalTemplates.find((t) => t.id === tplId);
    if (!tpl) return;
    const pf = tpl.prefillData;
    setFormData((prev) => {
      const ensuredPegawaiIds =
        prev.pegawaiIds.length > 0
          ? prev.pegawaiIds
          : currentPegawai?.id
            ? [currentPegawai.id]
            : [];
      return {
        ...prev,
        kategoriTemplate:
          ensuredPegawaiIds.length > 1
            ? resolveKategoriTemplate(ensuredPegawaiIds.length)
            : tpl.kategoriTemplate || prev.kategoriTemplate,
        pegawaiIds: ensuredPegawaiIds,
        nomorSurat: pf?.nomorSurat || prev.nomorSurat,
        perihal: pf?.perihal || prev.perihal,
        lokasiSpesifik: pf?.lokasiSpesifik || prev.lokasiSpesifik,
        lokasiPenugasan: pf?.lokasiPenugasan || prev.lokasiPenugasan,
        dasarSuratDari: pf?.dasarSuratDari || prev.dasarSuratDari,
        dasarSuratNomor: pf?.dasarSuratNomor || prev.dasarSuratNomor,
        dasarSuratTanggal: pf?.dasarSuratTanggal || prev.dasarSuratTanggal,
        sumberBiaya: pf?.sumberBiaya || prev.sumberBiaya,
      };
    });
  };

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

  const previewAssignedPegawai = useMemo(
    () => pegawaiOptions.filter((p) => formData.pegawaiIds.includes(p.id)),
    [pegawaiOptions, formData.pegawaiIds],
  );

  const formScheduleConflicts = useMemo(
    () =>
      detectScheduleConflicts(
        {
          id: editingTaskId || undefined,
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
          jamMulai: formData.jamMulai,
          jamSelesai: formData.jamSelesai,
          pegawaiDitugaskan: previewAssignedPegawai,
        },
        allTasks,
      ),
    [
      editingTaskId,
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

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const assignedPegawai = pegawaiOptions.filter((p) => formData.pegawaiIds.includes(p.id));
    if (assignedPegawai.length === 0) {
      setFormError('Minimal harus memilih 1 pegawai pelaksana.');
      return;
    }

    if (formData.tanggalSelesai && formData.tanggalMulai && formData.tanggalSelesai < formData.tanggalMulai) {
      setFormError('Tanggal selesai tidak boleh lebih awal daripada tanggal mulai.');
      return;
    }

    const conflicts = detectScheduleConflicts(
      {
        id: editingTaskId || undefined,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
        jamMulai: formData.jamMulai,
        jamSelesai: formData.jamSelesai,
        pegawaiDitugaskan: assignedPegawai,
      },
      allTasks,
    );

    if (conflicts.length > 0) {
      const names = Array.from(new Set(conflicts.map((c) => c.pegawai.nama))).join(', ');
      setFormError(
        `Pengajuan ditolak sistem karena bentrok jadwal (tanggal & jam sama) untuk: ${names}. Silakan ganti orangnya terlebih dahulu.`,
      );
      return;
    }

    const resolvedLokasi = [previewKota, previewProvinsi].filter(Boolean).join(', ') || formData.lokasiPenugasan;
    if (!resolvedLokasi) {
      setFormError('Silakan pilih Provinsi dan Kota/Kabupaten domisili lokasi penugasan.');
      return;
    }

    let uploadedPerbaikanUrl = formData.existingFilePerbaikanUrl || undefined;
    let uploadedPerbaikanNama = formData.existingFilePerbaikanNama || undefined;
    if (formData.file) {
      const fileValidation = validateDocumentFile(formData.file);
      if (fileValidation) {
        setFormError(fileValidation);
        return;
      }
      try {
        uploadedPerbaikanUrl = await readFileAsDataUrl(formData.file);
        uploadedPerbaikanNama = formData.file.name;
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Gagal membaca berkas unggahan.');
        return;
      }
    }

    const timestampNow = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const resolvedNomor =
      formData.nomorSurat.trim() ||
      `DRAFT-ST/${formData.unitKerja.toUpperCase().replace(/\s+/g, '')}/2026/${String(allTasks.length + 1).padStart(3, '0')}`;

    if (editingTaskId) {
      const nextWorkflow: WorkflowStep[] = [
        ...(editingTask?.workflow || []),
        {
          stage: 'DRAFT',
          label: 'Edit & Kirim Ulang Surat Tugas',
          actor: currentPegawai?.nama || 'Pegawai',
          tanggal: timestampNow,
          status: 'COMPLETED',
          catatan: `Surat diperbarui (${resolvedNomor}) dan dikirim kembali ke alur persetujuan.`,
        },
      ];

      await updateTask(editingTaskId, {
        nomorSurat: resolvedNomor,
        perihal: formData.perihal,
        unitKerja: formData.unitKerja,
        kategoriTemplate: formData.kategoriTemplate,
        pegawaiDitugaskan: assignedPegawai,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
        jamMulai: formData.jamMulai || DEFAULT_JAM_MULAI,
        jamSelesai: formData.jamSelesai || DEFAULT_JAM_SELESAI,
        lokasiPenugasan: resolvedLokasi,
        lokasiSpesifik: formData.lokasiSpesifik,
        koordinat: [formData.koordinatLat, formData.koordinatLng],
        deskripsi: formData.deskripsi,
        dasarSuratDari: formData.dasarSuratDari,
        dasarSuratNomor: formData.dasarSuratNomor,
        dasarSuratTanggal: formData.dasarSuratTanggal,
        sumberBiaya: formData.sumberBiaya,
        namaKepala: 'Baharudin',
        filePerbaikanUrl: uploadedPerbaikanUrl,
        filePerbaikanNama: uploadedPerbaikanNama,
        dokumenDraftText: formData.dokumenDraftText || editingTask?.dokumenDraftText,
        ttdUserPng: formData.ttdUserPng || editingTask?.ttdUserPng,
        ttdUserSignerName: formData.ttdUserSignerName || editingTask?.ttdUserSignerName,
        ttdUserSignedAt: formData.ttdUserSignedAt || editingTask?.ttdUserSignedAt,
        alasanPenolakan: undefined,
        status: 'DRAFT',
        workflow: nextWorkflow,
      });
    } else {
      const newAjuan: AjuanSuratTugas = {
        id: `st-${Date.now()}`,
        nomorSurat: resolvedNomor,
        perihal: formData.perihal,
        pengaju: currentPegawai,
        pegawaiDitugaskan: assignedPegawai,
        unitKerja: formData.unitKerja,
        kategoriTemplate: formData.kategoriTemplate,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai || formData.tanggalMulai,
        jamMulai: formData.jamMulai || DEFAULT_JAM_MULAI,
        jamSelesai: formData.jamSelesai || DEFAULT_JAM_SELESAI,
        lokasiPenugasan: resolvedLokasi,
        lokasiSpesifik: formData.lokasiSpesifik,
        koordinat: [formData.koordinatLat, formData.koordinatLng],
        deskripsi: formData.deskripsi,
        dasarSuratDari: formData.dasarSuratDari,
        dasarSuratNomor: formData.dasarSuratNomor,
        dasarSuratTanggal: formData.dasarSuratTanggal,
        sumberBiaya: formData.sumberBiaya,
        namaKepala: 'Baharudin',
        filePerbaikanUrl: uploadedPerbaikanUrl,
        filePerbaikanNama: uploadedPerbaikanNama,
        dokumenDraftText:
          formData.docMode === 'editor' && formData.dokumenDraftText
            ? formData.dokumenDraftText
            : undefined,
        ttdUserPng: formData.ttdUserPng || undefined,
        ttdUserSignerName: formData.ttdUserSignerName || undefined,
        ttdUserSignedAt: formData.ttdUserSignedAt || undefined,
        status: 'DRAFT',
        workflow: [
          {
            stage: 'DRAFT',
            label: 'Pengajuan Draft ST',
            actor: currentPegawai.nama,
            tanggal: timestampNow,
            status: 'COMPLETED',
            catatan: 'Draft baru telah diajukan ke sistem.',
          },
          {
            stage: 'VERIFIKASI_SUBBAGIAN',
            label: 'Verifikasi Subbagian Umum',
            actor: `Kasubag ${formData.unitKerja}`,
            status: 'IN_PROGRESS',
            catatan: 'Menunggu review dokumen persyaratan.',
          },
          { stage: 'PERSETUJUAN_PIMPINAN', label: 'Persetujuan Pimpinan', actor: 'Kepala Dinas', status: 'PENDING' },
          { stage: 'SURAT_TERBIT', label: 'Penerbitan Surat Tugas Resmi', actor: 'Tata Usaha', status: 'PENDING' },
        ],
      };

      await createTask(newAjuan);

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
            pesan_tambahan: newAjuan.deskripsi,
          });
        }
      } catch (err) {
        console.error('Failed to send email notifications', err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:static print:bg-white print:p-0 print:block">
      <div className="bg-[#F8FAFC] rounded-2xl max-w-[1380px] w-full shadow-2xl border border-slate-200 h-[94vh] max-h-[94vh] flex flex-col overflow-hidden print:h-auto print:max-h-none print:overflow-visible print:shadow-none print:border-none print:p-0 print:rounded-none print:bg-white">
        {/* Header Modal */}
        <div className="no-print flex items-center justify-between gap-4 bg-white px-5 py-3.5 border-b border-slate-200/80 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#1D4ED8]">
              {editingTaskId ? <FileEdit className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                {editingTaskId
                  ? 'Edit Surat Tugas & Kirim Kembali'
                  : 'Form Pengajuan Draft & Editor Kertas A4 Surat Tugas'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Lengkapi data penugasan di kiri untuk menyusun surat otomatis pada lembar A4 di kanan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama: 2 Kolom Sejajar dengan Scroll Independen */}
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-4 sm:p-5 print:block print:overflow-visible print:p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-full min-h-0 print:block">
            {/* KOLOM KIRI: FORM ISIAN PENUGASAN */}
            <form
              id="draft-ajuan-form"
              onSubmit={handleSubmitDraft}
              className="no-print lg:col-span-5 lg:h-full min-h-0 lg:overflow-y-auto lg:pr-2 space-y-3.5 print:hidden"
            >
              {formError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Identitas & Template Surat */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#EEF3FB] text-[11px] font-bold text-[#1D4ED8]">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Identitas &amp; Template Surat
                  </h4>
                </div>

                {activeApprovalTemplates.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-[#F4F8FF] p-3 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-[#1E40AF]">
                      Template dari Approval ({activeApprovalTemplates.length} Tersedia)
                    </label>
                    <select
                      value={effectiveSelectedTemplateId}
                      onChange={(e) => applyApprovalTemplateToForm(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">Template Resmi Bawaan Sistem</option>
                      {activeApprovalTemplates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.namaTemplate}{tpl.fileNamaAsli ? ` (${tpl.fileNamaAsli})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedApprovalTemplate &&
                      (selectedApprovalTemplate.hasFileDocx ||
                        selectedApprovalTemplate.fileDocxDataUrl ||
                        selectedApprovalTemplate.fileNamaAsli) && (
                        <button
                          type="button"
                          onClick={() => void downloadTemplateDocx(selectedApprovalTemplate)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1D4ED8] hover:underline cursor-pointer pt-0.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh file asli ({selectedApprovalTemplate.fileNamaAsli || 'template.docx'})
                        </button>
                      )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nomor Surat
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nomorSurat}
                      onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
                      placeholder="DRAFT-ST/RBI/2026/001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jenis Template SPT
                    </label>
                    <select
                      value={formData.kategoriTemplate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kategoriTemplate: e.target.value as KategoriTemplateSurat,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="INDIVIDU">Individu (1 Orang)</option>
                      <option value="BERDUA">Berdua (2 Orang)</option>
                      <option value="KELOMPOK">Kelompok (Tim)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Perihal Penugasan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pendampingan Monitoring Posko Kesehatan..."
                    value={formData.perihal}
                    onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 2: Pelaksana & Jadwal */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#EEF3FB] text-[11px] font-bold text-[#1D4ED8]">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pelaksana &amp; Jadwal Tugas
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Kerja Pengaju
                    </label>
                    <select
                      value={formData.unitKerja}
                      onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value as UnitKerjaType })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="RBI">RBI</option>
                      <option value="Fastingkom">Fastingkom</option>
                      <option value="Kepeg">Kepeg</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pegawai Pelaksana
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsPegawaiDropdownOpen((prev) => !prev)}
                      aria-expanded={isPegawaiDropdownOpen}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                    >
                      <span className="truncate">
                        {formData.pegawaiIds.length === 0
                          ? 'Pilih Pelaksana'
                          : formData.pegawaiIds.length === 1 && formData.pegawaiIds[0] === currentPegawai.id
                            ? `${currentPegawai.nama} (Individu)`
                            : formData.pegawaiIds.length === 2
                              ? '2 Pegawai (Berdua)'
                              : formData.pegawaiIds.length === 1
                                ? pegawaiOptions.find((p) => p.id === formData.pegawaiIds[0])?.nama || '1 Pegawai Dipilih'
                                : `${formData.pegawaiIds.length} Pegawai (Kelompok)`}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isPegawaiDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isPegawaiDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsPegawaiDropdownOpen(false)} />
                        <div className="absolute right-0 left-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2 text-xs">
                            <span className="font-bold text-slate-700">Pilih Pelaksana ({formData.pegawaiIds.length})</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    pegawaiIds: pegawaiOptions.map((p) => p.id),
                                    kategoriTemplate: resolveKategoriTemplate(pegawaiOptions.length),
                                  }))
                                }
                                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                              >
                                Pilih Semua
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    pegawaiIds: [],
                                    kategoriTemplate: 'INDIVIDU',
                                  }))
                                }
                                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 pt-2">
                            {pegawaiOptions.map((p) => {
                              const isSelected = formData.pegawaiIds.includes(p.id);
                              const isSelf = p.id === currentPegawai?.id;
                              const pStats = getPegawaiDinasStats(
                                p,
                                allTasks,
                                formData.tanggalMulai || undefined,
                                editingTaskId || undefined,
                              );
                              const pConflicts = detectScheduleConflicts(
                                {
                                  id: editingTaskId || undefined,
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
                                <label
                                  key={p.id}
                                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-xs transition-colors ${
                                    hasConflict
                                      ? 'bg-rose-50/80 border border-rose-200 text-rose-900'
                                      : isSelected
                                        ? 'bg-blue-50/70 text-blue-900 font-semibold'
                                        : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleFormPegawai(p.id)}
                                      className="h-4 w-4 mt-0.5 shrink-0 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold">
                                        {p.nama} {isSelf ? '(Anda)' : ''}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        Dinas: <strong>{pStats.totalDinas}x</strong> (Mgg: {pStats.dinasMingguIni}x • Bln:{' '}
                                        {pStats.dinasBulanIni}x)
                                      </p>
                                      {hasConflict && (
                                        <p className="text-[10px] font-bold text-rose-700">
                                          Bentrok dgn {pConflicts[0].conflictingTask.nomorSurat}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
                                    {p.unitKerja}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tgl Mulai</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalMulai}
                      onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tgl Selesai</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalSelesai}
                      onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      required
                      value={formData.jamMulai}
                      onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      required
                      value={formData.jamSelesai}
                      onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {formScheduleConflicts.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>Jadwal Bentrok — Ganti Personil Pelaksana</span>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Personil berikut memiliki penugasan aktif pada waktu yang sama:
                    </p>
                    <ul className="space-y-0.5 text-[11px] text-rose-900 list-disc list-inside">
                      {formScheduleConflicts.map((c, idx) => (
                        <li key={`${c.pegawai.id}-${c.conflictingTask.id}-${idx}`}>
                          <strong>{c.pegawai.nama}</strong> bentrok dengan{' '}
                          <span className="font-mono font-bold">{c.conflictingTask.nomorSurat}</span> ({c.overlapStartDate}{' '}
                          s/d {c.overlapEndDate}, {c.conflictTimeRange})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 3: Lokasi & Deskripsi */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#EEF3FB] text-[11px] font-bold text-[#1D4ED8]">
                    3
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Lokasi &amp; Uraian Tugas
                  </h4>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Wilayah Tujuan (Provinsi / Kota)
                  </label>
                  {editingTaskId && formData.lokasiPenugasan && (
                    <p className="mb-1.5 text-[11px] text-slate-500">
                      Tersimpan: <strong className="text-slate-700">{formData.lokasiPenugasan}</strong>
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <select
                      required={!editingTaskId && !formData.lokasiPenugasan}
                      value={formData.provinsiId}
                      onChange={(e) => setFormData({ ...formData, provinsiId: e.target.value, kotaId: '' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map((wilayah) => (
                        <option key={wilayah.id} value={wilayah.id}>
                          {wilayah.name}
                        </option>
                      ))}
                    </select>
                    <select
                      required={!editingTaskId && !formData.lokasiPenugasan}
                      value={formData.kotaId}
                      disabled={!formData.provinsiId || isWilayahLoading}
                      onChange={(e) => setFormData({ ...formData, kotaId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Pilih Kota/Kabupaten</option>
                      {cities.map((wilayah) => (
                        <option key={wilayah.id} value={wilayah.id}>
                          {wilayah.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Lokasi Spesifik
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kantor, lembaga, atau sekolah tujuan"
                    value={formData.lokasiSpesifik}
                    onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Deskripsi Tugas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Penjelasan ringkas mengenai agenda kegiatan..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 4: Dasar Surat & Biaya */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#EEF3FB] text-[11px] font-bold text-[#1D4ED8]">
                    4
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Dasar Surat &amp; Sumber Biaya
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Surat Dari</label>
                    <input
                      type="text"
                      placeholder="PT. Refastindo"
                      value={formData.dasarSuratDari}
                      onChange={(e) => setFormData({ ...formData, dasarSuratDari: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Surat Dasar</label>
                    <input
                      type="text"
                      placeholder="002/PMH/RFS/2026"
                      value={formData.dasarSuratNomor}
                      onChange={(e) => setFormData({ ...formData, dasarSuratNomor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tgl. Surat Dasar</label>
                    <input
                      type="text"
                      placeholder="20 Juli 2026"
                      value={formData.dasarSuratTanggal}
                      onChange={(e) => setFormData({ ...formData, dasarSuratTanggal: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pembebanan Biaya</label>
                  <select
                    value={formData.sumberBiaya}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sumberBiaya: e.target.value as 'PENYELENGGARA' | 'DIPA' | 'LAINNYA',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="PENYELENGGARA">1. Dibebankan pada Pihak Penyelenggara (Sesuai Ketentuan)</option>
                    <option value="DIPA">2. Dibebankan pada DIPA BBPPMPV BMTI Tahun Anggaran 2026</option>
                    <option value="LAINNYA">3. Lain-lain (Perjalanan Dinas Penyelenggara &amp; Akomodasi)</option>
                  </select>
                </div>
              </div>

              {/* Section 5: Metode Dokumen & Lampiran */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#EEF3FB] text-[11px] font-bold text-[#1D4ED8]">
                      5
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Metode Dokumen
                    </h4>
                  </div>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, docMode: 'editor' })}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        formData.docMode === 'editor'
                          ? 'bg-white text-[#1E40AF] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kertas A4 Web
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, docMode: 'upload' })}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        formData.docMode === 'upload'
                          ? 'bg-white text-[#1E40AF] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Unggah Berkas
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Upload className="h-3.5 w-3.5 text-[#1D4ED8]" />
                    {editingTaskId ? 'Unggah Perbaikan Word / PDF (Opsional)' : 'Lampiran Surat Eksternal (Opsional)'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EEF3FB] file:text-[#1D4ED8] hover:file:bg-blue-100 bg-white"
                  />
                  {formData.file ? (
                    <p className="text-[11px] font-semibold text-emerald-700">
                      File siap diunggah: {formData.file.name}
                    </p>
                  ) : formData.existingFilePerbaikanNama ? (
                    <p className="text-[11px] text-[#1D4ED8]">
                      File perbaikan tersimpan: <strong>{formData.existingFilePerbaikanNama}</strong>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">Mendukung PDF, DOC, DOCX (Maks. 10 MB).</p>
                  )}
                </div>
              </div>
            </form>

            {/* KOLOM KANAN: LEMBAR KERJA KERTAS A4 */}
            <UserDraftAjuanPreview
              editingTaskId={editingTaskId}
              nextDraftNumber={nextDraftNumber}
              docMode={formData.docMode}
              file={formData.file}
              existingFilePerbaikanNama={formData.existingFilePerbaikanNama}
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
              dasarSuratDari={formData.dasarSuratDari}
              dasarSuratNomor={formData.dasarSuratNomor}
              dasarSuratTanggal={formData.dasarSuratTanggal}
              sumberBiaya={formData.sumberBiaya}
              currentPegawai={currentPegawai}
              previewAssignedPegawai={previewAssignedPegawai}
              ttdUserPng={formData.ttdUserPng}
              ttdUserSignerName={formData.ttdUserSignerName}
              ttdUserSignedAt={formData.ttdUserSignedAt}
              dokumenDraftText={formData.dokumenDraftText}
              selectedApprovalTemplate={selectedApprovalTemplate}
              onChangeHtml={(html) => setFormData((prev) => ({ ...prev, dokumenDraftText: html }))}
              onSwitchToEditor={() => setFormData({ ...formData, docMode: 'editor' })}
            />
          </div>
        </div>

        {/* Footer Aksi Tetap */}
        <div className="no-print flex items-center justify-between gap-3 bg-white px-5 py-3.5 border-t border-slate-200/80 shrink-0 print:hidden">
          <span className="hidden sm:inline text-xs text-slate-500">
            Pastikan nomor surat, jadwal, dan lokasi sudah sesuai sebelum dikirim.
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="draft-ajuan-form"
              disabled={formScheduleConflicts.length > 0}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl shadow-sm transition-all ${
                formScheduleConflicts.length > 0
                  ? 'bg-rose-100 text-rose-700 cursor-not-allowed shadow-none'
                  : 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white cursor-pointer'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {formScheduleConflicts.length > 0
                  ? 'Ditolak (Ganti Orang Bentrok)'
                  : editingTaskId
                    ? 'Simpan & Kirim Kembali'
                    : 'Kirim Ajuan Draft'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


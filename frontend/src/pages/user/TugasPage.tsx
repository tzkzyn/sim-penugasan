import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { UNIT_COLORS } from '@/data/dummyData';
import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  UnitKerjaType,
  WorkflowStep,
} from '@/types';
import {
  DEFAULT_JAM_MULAI,
  DEFAULT_JAM_SELESAI,
  detectScheduleConflicts,
  downloadFileUrl,
  formatJamRange,
  getKategoriLabel,
  getPegawaiDinasStats,
  readFileAsDataUrl,
  resolveKategoriTemplate,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Filter,
  Eye,
  X,
  FileCheck,
  Send,
  MoreHorizontal,
  Users,
  Hourglass,
  ChevronDown,
  Printer,
  FileEdit,
  AlertTriangle,
  Upload,
  Download,
} from 'lucide-react';
import { CetakSuratTugasModal, A4WordEditorCanvas } from '@/components/ui/CetakSuratTugasModal';

import { sendEmailNotification } from '@/utils/emailService';

type CheckboxDropdownProps = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  onReset: () => void;
};

const CheckboxDropdown = ({ label, options, selected, isOpen, onToggle, onChange, onReset }: CheckboxDropdownProps) => (
  <div className="relative">
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#F8FAFD] px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-white cursor-pointer" aria-expanded={isOpen}>
      <span className="truncate">{selected.length === 0 ? `Semua ${label}` : `${selected.length} dipilih`}</span>
      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="absolute left-0 top-full z-40 mt-2 max-h-72 w-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-2 shadow-xl" onMouseLeave={onToggle}>
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
          <span className="text-xs font-bold text-slate-700">{label}</span>
          {selected.length > 0 && <button type="button" onClick={onReset} className="text-[11px] font-semibold text-[#1D4ED8] hover:underline cursor-pointer">Reset</button>}
        </div>
        <div className="space-y-1 pt-2">
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-[#F3F6FB]">
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onChange(option.value)} className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500" />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const TugasPage = () => {
  type Wilayah = { id: string; name: string };
  const { user } = useAuth();
  const {
    tasks: allTasks,
    myTasks: ajuanList,
    pegawaiList,
    templates,
    createTask,
    updateTask,
    updateTaskStatus,
  } = usePenugasan();
  const activeApprovalTemplates = useMemo(() => templates.filter((t) => t.aktif), [templates]);

  const currentPegawai = user || pegawaiList[0];
  const pegawaiOptions = useMemo(
    () =>
      pegawaiList.some((p) => p.id === currentPegawai?.id)
        ? pegawaiList.map((p) => (p.id === currentPegawai?.id ? currentPegawai : p))
        : currentPegawai
          ? [currentPegawai, ...pegawaiList]
          : pegawaiList,
    [pegawaiList, currentPegawai],
  );
  const [activeTab, setActiveTab] = useState<'DAFTAR' | 'WORKFLOW'>('DAFTAR');
  const [selectedUnits, setSelectedUnits] = useState<UnitKerjaType[]>([]);
  const [isUnitFilterOpen, setIsUnitFilterOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSpecificLocations, setSelectedSpecificLocations] = useState<string[]>([]);

  // Modal Detail Workflow / Timeline
  const [selectedAjuan, setSelectedAjuan] = useState<AjuanSuratTugas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPegawaiAjuan, setSelectedPegawaiAjuan] = useState<AjuanSuratTugas | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [suratToPrint, setSuratToPrint] = useState<AjuanSuratTugas | null>(null);
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [cities, setCities] = useState<Wilayah[]>([]);
  const [isWilayahLoading, setIsWilayahLoading] = useState(false);

  // Modal Form Ajuan Baru / Edit & Kirim Ulang
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isPegawaiDropdownOpen, setIsPegawaiDropdownOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const createEmptyFormState = () => {
    const unit = (currentPegawai?.unitKerja || 'RBI') as UnitKerjaType;
    return {
      nomorSurat: '',
      perihal: '',
      unitKerja: unit,
      kategoriTemplate: 'INDIVIDU' as KategoriTemplateSurat,
      pegawaiIds: [] as string[],
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
      dasarSuratDari: '',
      dasarSuratNomor: '',
      dasarSuratTanggal: '',
      sumberBiaya: 'PENYELENGGARA' as 'PENYELENGGARA' | 'DIPA' | 'LAINNYA',
      file: null as File | null,
      existingFilePerbaikanUrl: '',
      existingFilePerbaikanNama: '',
      docMode: 'editor' as 'editor' | 'upload',
      dokumenDraftText: '',
      ttdUserPng: '',
      ttdUserSignerName: '',
      ttdUserSignedAt: '',
    };
  };

  const [formData, setFormData] = useState(createEmptyFormState);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const selectedApprovalTemplate = useMemo(
    () => activeApprovalTemplates.find((t) => t.id === selectedTemplateId) || null,
    [activeApprovalTemplates, selectedTemplateId],
  );

  const applyApprovalTemplateToForm = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = activeApprovalTemplates.find((t) => t.id === tplId);
    if (!tpl) return;
    const pf = tpl.prefillData;
    setFormData((prev) => {
      let nextPegawaiIds = prev.pegawaiIds;
      if (pf?.namaPegawai || pf?.nip) {
        const matched = pegawaiOptions.find(
          (p) =>
            (pf.nip && p.nip === pf.nip) ||
            (pf.namaPegawai && p.nama.toLowerCase().includes(pf.namaPegawai.toLowerCase())),
        );
        if (matched) nextPegawaiIds = [matched.id];
      }
      return {
        ...prev,
        kategoriTemplate: tpl.kategoriTemplate || prev.kategoriTemplate,
        pegawaiIds: nextPegawaiIds,
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

  const openCreateModal = () => {
    setEditingTaskId(null);
    setFormError('');
    setIsPegawaiDropdownOpen(false);
    const fresh = createEmptyFormState();
    const newestTpl = activeApprovalTemplates[0];
    if (newestTpl) {
      const pf = newestTpl.prefillData;
      let nextPegawaiIds = fresh.pegawaiIds;
      if (pf?.namaPegawai || pf?.nip) {
        const matched = pegawaiOptions.find(
          (p) =>
            (pf.nip && p.nip === pf.nip) ||
            (pf.namaPegawai && p.nama.toLowerCase().includes(pf.namaPegawai.toLowerCase())),
        );
        if (matched) nextPegawaiIds = [matched.id];
      }
      setSelectedTemplateId(newestTpl.id);
      setFormData({
        ...fresh,
        kategoriTemplate: newestTpl.kategoriTemplate || fresh.kategoriTemplate,
        pegawaiIds: nextPegawaiIds,
        nomorSurat: pf?.nomorSurat || '',
        perihal: pf?.perihal || '',
        lokasiSpesifik: pf?.lokasiSpesifik || '',
        lokasiPenugasan: pf?.lokasiPenugasan || '',
        dasarSuratDari: pf?.dasarSuratDari || '',
        dasarSuratNomor: pf?.dasarSuratNomor || '',
        dasarSuratTanggal: pf?.dasarSuratTanggal || '',
        sumberBiaya: pf?.sumberBiaya || fresh.sumberBiaya,
      });
    } else {
      setSelectedTemplateId('');
      setFormData(fresh);
    }
    setIsFormModalOpen(true);
  };

  const openEditAndResendModal = (item: AjuanSuratTugas) => {
    const matchedIds = item.pegawaiDitugaskan.map((p) => {
      const found = pegawaiOptions.find(
        (opt) => opt.id === p.id || (p.nip && opt.nip === p.nip) || opt.nama === p.nama,
      );
      return found ? found.id : p.id;
    });

    setEditingTaskId(item.id);
    setSelectedTemplateId('');
    setFormError('');
    setIsPegawaiDropdownOpen(false);
    setFormData({
      nomorSurat: item.nomorSurat,
      perihal: item.perihal,
      unitKerja: item.unitKerja,
      kategoriTemplate:
        item.kategoriTemplate ?? resolveKategoriTemplate(item.pegawaiDitugaskan.length),
      pegawaiIds: matchedIds.length > 0 ? matchedIds : currentPegawai ? [currentPegawai.id] : [],
      tanggalMulai: item.tanggalMulai,
      tanggalSelesai: item.tanggalSelesai,
      jamMulai: item.jamMulai || DEFAULT_JAM_MULAI,
      jamSelesai: item.jamSelesai || DEFAULT_JAM_SELESAI,
      lokasiPenugasan: item.lokasiPenugasan,
      lokasiSpesifik: item.lokasiSpesifik || '',
      provinsiId: '',
      kotaId: '',
      koordinatLat: item.koordinat?.[0] ?? -6.9147,
      koordinatLng: item.koordinat?.[1] ?? 107.6098,
      deskripsi: item.deskripsi || '',
      dasarSuratDari: item.dasarSuratDari || '',
      dasarSuratNomor: item.dasarSuratNomor || '',
      dasarSuratTanggal: item.dasarSuratTanggal || '',
      sumberBiaya: item.sumberBiaya || 'PENYELENGGARA',
      file: null,
      existingFilePerbaikanUrl: item.filePerbaikanUrl || '',
      existingFilePerbaikanNama: item.filePerbaikanNama || '',
      docMode: 'editor',
      dokumenDraftText: item.dokumenDraftText || '',
      ttdUserPng: item.ttdUserPng || '',
      ttdUserSignerName: item.ttdUserSignerName || '',
      ttdUserSignedAt: item.ttdUserSignedAt || '',
    });
    setIsFormModalOpen(true);
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

  const previewAssignedPegawai = pegawaiOptions.filter((p) => formData.pegawaiIds.includes(p.id));
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

  // Filter list
  const filteredAjuan = ajuanList.filter((item) => {
    const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unitKerja);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
    const matchesApplicant = selectedApplicants.length === 0 || selectedApplicants.includes(item.pengaju.nama);
    const matchesAssignee = selectedAssignees.length === 0 || item.pegawaiDitugaskan.some((pegawai) => selectedAssignees.includes(pegawai.nama));
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(item.lokasiPenugasan);
    const matchesSpecificLocation = selectedSpecificLocations.length === 0 || selectedSpecificLocations.includes(item.lokasiSpesifik || '');
    return matchesUnit && matchesStatus && matchesApplicant && matchesAssignee && matchesLocation && matchesSpecificLocation;
  });

  const unitOptions: UnitKerjaType[] = ['RBI', 'Fastingkom', 'Kepeg', 'PM'];
  const statusOptions = [
    { value: 'SURAT_TERBIT', label: 'Diapprove' },
    { value: 'VERIFIKASI_SUBBAGIAN', label: 'Diproses' },
    { value: 'PERSETUJUAN_PIMPINAN', label: 'Diproses (Pimpinan)' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'DITOLAK', label: 'Dibatalkan' },
  ];
  const applicantOptions = Array.from(new Map(ajuanList.map((item) => [item.pengaju.nama, item.pengaju.nama]))).map(([value, label]) => ({ value, label }));
  const assigneeOptions = Array.from(new Map(ajuanList.flatMap((item) => item.pegawaiDitugaskan).map((pegawai) => [pegawai.nama, pegawai.nama]))).map(([value, label]) => ({ value, label }));
  const locationOptions = Array.from(new Set(ajuanList.map((item) => item.lokasiPenugasan))).map((value) => ({ value, label: value }));
  const specificLocationOptions = Array.from(new Set(ajuanList.map((item) => item.lokasiSpesifik).filter(Boolean) as string[])).map((value) => ({ value, label: value }));

  const toggleUnitFilter = (unit: UnitKerjaType) => {
    setSelectedUnits((currentUnits) => currentUnits.includes(unit)
      ? currentUnits.filter((currentUnit) => currentUnit !== unit)
      : [...currentUnits, unit]);
  };

  const toggleFilterValue = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const resetFilters = () => {
    setSelectedUnits([]);
    setSelectedStatuses([]);
    setSelectedApplicants([]);
    setSelectedAssignees([]);
    setSelectedLocations([]);
    setSelectedSpecificLocations([]);
    setIsUnitFilterOpen(false);
    setOpenFilter(null);
  };

  const formatLokasiKhusus = (lokasi: string) => {
    const cleaned = lokasi.trim();
    if (!cleaned) return '';
    let result = cleaned.replace(/,?\s*jawa barat$/i, '').trim();
    result = result.replace(/^kecamatan\s+/i, '').trim();
    result = result.replace(/^desa\s+/i, '').trim();
    result = result.replace(/^kelurahan\s+/i, '').trim();
    result = result.replace(/^kota\s+/i, 'Kota ').trim();
    result = result.replace(/^kabupaten\s+/i, 'Kabupaten ').trim();
    return `${result}, Jawa Barat`;
  };

  const formatTanggal = (tanggal: string) => {
    const [tahun, bulan, hari] = tanggal.split('-');
    return `${hari}/${bulan}/${tahun}`;
  };

  const formatRentangTanggal = (tanggalMulai: string, tanggalSelesai: string) => {
    const mulai = formatTanggal(tanggalMulai);
    return tanggalMulai === tanggalSelesai ? mulai : `${mulai} s/d ${formatTanggal(tanggalSelesai)}`;
  };

  const updateStatusAjuan = (id: string, status: AjuanSuratTugas['status']) => {
    updateTaskStatus(id, status);
    setSelectedAjuan((current) => current?.id === id ? { ...current, status } : current);
    setOpenStatusId(null);
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
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

    const provinsi = provinces.find((item) => item.id === formData.provinsiId)?.name;
    const kota = cities.find((item) => item.id === formData.kotaId)?.name;
    const resolvedLokasi = [kota, provinsi].filter(Boolean).join(', ') || formData.lokasiPenugasan;
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
      const existingTask = allTasks.find((t) => t.id === editingTaskId);
      const nextWorkflow: WorkflowStep[] = [
        ...(existingTask?.workflow || []),
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
        dokumenDraftText: formData.dokumenDraftText || existingTask?.dokumenDraftText,
        ttdUserPng: formData.ttdUserPng || existingTask?.ttdUserPng,
        ttdUserSignerName: formData.ttdUserSignerName || existingTask?.ttdUserSignerName,
        ttdUserSignedAt: formData.ttdUserSignedAt || existingTask?.ttdUserSignedAt,
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

      // Kirim notifikasi email
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

    setIsFormModalOpen(false);
    setEditingTaskId(null);
    setIsPegawaiDropdownOpen(false);
    setFormData(createEmptyFormState());
  };

  const getStatusBadge = (status: AjuanSuratTugas['status']) => {
    const statusIsApproved = status === 'SURAT_TERBIT';
    const statusIsRejected = status === 'DITOLAK';
    const label = statusIsApproved ? 'Diapprove' : statusIsRejected ? 'Dibatalkan' : 'Diproses';
    const classes = statusIsApproved
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
      : statusIsRejected
        ? 'bg-rose-100 text-rose-800 border border-rose-300'
        : 'bg-slate-100 text-slate-700 border border-slate-300';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${classes}`}>
        {statusIsApproved ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : statusIsRejected ? (
          <X className="w-3.5 h-3.5 text-rose-600" />
        ) : (
          <Hourglass className="w-3.5 h-3.5" />
        )}
        {label}
      </span>
    );
  };

  return (
    <div className="p-2 sm:p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Manajemen Penugasan Pegawai</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Kelola proses ajuan surat tugas, alur persetujuan draft penugasan, dan pelacakan status penugasan instansi.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold rounded-full shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Draft Ajuan ST</span>
        </button>
      </div>

      {/* Horizontal Filter Bar + Full-Width Table */}
      <div className="space-y-5">
      <section className="w-full rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#EEF3FB] p-1 rounded-full text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('DAFTAR')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'DAFTAR'
                    ? 'bg-white text-[#1D4ED8] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Proses Ajuan ST ({ajuanList.length})
              </button>
            </div>
            <span className="text-xs text-slate-500">
              Menampilkan <strong className="text-slate-800">{filteredAjuan.length}</strong> dari {ajuanList.length} data
            </span>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>

        {/* Filter Controls Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Unit Kerja</p>
            <button
              type="button"
              onClick={() => setIsUnitFilterOpen((isOpen) => !isOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#F8FAFD] px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-white cursor-pointer"
              aria-expanded={isUnitFilterOpen}
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {selectedUnits.length === 0
                  ? 'Semua Unit'
                  : selectedUnits.length === 1
                    ? selectedUnits[0]
                    : `${selectedUnits.length} unit dipilih`}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isUnitFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUnitFilterOpen && (
              <div
                className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl"
                onMouseLeave={() => setIsUnitFilterOpen(false)}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
                  <span className="text-xs font-bold text-slate-700">Filter Unit Kerja</span>
                  {selectedUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUnits([])}
                      className="text-[11px] font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1 pt-2">
                  {unitOptions.map((unit) => (
                    <label key={unit} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-[#F3F6FB]">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit)}
                        onChange={() => toggleUnitFilter(unit)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                      />
                      <span>{unit}</span>
                    </label>
                  ))}
                </div>
                <p className="border-t border-slate-100 px-2 pt-2 text-[11px] text-slate-400">
                  Kosongkan untuk semua unit.
                </p>
              </div>
            )}
          </div>

          <CheckboxDropdown
            label="Pengaju"
            options={applicantOptions}
            selected={selectedApplicants}
            isOpen={openFilter === 'applicant'}
            onToggle={() => setOpenFilter(openFilter === 'applicant' ? null : 'applicant')}
            onChange={(value) => toggleFilterValue(setSelectedApplicants, value)}
            onReset={() => setSelectedApplicants([])}
          />
          <CheckboxDropdown
            label="Pegawai Ditugaskan"
            options={assigneeOptions}
            selected={selectedAssignees}
            isOpen={openFilter === 'assignee'}
            onToggle={() => setOpenFilter(openFilter === 'assignee' ? null : 'assignee')}
            onChange={(value) => toggleFilterValue(setSelectedAssignees, value)}
            onReset={() => setSelectedAssignees([])}
          />
          <CheckboxDropdown
            label="Domisili"
            options={locationOptions}
            selected={selectedLocations}
            isOpen={openFilter === 'location'}
            onToggle={() => setOpenFilter(openFilter === 'location' ? null : 'location')}
            onChange={(value) => toggleFilterValue(setSelectedLocations, value)}
            onReset={() => setSelectedLocations([])}
          />
          <CheckboxDropdown
            label="Lokasi"
            options={specificLocationOptions}
            selected={selectedSpecificLocations}
            isOpen={openFilter === 'specific'}
            onToggle={() => setOpenFilter(openFilter === 'specific' ? null : 'specific')}
            onChange={(value) => toggleFilterValue(setSelectedSpecificLocations, value)}
            onReset={() => setSelectedSpecificLocations([])}
          />
          <CheckboxDropdown
            label="Status"
            options={statusOptions}
            selected={selectedStatuses}
            isOpen={openFilter === 'status'}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
            onChange={(value) => toggleFilterValue(setSelectedStatuses, value)}
            onReset={() => setSelectedStatuses([])}
          />
        </div>
      </section>

      <div className="min-w-0">

      {/* TAB 1: DAFTAR PROSES AJUAN SURAT TUGAS */}
      {activeTab === 'DAFTAR' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFD] text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nomor & Perihal Surat</th>
                  <th className="px-6 py-4">Unit Kerja & Pengaju</th>
                  <th className="px-6 py-4">Pegawai Ditugaskan</th>
                  <th className="px-6 py-4">Tanggal & Domisili</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAjuan.map((item) => {
                  const unitColor = UNIT_COLORS[item.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };
                  const itemConflicts =
                    item.status === 'DITOLAK' ? [] : detectScheduleConflicts(item, allTasks);
                  const kategori = resolveKategoriTemplate(
                    item.pegawaiDitugaskan.length,
                    item.kategoriTemplate,
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 min-w-[380px]">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.nomorSurat}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {getKategoriLabel(kategori)}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{item.perihal}</p>
                        {item.filePerbaikanNama && (
                          <p className="mt-1 text-[11px] font-medium text-indigo-700">
                            File Perbaikan: {item.filePerbaikanNama}
                          </p>
                        )}
                        {item.alasanPenolakan && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-700">
                            Alasan Ditolak: {item.alasanPenolakan}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${unitColor.bg} ${unitColor.text} mb-1`}>
                          {item.unitKerja}
                        </span>
                        <p className="text-xs font-medium text-slate-600">Oleh: {item.pengaju.nama}</p>
                        <p className="text-[11px] text-slate-500">NIP: {item.pengaju.nip}</p>
                      </td>
                      <td className="px-6 py-4 min-w-[170px] align-top">
                        {item.pegawaiDitugaskan.length === 1 ? (
                          <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                            {item.pegawaiDitugaskan[0].nama}
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedPegawaiAjuan(item)}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                            aria-label={`Lihat ${item.pegawaiDitugaskan.length} pegawai yang ditugaskan`}
                          >
                            <Users className="h-3.5 w-3.5" />
                            {item.pegawaiDitugaskan.length} Pegawai
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-800">
                          {formatRentangTanggal(item.tanggalMulai, item.tanggalSelesai)}
                        </p>
                        <p className="text-[11px] font-medium text-blue-700 mt-0.5">
                          {formatJamRange(item.jamMulai, item.jamSelesai)}
                        </p>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{formatLokasiKhusus(item.lokasiPenugasan)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[190px] align-top">
                        <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{item.lokasiSpesifik || '-'}</p>
                      </td>
                      <td
                        className="relative px-6 py-4"
                        onMouseLeave={() => setOpenStatusId((current) => current === item.id ? null : current)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenStatusId(openStatusId === item.id ? null : item.id);
                              setOpenActionId(null);
                            }}
                            className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                            aria-label={`Ubah status ajuan ${item.nomorSurat}`}
                            aria-expanded={openStatusId === item.id}
                          >
                            {getStatusBadge(item.status)}
                          </button>
                          {itemConflicts.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="w-3 h-3" /> Bentrok Jadwal (Ganti Orang)
                            </span>
                          )}
                        </div>
                        {openStatusId === item.id && (
                          <div className="absolute left-6 top-14 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                            <button type="button" onClick={() => updateStatusAjuan(item.id, 'SURAT_TERBIT')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                              <CheckCircle2 className="w-4 h-4" /> Diapprove
                            </button>
                            <button type="button" onClick={() => updateStatusAjuan(item.id, 'VERIFIKASI_SUBBAGIAN')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100">
                              <Hourglass className="w-4 h-4" /> Diproses
                            </button>
                            <button type="button" onClick={() => updateStatusAjuan(item.id, 'DITOLAK')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50">
                              <X className="w-4 h-4" /> Dibatalkan
                            </button>
                          </div>
                        )}
                      </td>
                      <td
                        className="relative px-6 py-4 text-right"
                        onMouseLeave={() => setOpenActionId((current) => current === item.id ? null : current)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionId(openActionId === item.id ? null : item.id);
                            setOpenStatusId(null);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                          aria-label={`Aksi ajuan ${item.nomorSurat}`}
                          aria-expanded={openActionId === item.id}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openActionId === item.id && (
                          <div className="absolute right-6 top-14 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg text-left">
                            <button
                              type="button"
                              onClick={() => {
                                openEditAndResendModal(item);
                                setOpenActionId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 cursor-pointer"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              Edit &amp; Kirim Ulang
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAjuan(item);
                                setIsModalOpen(true);
                                setOpenActionId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Lihat Alur Draft
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSuratToPrint(item);
                                setOpenActionId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Edit Nomor / Cetak A4
                            </button>
                            {(item.filePerbaikanUrl || item.fileDraftUrl) && (
                              <button
                                type="button"
                                onClick={() => {
                                  downloadFileUrl(
                                    item.filePerbaikanUrl || item.fileDraftUrl,
                                    item.filePerbaikanNama || `${item.nomorSurat}.docx`,
                                  );
                                  setOpenActionId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Unduh File Perbaikan
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ALUR DRAFT & APPROVAL WORKFLOW */}
      {activeTab === 'WORKFLOW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Ajuan Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Pilih Ajuan Surat Tugas
            </h3>
            <p className="text-xs text-slate-500">Klik ajuan di bawah untuk meninjau alur draft & persetujuan secara mendalam.</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAjuan.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedAjuan(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${selectedAjuan?.id === item.id
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-bold text-blue-700">{item.nomorSurat}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs line-clamp-1">{item.perihal}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{item.unitKerja} • {item.lokasiPenugasan}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Stepper View */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            {selectedAjuan ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                      {selectedAjuan.nomorSurat}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mt-2">{selectedAjuan.perihal}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Pengaju: <span className="font-semibold text-slate-700">{selectedAjuan.pengaju.nama}</span> ({selectedAjuan.unitKerja})
                    </p>
                  </div>
                  <div>{getStatusBadge(selectedAjuan.status)}</div>
                </div>

                {/* Vertical Stepper Timeline */}
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-4">Tahapan Alur Persetujuan Draft ST:</h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedAjuan.workflow.map((step, idx) => {
                      const isDone = step.status === 'COMPLETED';
                      const isInProgress = step.status === 'IN_PROGRESS';

                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          {/* Dot Badge */}
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white text-xs ${isDone
                              ? 'border-emerald-500 text-emerald-600'
                              : isInProgress
                                ? 'border-blue-500 text-blue-600 animate-pulse'
                                : 'border-slate-300 text-slate-400'
                              }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                            ) : isInProgress ? (
                              <Clock className="w-4 h-4 text-blue-600" />
                            ) : (
                              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            )}
                          </div>

                          {/* Content Card */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-sm text-slate-800">{step.label}</h5>
                              {step.tanggal && <span className="text-[11px] text-slate-400 font-mono">{step.tanggal}</span>}
                            </div>
                            <p className="text-xs text-slate-600">
                              Pelaksana: <span className="font-semibold text-slate-800">{step.actor}</span>
                            </p>
                            {step.catatan && (
                              <p className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 mt-2 italic">
                                &quot;{step.catatan}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
            </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                <p className="text-sm font-medium">Pilih surat tugas di sebelah kiri untuk melihat alur persetujuan lengkap.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL DAFTAR PEGAWAI YANG DITUGASKAN */}
      {selectedPegawaiAjuan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Users className="h-5 w-5 text-blue-600" />
                  Daftar Pegawai Ditugaskan
                </h3>
                <p className="mt-1 text-xs text-slate-500">{selectedPegawaiAjuan.nomorSurat}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPegawaiAjuan(null)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup daftar pegawai"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {selectedPegawaiAjuan.pegawaiDitugaskan.map((pegawai, index) => (
                <div key={pegawai.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 space-y-1 text-sm">
                      <p className="font-bold text-slate-800">{pegawai.nama}</p>
                      <p className="text-xs text-slate-600">NIP: {pegawai.nip}</p>
                      <p className="text-xs font-semibold text-blue-700">Unit Kerja: {pegawai.unitKerja}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedPegawaiAjuan(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL ALUR WORKFLOW */}
      {isModalOpen && selectedAjuan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Alur Draft & Track Record Persetujuan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700">{selectedAjuan.nomorSurat}</span>
                {getStatusBadge(selectedAjuan.status)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedAjuan.perihal}</h4>
              <p className="text-xs text-slate-600">{selectedAjuan.deskripsi}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-800">Riwayat Tahapan Persetujuan:</h4>
              <div className="space-y-3">
                {selectedAjuan.workflow.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    {w.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : w.status === 'IN_PROGRESS' ? (
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                    )}
                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{w.label}</span>
                        <span className="text-slate-400 font-normal">{w.tanggal || 'Menunggu'}</span>
                      </div>
                      <p className="text-xs text-slate-600">Aktor: {w.actor}</p>
                      {w.catatan && <p className="text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">{w.catatan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dokumen Kertas A4 & Tombol Edit / Cetak */}
            <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Naskah Dokumen Kertas A4 (Ala MS Word / Google Docs)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSuratToPrint(selectedAjuan);
                    setIsModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Buka & Edit di Kertas A4
                </button>
              </div>
              <p className="text-xs text-slate-600">
                {selectedAjuan.dokumenDraftText
                  ? 'Naskah dokumen A4 kustom telah tersimpan. Klik tombol di kanan untuk mengedit, mengunduh Word (.doc), atau mencetaknya.'
                  : 'Menggunakan format naskah resmi SPT Diskominfo DIY standar A4. Klik tombol di kanan untuk menyesuaikan isi surat atau langsung mencetaknya.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-between items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSuratToPrint(selectedAjuan);
                    setIsModalOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" /> Buka &amp; Cetak Kertas A4
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openEditAndResendModal(selectedAjuan);
                    setIsModalOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  <FileEdit className="w-4 h-4" /> Edit &amp; Kirim Ulang
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      </div>

      {/* MODAL FORM BUAT / EDIT & KIRIM ULANG DRAFT AJUAN (SPLIT VIEW: FORM + KERTAS A4) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:static print:bg-white print:p-0 print:block">
          <div className="bg-[#F8FAFC] rounded-2xl max-w-[1380px] w-full shadow-2xl border border-slate-200 h-[94vh] max-h-[94vh] flex flex-col overflow-hidden print:h-auto print:max-h-none print:overflow-visible print:shadow-none print:border-none print:p-0 print:rounded-none print:bg-white">
            {/* Header Modal Clean */}
            <div className="no-print flex items-center justify-between gap-4 bg-white px-5 py-3.5 border-b border-slate-200/80 shrink-0 print:hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#1D4ED8]">
                  {editingTaskId ? (
                    <FileEdit className="w-4.5 h-4.5" />
                  ) : (
                    <Plus className="w-4.5 h-4.5" />
                  )}
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
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingTaskId(null);
                  setFormError('');
                }}
                aria-label="Tutup modal"
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Utama: 2 Kolom Sejajar dengan Scroll Independen */}
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-4 sm:p-5 print:block print:overflow-visible print:p-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-full min-h-0 print:block">
                {/* KOLOM KIRI: FORM ISIAN PENUGASAN TERSTRUKTUR */}
                <form
                  id="draft-ajuan-form"
                  onSubmit={handleCreateDraft}
                  className="no-print lg:col-span-5 lg:h-full min-h-0 lg:overflow-y-auto lg:pr-2 space-y-3.5 print:hidden"
                >
                  {formError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Section 1: Template & Identitas Surat */}
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
                          value={selectedTemplateId}
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
                                  ? `2 Pegawai (Berdua)`
                                  : formData.pegawaiIds.length === 1
                                    ? pegawaiOptions.find((p) => p.id === formData.pegawaiIds[0])?.nama || '1 Pegawai Dipilih'
                                    : `${formData.pegawaiIds.length} Pegawai (Kelompok)`}
                          </span>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isPegawaiDropdownOpen ? 'rotate-180' : ''}`} />
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
                                            Dinas: <strong>{pStats.totalDinas}x</strong> (Mgg: {pStats.dinasMingguIni}x • Bln: {pStats.dinasBulanIni}x)
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

                    {/* Peringatan Otomatis Bentrok Tanggal & Jam */}
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
                              <span className="font-mono font-bold">{c.conflictingTask.nomorSurat}</span> ({c.overlapStartDate} s/d {c.overlapEndDate}, {c.conflictTimeRange})
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
                          {provinces.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
                        </select>
                        <select
                          required={!editingTaskId && !formData.lokasiPenugasan}
                          value={formData.kotaId}
                          disabled={!formData.provinsiId || isWilayahLoading}
                          onChange={(e) => setFormData({ ...formData, kotaId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">Pilih Kota/Kabupaten</option>
                          {cities.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
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

                {/* KOLOM KANAN: LEMBAR KERJA KERTAS A4 HIDUP ALA WORD / GOOGLE DOCS */}
                <div className="lg:col-span-7 lg:h-full min-h-0 lg:overflow-y-auto lg:pr-1 flex flex-col print:col-span-12 print:h-auto print:overflow-visible">
                  <div className={formData.docMode === 'editor' ? 'block' : 'hidden'}>
                    <A4WordEditorCanvas
                      key={editingTaskId || 'DRAFT-NEW'}
                      data={{
                        id: editingTaskId || `DRAFT-NEW-${ajuanList.length + 1}`,
                        nomorSurat: formData.nomorSurat,
                        perihal: formData.perihal,
                        unitKerja: formData.unitKerja,
                        kategoriTemplate: formData.kategoriTemplate,
                        tanggalMulai: formData.tanggalMulai,
                        tanggalSelesai: formData.tanggalSelesai,
                        jamMulai: formData.jamMulai,
                        jamSelesai: formData.jamSelesai,
                        lokasiPenugasan: previewLokasi,
                        lokasiSpesifik: formData.lokasiSpesifik,
                        deskripsi: formData.deskripsi,
                        dasarSuratDari: formData.dasarSuratDari,
                        dasarSuratNomor: formData.dasarSuratNomor,
                        dasarSuratTanggal: formData.dasarSuratTanggal,
                        sumberBiaya: formData.sumberBiaya,
                        namaKepala: 'Baharudin',
                        pengaju: currentPegawai,
                        pegawaiDitugaskan: previewAssignedPegawai,
                        ttdUserPng: formData.ttdUserPng || undefined,
                        ttdUserSignerName: formData.ttdUserSignerName || undefined,
                        ttdUserSignedAt: formData.ttdUserSignedAt || undefined,
                      }}
                      initialHtml={editingTaskId ? formData.dokumenDraftText : undefined}
                      customTemplate={selectedApprovalTemplate}
                      autoSyncFromData={true}
                      defaultSignatureRole="user"
                      maxHeightClass="max-h-[62vh] lg:max-h-[calc(94vh-285px)]"
                      showSyncButton={true}
                      onChangeHtml={(html) => setFormData((prev) => ({ ...prev, dokumenDraftText: html }))}
                      onSignatureChange={(sig) =>
                        setFormData((prev) => ({
                          ...prev,
                          ttdUserPng: sig.png,
                          ttdUserSignerName: sig.name || currentPegawai.nama,
                          ttdUserSignedAt: sig.signedAt.toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        }))
                      }
                    />
                  </div>
                  {formData.docMode !== 'editor' && (
                    <div className="flex flex-1 min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Mode Unggah Berkas Aktif</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        {formData.file
                          ? `Berkas siap dikirim: ${formData.file.name}`
                          : formData.existingFilePerbaikanNama
                            ? `Berkas perbaikan saat ini: ${formData.existingFilePerbaikanNama}`
                            : 'Pilih file Word (.doc/.docx) atau PDF di panel kiri, atau kembali ke Editor Kertas A4.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, docMode: 'editor' })}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF] transition cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Gunakan Editor Kertas A4
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Aksi Tetap (Sticky Action Bar) */}
            <div className="no-print flex items-center justify-between gap-3 bg-white px-5 py-3.5 border-t border-slate-200/80 shrink-0 print:hidden">
              <span className="hidden sm:inline text-xs text-slate-500">
                Pastikan nomor surat, jadwal, dan lokasi sudah sesuai sebelum dikirim.
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    setEditingTaskId(null);
                    setFormError('');
                  }}
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
      )}
      {/* Modal Cetak Surat Tugas Resmi */}
      <CetakSuratTugasModal
        surat={suratToPrint}
        isOpen={Boolean(suratToPrint)}
        onClose={() => setSuratToPrint(null)}
      />
    </div>
  );
};

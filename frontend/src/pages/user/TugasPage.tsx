import { useEffect, useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { dummyPegawaiList, UNIT_COLORS } from '@/data/dummyData';
import type { AjuanSuratTugas, UnitKerjaType } from '@/types';
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
  Sparkles,
} from 'lucide-react';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';

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
    <p className="mb-2 text-sm font-medium text-slate-800">{label}</p>
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50" aria-expanded={isOpen}>
      <span className="max-w-[190px] truncate">{selected.length === 0 ? `Pilih ${label}` : `${selected.length} dipilih`}</span>
      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className={`absolute right-0 z-40 max-h-72 w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${label === 'Status' ? 'bottom-full mb-2' : 'top-full mt-2'}`} onMouseLeave={onToggle}>
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
          <span className="text-xs font-bold text-slate-700">{label}</span>
          {selected.length > 0 && <button type="button" onClick={onReset} className="text-[11px] font-semibold text-blue-600 hover:underline">Reset</button>}
        </div>
        <div className="space-y-1 pt-2">
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-slate-50">
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
  const { tasks: ajuanList, createTask, updateTaskStatus, updateTask } = usePenugasan();
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

  // Modal Form Ajuan Baru
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    perihal: '',
    unitKerja: 'RBI' as UnitKerjaType,
    pegawaiIds: [dummyPegawaiList[0].id],
    tanggalMulai: '',
    tanggalSelesai: '',
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
  });

  // Modal Edit Dokumen Naskah Langsung
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);
  const [editingDocTask, setEditingDocTask] = useState<AjuanSuratTugas | null>(null);
  const [editingDocContent, setEditingDocContent] = useState('');

  const generateDocTemplate = (type: 'spt' | 'nota') => {
    const assigned = dummyPegawaiList.filter((p) => formData.pegawaiIds.includes(p.id));
    const namaList = assigned.length > 0
      ? assigned.map((p, i) => `${i + 1}. ${p.nama} (NIP: ${p.nip} / ${p.jabatan || 'Staf'})`).join('\n')
      : '1. -';
    const provinsi = provinces.find((item) => item.id === formData.provinsiId)?.name || '';
    const kota = cities.find((item) => item.id === formData.kotaId)?.name || '';
    const lokasi = [formData.lokasiSpesifik, kota, provinsi].filter(Boolean).join(', ') || 'Lokasi Kegiatan Ditentukan Kemudian';
    const tgl = formData.tanggalMulai ? `${formData.tanggalMulai} s.d. ${formData.tanggalSelesai || formData.tanggalMulai}` : 'Sesuai Jadwal';
    const perihal = formData.perihal || '[Perihal Penugasan / Kegiatan Dinas]';

    if (type === 'spt') {
      return `PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA
DINAS KOMUNIKASI DAN INFORMATIKA
Jl. Brigjen Katamso, Danurejan, Yogyakarta 55152

SURAT PERINTAH TUGAS
Nomor: DRAFT-SPT/${formData.unitKerja}/2026

DASAR:
1. Dokumen Pelaksanaan Anggaran (DPA) Dinas Komunikasi dan Informatika DIY Tahun 2026.
2. Program kerja dan koordinasi teknis unit ${formData.unitKerja}.

MEMERINTAHKAN:
Kepada:
${namaList}

Untuk:
1. Melaksanakan agenda: ${perihal}
2. Waktu Pelaksanaan: ${tgl}
3. Lokasi/Tempat: ${lokasi}
4. Melaporkan hasil pelaksanaan kegiatan kepada atasan langsung.

Ditetapkan di: Yogyakarta
Kepala Dinas Komunikasi dan Informatika DIY`;
    } else {
      return `NOTA DINAS USULAN PENUGASAN

Kepada Yth : Kepala Dinas Komunikasi dan Informatika DIY
Dari       : Unit Kerja ${formData.unitKerja}
Perihal    : Usulan Penerbitan Surat Perintah Tugas - ${perihal}
Tanggal    : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

Dengan hormat,
Sehubungan dengan rencana agenda kegiatan dinas ${perihal}, bersama ini kami mengusulkan personil penugasan sebagai berikut:

A. Daftar Pegawai yang Diusulkan:
${namaList}

B. Rencana Waktu & Lokasi:
- Hari/Tanggal : ${tgl}
- Lokasi       : ${lokasi}

C. Uraian Agenda:
${formData.deskripsi || 'Melakukan pendampingan teknis dan koordinasi dinas di lapangan.'}

Demikian nota dinas usulan ini kami sampaikan, mohon arahan dan persetujuan Bapak/Ibu Kepala Dinas.

Pengusul,
Koordinator Bidang ${formData.unitKerja}`;
    }
  };

  const openEditDocModal = (task: AjuanSuratTugas) => {
    setEditingDocTask(task);
    if (task.dokumenDraftText) {
      setEditingDocContent(task.dokumenDraftText);
    } else {
      const namaList = task.pegawaiDitugaskan.length > 0
        ? task.pegawaiDitugaskan.map((p, i) => `${i + 1}. ${p.nama} (NIP: ${p.nip})`).join('\n')
        : '1. -';
      setEditingDocContent(`PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA
DINAS KOMUNIKASI DAN INFORMATIKA
Jl. Brigjen Katamso, Danurejan, Yogyakarta 55152

SURAT PERINTAH TUGAS
Nomor: ${task.nomorSurat}

DASAR:
1. Dokumen Pelaksanaan Anggaran (DPA) Diskominfo DIY Tahun 2026.

MEMERINTAHKAN:
Kepada:
${namaList}

Untuk:
1. Melaksanakan tugas: ${task.perihal}
2. Waktu: ${task.tanggalMulai} s.d. ${task.tanggalSelesai}
3. Lokasi: ${task.lokasiPenugasan}

Ditetapkan di: Yogyakarta
Kepala Dinas Komunikasi dan Informatika DIY`);
    }
    setIsEditDocModalOpen(true);
  };

  const handleSaveEditedDoc = async () => {
    if (!editingDocTask) return;
    await updateTask(editingDocTask.id, { dokumenDraftText: editingDocContent });
    setSelectedAjuan((prev) => (prev?.id === editingDocTask.id ? { ...prev, dokumenDraftText: editingDocContent } : prev));
    setIsEditDocModalOpen(false);
    alert('Naskah dokumen penugasan berhasil diperbarui langsung di web!');
  };

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
    const assignedPegawai = dummyPegawaiList.filter((p) => formData.pegawaiIds.includes(p.id));
    if (assignedPegawai.length === 0) assignedPegawai.push(dummyPegawaiList[0]);
    
    const provinsi = provinces.find((item) => item.id === formData.provinsiId)?.name;
    const kota = cities.find((item) => item.id === formData.kotaId)?.name;
    const newId = `st-00${ajuanList.length + 1}`;
    const newNomor = `DRAFT-ST/${formData.unitKerja.toUpperCase().replace(/\s+/g, '')}/2026/00${ajuanList.length + 1}`;

    const newAjuan: AjuanSuratTugas = {
      id: newId,
      nomorSurat: newNomor,
      perihal: formData.perihal,
      pengaju: dummyPegawaiList[0], // Logged in user
      pegawaiDitugaskan: assignedPegawai,
      unitKerja: formData.unitKerja,
      tanggalMulai: formData.tanggalMulai,
      tanggalSelesai: formData.tanggalSelesai,
      lokasiPenugasan: [kota, provinsi].filter(Boolean).join(', ') || formData.lokasiPenugasan,
      lokasiSpesifik: formData.lokasiSpesifik,
      koordinat: [formData.koordinatLat, formData.koordinatLng],
      deskripsi: formData.deskripsi,
      fileDraftUrl: formData.file ? URL.createObjectURL(formData.file) : undefined,
      dokumenDraftText: formData.docMode === 'editor' && formData.dokumenDraftText ? formData.dokumenDraftText : undefined,
      status: 'DRAFT',
      workflow: [
        {
          stage: 'DRAFT',
          label: 'Pengajuan Draft ST',
          actor: dummyPegawaiList[0].nama,
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
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
          pesan_tambahan: newAjuan.deskripsi
        });
      }
    } catch (err) {
      console.error('Failed to send email notifications', err);
    }

    setIsFormModalOpen(false);
    setFormData({
      perihal: '',
      unitKerja: 'RBI',
      pegawaiIds: [dummyPegawaiList[0].id],
      tanggalMulai: '',
      tanggalSelesai: '',
      lokasiPenugasan: '',
      lokasiSpesifik: '',
      provinsiId: '',
      kotaId: '',
      koordinatLat: -6.9147,
      koordinatLng: 107.6098,
      deskripsi: '',
      file: null,
      docMode: 'editor',
      dokumenDraftText: '',
    });
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Penugasan Pegawai</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Kelola proses ajuan surat tugas, alur persetujuan draft penugasan, dan pelacakan status penugasan instansi.
          </p>
        </div>
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Draft Ajuan ST</span>
        </button>
      </div>

      {/* Navigation, Filter Sidebar, and Table */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:sticky lg:top-6">
        <h3 className="mb-5 text-3xl font-normal tracking-tight text-slate-800">Pencarian</h3>
        <div className="flex flex-col items-start gap-4">
        {/* Sub-menu Tabs */}
        <div className="flex items-center bg-slate-200/70 p-1.5 rounded-xl text-sm font-medium w-fit">
          <button
            onClick={() => setActiveTab('DAFTAR')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'DAFTAR' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Daftar Proses Ajuan ST ({ajuanList.length})
          </button>
        </div>
        {/* Filter Controls */}
        <div className="flex w-full flex-col items-stretch justify-start gap-4">
          <div className="relative">
            <p className="mb-2 text-sm font-medium text-slate-800">Unit Kerja</p>
            <button
              type="button"
              onClick={() => setIsUnitFilterOpen((isOpen) => !isOpen)}
              className="flex w-full items-center justify-start gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
              aria-expanded={isUnitFilterOpen}
            >
              <Filter className="h-4 w-4 text-slate-400" />
              <span>
                {selectedUnits.length === 0
                  ? 'Semua Unit Kerja'
                  : selectedUnits.length === 1
                    ? selectedUnits[0]
                    : `${selectedUnits.length} unit dipilih`}
              </span>
            </button>

            {isUnitFilterOpen && (
              <div
                className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                onMouseLeave={() => setIsUnitFilterOpen(false)}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
                  <span className="text-xs font-bold text-slate-700">Filter Unit Kerja</span>
                  {selectedUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUnits([])}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1 pt-2">
                  {unitOptions.map((unit) => (
                    <label key={unit} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-slate-50">
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
                  Kosongkan pilihan untuk menampilkan semua unit.
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

          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 w-full rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-600"
          >
            Reset Filter
          </button>

        </div>
        </div>
      </aside>

      <main className="min-w-0">

      {/* TAB 1: DAFTAR PROSES AJUAN SURAT TUGAS */}
      {activeTab === 'DAFTAR' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
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

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 min-w-[430px]">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block w-fit mb-1">
                          {item.nomorSurat}
                        </span>
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{item.perihal}</p>
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
                          <div className="absolute right-6 top-14 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAjuan(item);
                                setIsModalOpen(true);
                                setOpenActionId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
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
                              Cetak Surat Tugas
                            </button>
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

            {/* Pratinjau Dokumen Naskah & Tombol Edit Langsung */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Naskah Dokumen / Surat Penugasan
                </span>
                <button
                  type="button"
                  onClick={() => openEditDocModal(selectedAjuan)}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-100/80 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-lg transition"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Edit Dokumen di Web
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                {selectedAjuan.dokumenDraftText || 'Belum ada naskah kustom tersimpan. Klik "Edit Dokumen di Web" untuk menyusun dan menyesuaikan naskah tugas ini langsung di browser.'}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => {
                  setSuratToPrint(selectedAjuan);
                  setIsModalOpen(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" /> Cetak Surat Tugas Resmi
              </button>
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

      </main>
      </div>

      {/* MODAL FORM BUAT DRAFT AJUAN BARU */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Form Pengajuan Draft Surat Tugas
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perihal Penugasan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pendampingan Monitoring Posko Kesehatan..."
                  value={formData.perihal}
                  onChange={(e) => setFormData({ ...formData, perihal: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja Pengaju</label>
                  <select
                    value={formData.unitKerja}
                    onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value as UnitKerjaType })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="RBI">RBI</option>
                    <option value="Fastingkom">Fastingkom</option>
                    <option value="Kepeg">Kepeg</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pegawai Ditugaskan</label>
                  <select
                    multiple
                    value={formData.pegawaiIds}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, pegawaiIds: options });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
                  >
                    {dummyPegawaiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.unitKerja})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Tahan tombol Ctrl/Cmd untuk memilih lebih dari satu pegawai.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSelesai}
                    onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Domisili Lokasi Penugasan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select required value={formData.provinsiId} onChange={(e) => setFormData({ ...formData, provinsiId: e.target.value, kotaId: '' })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">Pilih Provinsi</option>
                    {provinces.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
                  </select>
                  <select required value={formData.kotaId} disabled={!formData.provinsiId || isWilayahLoading} onChange={(e) => setFormData({ ...formData, kotaId: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50">
                    <option value="">Pilih Kota/Kabupaten</option>
                    {cities.map((wilayah) => <option key={wilayah.id} value={wilayah.id}>{wilayah.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Penugasan Spesifik</label>
                <input type="text" required placeholder="Contoh: Kantor, lembaga, atau sekolah tujuan" value={formData.lokasiSpesifik} onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tugas</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas mengenai agenda kegiatan..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Bagian Dokumen Pendukung / Naskah Surat */}
              <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Dokumen Pendukung / Naskah Surat Tugas
                  </label>
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, docMode: 'editor' })}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        formData.docMode === 'editor'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tulis / Edit di Web
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, docMode: 'upload' })}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-slate-600 font-medium">Pilih template otomatis:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dokumenDraftText: generateDocTemplate('spt') })}
                          className="inline-flex items-center gap-1 text-[11px] bg-blue-100/90 text-blue-800 hover:bg-blue-200 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-blue-600" /> + Template SPT Resmi
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dokumenDraftText: generateDocTemplate('nota') })}
                          className="inline-flex items-center gap-1 text-[11px] bg-amber-100/90 text-amber-800 hover:bg-amber-200 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" /> + Template Nota Usulan
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={8}
                      value={formData.dokumenDraftText}
                      onChange={(e) => setFormData({ ...formData, dokumenDraftText: e.target.value })}
                      placeholder="Ketik atau susun naskah dokumen surat tugas langsung di sini... Anda bisa mengklik tombol '+ Template SPT Resmi' di atas untuk mengisi naskah standar instansi secara otomatis."
                      className="w-full font-mono text-xs p-3.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed text-slate-800"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Dokumen dibuat langsung dalam web dan tersimpan ke draft ajuan.</span>
                      <span>{formData.dokumenDraftText.length} karakter</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Format yang didukung: PDF, Word, Excel.</p>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Ajuan Draft</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DOKUMEN NASKAH LANGSUNG DI WEB UNTUK TUGAS YANG SUDAH ADA */}
      {isEditDocModalOpen && editingDocTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-blue-600" />
                Editor Naskah Dokumen Penugasan Langsung
              </h3>
              <button
                type="button"
                onClick={() => setIsEditDocModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-600">
                Surat: <strong className="text-slate-900">{editingDocTask.nomorSurat}</strong> ({editingDocTask.perihal})
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const namaList = editingDocTask.pegawaiDitugaskan.map((p, i) => `${i + 1}. ${p.nama} (${p.nip})`).join('\n');
                    setEditingDocContent(`PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA
DINAS KOMUNIKASI DAN INFORMATIKA
Jl. Brigjen Katamso, Danurejan, Yogyakarta 55152

SURAT PERINTAH TUGAS
Nomor: ${editingDocTask.nomorSurat}

DASAR:
1. Dokumen Pelaksanaan Anggaran (DPA) Diskominfo DIY Tahun 2026.
2. Program kerja dan koordinasi teknis unit ${editingDocTask.unitKerja}.

MEMERINTAHKAN:
Kepada:
${namaList}

Untuk:
1. Melaksanakan agenda: ${editingDocTask.perihal}
2. Waktu Pelaksanaan: ${editingDocTask.tanggalMulai} s.d. ${editingDocTask.tanggalSelesai}
3. Lokasi/Tempat: ${editingDocTask.lokasiPenugasan}
4. Melaporkan hasil pelaksanaan penugasan kepada atasan langsung.

Ditetapkan di: Yogyakarta
Kepala Dinas Komunikasi dan Informatika DIY`);
                  }}
                  className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium border border-blue-200 cursor-pointer"
                >
                  + Reset Format SPT
                </button>
              </div>
            </div>

            <textarea
              rows={12}
              value={editingDocContent}
              onChange={(e) => setEditingDocContent(e.target.value)}
              placeholder="Tulis atau edit naskah dokumen surat tugas di sini..."
              className="w-full font-mono text-xs p-3.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed text-slate-800"
            />

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">
                Dokumen tersimpan langsung di sistem dan dapat dicetak kapan saja.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditDocModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedDoc}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Simpan Perubahan Dokumen
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

import { useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { UNIT_COLORS } from '@/data/dummyData';
import type { AjuanSuratTugas, UnitKerjaType } from '@/types';
import { DraftAjuanModal } from '@/components/penugasan/DraftAjuanModal';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';
import {
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  Filter,
  Eye,
  X,
  FileCheck,
  MoreHorizontal,
  Users,
  Hourglass,
  ChevronDown,
  Printer,
  Download,
} from 'lucide-react';

const hasLaporan = (task: AjuanSuratTugas): boolean =>
  Boolean(task.fileLaporanUrl || task.fileDraftUrl);

const downloadLaporanTugas = (task: AjuanSuratTugas) => {
  const fileUrl = task.fileLaporanUrl || task.fileDraftUrl;
  if (!fileUrl) return;
  const isSafeUrl =
    fileUrl.startsWith('data:') ||
    fileUrl.startsWith('blob:') ||
    fileUrl.startsWith('https://') ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('/');
  if (!isSafeUrl) return;
  const safeNomor = (task.nomorSurat || task.id).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = task.fileLaporanNama || `Laporan_${safeNomor}.pdf`;
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
  const { tasks: ajuanList, createTask, updateTaskStatus } = usePenugasan();
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
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [suratToPrint, setSuratToPrint] = useState<AjuanSuratTugas | null>(null);

  

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

  const addDraftAjuan = (newAjuan: AjuanSuratTugas) => {
    createTask(newAjuan);
    setIsDraftModalOpen(false);
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
              Kelola proses ajuan surat tugas dan pelacakan status penugasan instansi.
            </p>
          </div>
        </div>
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
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${activeTab === 'DAFTAR' ? 'bg-white text-[#1D4ED8] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            label="Pelaksana"
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

      <main className="min-w-0">

      {/* TAB 1: DAFTAR PROSES AJUAN SURAT TUGAS */}
      {activeTab === 'DAFTAR' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_6px_24px_-6px_rgba(30,64,175,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFD] text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Surat &amp; Pengaju</th>
                  <th className="px-5 py-3.5">Pelaksana</th>
                  <th className="px-5 py-3.5">Jadwal &amp; Lokasi</th>
                  <th className="px-5 py-3.5">Status &amp; Laporan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAjuan.map((item) => {
                  const unitColor = UNIT_COLORS[item.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 align-top max-w-sm">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                            {item.nomorSurat}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${unitColor.bg} ${unitColor.text}`}>
                            {item.unitKerja}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 line-clamp-2 leading-snug">{item.perihal}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Pengaju: <span className="font-medium text-slate-700">{item.pengaju.nama}</span>
                          {item.pengaju.nip && item.pengaju.nip !== '-' ? ` • ${item.pengaju.nip}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        {item.pegawaiDitugaskan.length === 1 ? (
                          <p className="text-xs font-semibold text-slate-800">
                            {item.pegawaiDitugaskan[0].nama}
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedPegawaiAjuan(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 cursor-pointer"
                            aria-label={`Lihat ${item.pegawaiDitugaskan.length} pegawai yang ditugaskan`}
                          >
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {item.pegawaiDitugaskan.length} Pegawai
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top min-w-[200px]">
                        <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {formatRentangTanggal(item.tanggalMulai, item.tanggalSelesai)}
                        </p>
                        <div className="flex items-start gap-1 text-slate-500 text-xs mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {item.lokasiSpesifik ? `${item.lokasiSpesifik} • ` : ''}
                            {formatLokasiKhusus(item.lokasiPenugasan)}
                          </span>
                        </div>
                      </td>
                      <td
                        className="relative px-5 py-4 align-top whitespace-nowrap"
                        onMouseLeave={() => setOpenStatusId((current) => current === item.id ? null : current)}
                      >
                        <div className="flex flex-col items-start gap-1.5">
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
                          {hasLaporan(item) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Laporan Lengkap
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              <Clock className="w-3 h-3" /> Belum Laporan
                            </span>
                          )}
                        </div>
                        {openStatusId === item.id && (
                          <div className="absolute left-5 top-14 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                            <button type="button" onClick={() => updateStatusAjuan(item.id, 'SURAT_TERBIT')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                              <CheckCircle2 className="w-4 h-4" /> Diapprove
                            </button>
                            <button type="button" onClick={() => updateStatusAjuan(item.id, 'VERIFIKASI_SUBBAGIAN')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                              <Hourglass className="w-4 h-4" /> Diproses
                            </button>
                            <button type="button" onClick={() => updateStatusAjuan(item.id, 'DITOLAK')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer">
                              <X className="w-4 h-4" /> Dibatalkan
                            </button>
                          </div>
                        )}
                      </td>
                      <td
                        className="relative px-5 py-4 align-top text-right whitespace-nowrap"
                        onMouseLeave={() => setOpenActionId((current) => current === item.id ? null : current)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionId(openActionId === item.id ? null : item.id);
                            setOpenStatusId(null);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                          aria-label={`Aksi ajuan ${item.nomorSurat}`}
                          aria-expanded={openActionId === item.id}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openActionId === item.id && (
                          <div className="absolute right-5 top-14 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg text-left">
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
                            {hasLaporan(item) && (
                              <button
                                type="button"
                                onClick={() => {
                                  downloadLaporanTugas(item);
                                  setOpenActionId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Unduh Laporan
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredAjuan.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      Belum ada ajuan surat tugas yang sesuai filter saat ini.
                    </td>
                  </tr>
                )}
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Berkas Laporan Pelaksanaan Tugas
              </p>
              {hasLaporan(selectedAjuan) ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Berkas Lengkap
                    </span>
                    <p className="text-xs font-semibold text-slate-800 truncate pt-1">
                      {selectedAjuan.fileLaporanNama || 'Dokumen Laporan Tugas'}
                    </p>
                    {selectedAjuan.tanggalLaporan && (
                      <p className="text-[11px] text-slate-500">
                        Diunggah: {selectedAjuan.tanggalLaporan}
                      </p>
                    )}
                    {selectedAjuan.catatanLaporan && (
                      <p className="text-xs text-slate-600 italic">
                        &quot;{selectedAjuan.catatanLaporan}&quot;
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadLaporanTugas(selectedAjuan)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Laporan Tugas
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Belum ada berkas laporan pelaksanaan yang diunggah pegawai.
                </p>
              )}
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

      {/* Modal Cetak Surat Tugas Resmi */}
      <CetakSuratTugasModal
        surat={suratToPrint}
        isOpen={Boolean(suratToPrint)}
        onClose={() => setSuratToPrint(null)}
      />

      </main>
      </div>

      {/* MODAL FORM BUAT DRAFT AJUAN BARU */}
      <DraftAjuanModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        onSubmit={addDraftAjuan}
        nextNumber={ajuanList.length + 1}
      />
    </div>
  );
};

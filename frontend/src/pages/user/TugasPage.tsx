import { useState } from 'react';
import { usePenugasan } from '@/context/PenugasanContext';
import { UNIT_COLORS } from '@/data/dummyData';
import type { AjuanSuratTugas, UnitKerjaType } from '@/types';
import {
  detectScheduleConflicts,
  downloadFileUrl,
  formatJamRange,
  getKategoriLabel,
  resolveKategoriTemplate,
} from '@/utils/penugasanHelpers';
import {
  FileText,
  MapPin,
  Filter,
  Eye,
  X,
  Users,
  ChevronDown,
  Printer,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';
import {
  AjuanStatusBadge,
  PegawaiDitugaskanModal,
  WorkflowDetailModal,
} from '@/components/user/UserAjuanModals';
import { UserWorkflowTab } from '@/components/user/UserWorkflowTab';

type CheckboxDropdownProps = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  onReset: () => void;
};

const CheckboxDropdown = ({
  label,
  options,
  selected,
  isOpen,
  onToggle,
  onChange,
  onReset,
}: CheckboxDropdownProps) => (
  <div className="relative">
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#F8FAFD] px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-white cursor-pointer"
      aria-expanded={isOpen}
    >
      <span className="truncate">{selected.length === 0 ? `Semua ${label}` : `${selected.length} dipilih`}</span>
      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div
        className="absolute left-0 top-full z-40 mt-2 max-h-72 w-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-2 shadow-xl"
        onMouseLeave={onToggle}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
          <span className="text-xs font-bold text-slate-700">{label}</span>
          {selected.length > 0 && (
            <button type="button" onClick={onReset} className="text-[11px] font-semibold text-[#1D4ED8] hover:underline cursor-pointer">
              Reset
            </button>
          )}
        </div>
        <div className="space-y-1 pt-2">
          {options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-[#F3F6FB]">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const TugasPage = () => {
  const { tasks: allTasks, myTasks: ajuanList } = usePenugasan();

  const [activeTab, setActiveTab] = useState<'DAFTAR' | 'WORKFLOW'>('DAFTAR');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<UnitKerjaType[]>([]);
  const [isUnitFilterOpen, setIsUnitFilterOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSpecificLocations, setSelectedSpecificLocations] = useState<string[]>([]);

  const activeFilterCount =
    selectedUnits.length +
    selectedStatuses.length +
    selectedApplicants.length +
    selectedAssignees.length +
    selectedLocations.length +
    selectedSpecificLocations.length;

  const [selectedAjuan, setSelectedAjuan] = useState<AjuanSuratTugas | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPegawaiAjuan, setSelectedPegawaiAjuan] = useState<AjuanSuratTugas | null>(null);
  const [suratToPrint, setSuratToPrint] = useState<AjuanSuratTugas | null>(null);

  const filteredAjuan = ajuanList.filter((item) => {
    const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unitKerja);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
    const matchesApplicant = selectedApplicants.length === 0 || selectedApplicants.includes(item.pengaju.nama);
    const matchesAssignee =
      selectedAssignees.length === 0 ||
      item.pegawaiDitugaskan.some((pegawai) => selectedAssignees.includes(pegawai.nama));
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(item.lokasiPenugasan);
    const matchesSpecificLocation =
      selectedSpecificLocations.length === 0 ||
      selectedSpecificLocations.includes(item.lokasiSpesifik || '');
    return (
      matchesUnit &&
      matchesStatus &&
      matchesApplicant &&
      matchesAssignee &&
      matchesLocation &&
      matchesSpecificLocation
    );
  });

  const unitOptions: UnitKerjaType[] = ['RBI', 'Fastingkom', 'Kepeg', 'PM'];
  const statusOptions = [
    { value: 'SURAT_TERBIT', label: 'Diapprove' },
    { value: 'VERIFIKASI_SUBBAGIAN', label: 'Diproses' },
    { value: 'PERSETUJUAN_PIMPINAN', label: 'Diproses (Pimpinan)' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'DITOLAK', label: 'Dibatalkan' },
  ];
  const applicantOptions = Array.from(new Map(ajuanList.map((item) => [item.pengaju.nama, item.pengaju.nama]))).map(
    ([value, label]) => ({ value, label }),
  );
  const assigneeOptions = Array.from(
    new Map(ajuanList.flatMap((item) => item.pegawaiDitugaskan).map((pegawai) => [pegawai.nama, pegawai.nama])),
  ).map(([value, label]) => ({ value, label }));
  const locationOptions = Array.from(new Set(ajuanList.map((item) => item.lokasiPenugasan))).map((value) => ({
    value,
    label: value,
  }));
  const specificLocationOptions = Array.from(
    new Set(ajuanList.map((item) => item.lokasiSpesifik).filter(Boolean) as string[]),
  ).map((value) => ({ value, label: value }));

  const toggleUnitFilter = (unit: UnitKerjaType) => {
    setSelectedUnits((currentUnits) =>
      currentUnits.includes(unit)
        ? currentUnits.filter((currentUnit) => currentUnit !== unit)
        : [...currentUnits, unit],
    );
  };

  const toggleFilterValue = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
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

  return (
    <div className="p-2 sm:p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Surat Tugas Saya</h2>
            <p className="text-xs text-slate-500">Surat perintah tugas yang diterbitkan dan ditugaskan kepada Anda oleh Admin.</p>
          </div>
        </div>
      </div>

      {/* Unified Filter Toolbar + Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('DAFTAR')}
                className={`text-base font-bold transition-colors cursor-pointer ${
                  activeTab === 'DAFTAR' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Surat Tugas Diterima ({ajuanList.length})
              </button>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {filteredAjuan.length} dari {ajuanList.length} data
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Filter: Unit Kerja */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnitFilterOpen((isOpen) => !isOpen);
                    setOpenFilter(null);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    selectedUnits.length > 0
                      ? 'border-[#5D87FF]/40 bg-[#ECF2FF] text-[#5D87FF]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                  aria-expanded={isUnitFilterOpen}
                >
                  <Filter className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {selectedUnits.length === 0
                      ? 'Unit Kerja'
                      : selectedUnits.length === 1
                        ? selectedUnits[0]
                        : `${selectedUnits.length} Unit`}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isUnitFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUnitFilterOpen && (
                  <div
                    className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl"
                    onMouseLeave={() => setIsUnitFilterOpen(false)}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
                      <span className="text-xs font-bold text-slate-700">Filter Unit Kerja</span>
                      {selectedUnits.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedUnits([])}
                          className="text-[11px] font-semibold text-[#5D87FF] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 pt-2">
                      {unitOptions.map((unit) => (
                        <label key={unit} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-[#ECF2FF]/60">
                          <input
                            type="checkbox"
                            checked={selectedUnits.includes(unit)}
                            onChange={() => toggleUnitFilter(unit)}
                            className="h-4 w-4 rounded border-slate-300 accent-[#5D87FF]"
                          />
                          <span>{unit}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Filter: Status */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenFilter(openFilter === 'status' ? null : 'status');
                    setIsUnitFilterOpen(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    selectedStatuses.length > 0
                      ? 'border-[#5D87FF]/40 bg-[#ECF2FF] text-[#5D87FF]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                  aria-expanded={openFilter === 'status'}
                >
                  <span>
                    {selectedStatuses.length === 0 ? 'Status' : `${selectedStatuses.length} Status`}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${openFilter === 'status' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'status' && (
                  <div
                    className="absolute right-0 top-full z-40 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl"
                    onMouseLeave={() => setOpenFilter(null)}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2">
                      <span className="text-xs font-bold text-slate-700">Status</span>
                      {selectedStatuses.length > 0 && (
                        <button type="button" onClick={() => setSelectedStatuses([])} className="text-[11px] font-semibold text-[#5D87FF] hover:underline cursor-pointer">
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 pt-2">
                      {statusOptions.map((option) => (
                        <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-[#ECF2FF]/60">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(option.value)}
                            onChange={() => toggleFilterValue(setSelectedStatuses, option.value)}
                            className="h-4 w-4 rounded border-slate-300 accent-[#5D87FF]"
                          />
                          <span className="truncate">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Filter Lanjutan */}
              <button
                type="button"
                onClick={() => setShowMoreFilters((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  showMoreFilters ||
                  selectedApplicants.length + selectedAssignees.length + selectedLocations.length + selectedSpecificLocations.length > 0
                    ? 'border-[#5D87FF]/40 bg-[#ECF2FF] text-[#5D87FF]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filter Lainnya</span>
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200/80 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {showMoreFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
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
            </div>
          )}
        </div>

        <div className="min-w-0">
          {activeTab === 'DAFTAR' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Surat Tugas</th>
                      <th className="px-5 py-3.5">Pelaksana</th>
                      <th className="px-5 py-3.5">Jadwal &amp; Lokasi</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
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
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4 align-top max-w-sm">
                            <p className="font-semibold text-slate-900 line-clamp-2 leading-snug">{item.perihal}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-mono font-semibold text-[#5D87FF]">{item.nomorSurat}</span>
                              <span aria-hidden="true">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${unitColor.bg} ${unitColor.text}`}>
                                {item.unitKerja}
                              </span>
                              <span aria-hidden="true">•</span>
                              <span className="text-[11px] font-medium text-slate-500">{getKategoriLabel(kategori)}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Pengaju: <span className="font-medium text-slate-700">{item.pengaju.nama}</span>
                            </p>
                            {item.filePerbaikanNama && (
                              <p className="mt-1 text-[11px] font-medium text-indigo-700 truncate">
                                File Perbaikan: {item.filePerbaikanNama}
                              </p>
                            )}
                            {item.alasanPenolakan && (
                              <p className="mt-1 text-[11px] font-semibold text-rose-700">
                                Alasan Ditolak: {item.alasanPenolakan}
                              </p>
                            )}
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
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#5D87FF]/25 bg-[#ECF2FF] px-2.5 py-1.5 text-xs font-bold text-[#5D87FF] transition-colors hover:bg-blue-100 cursor-pointer"
                                aria-label={`Lihat ${item.pegawaiDitugaskan.length} pegawai yang ditugaskan`}
                              >
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                {item.pegawaiDitugaskan.length} Pegawai
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4 align-top min-w-[210px]">
                            <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                              {formatRentangTanggal(item.tanggalMulai, item.tanggalSelesai)}
                            </p>
                            <p className="text-[11px] font-medium text-[#5D87FF] mt-0.5 whitespace-nowrap">
                              {formatJamRange(item.jamMulai, item.jamSelesai)}
                            </p>
                            <div className="flex items-start gap-1 text-slate-500 text-xs mt-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">
                                {item.lokasiSpesifik ? `${item.lokasiSpesifik} • ` : ''}
                                {formatLokasiKhusus(item.lokasiPenugasan)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1.5">
                              <AjuanStatusBadge status={item.status} />
                              {itemConflicts.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                  <AlertTriangle className="w-3 h-3 shrink-0" /> Bentrok Jadwal
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSuratToPrint(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#5D87FF]/25 bg-[#ECF2FF] px-2.5 py-1.5 text-xs font-semibold text-[#5D87FF] hover:bg-blue-100 transition-colors cursor-pointer"
                                title="Lihat & cetak surat tugas A4"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Lihat Surat
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAjuan(item);
                                  setIsModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Lihat detail penugasan"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Detail
                              </button>
                              {(item.filePerbaikanUrl || item.fileDraftUrl) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFileUrl(
                                      item.filePerbaikanUrl || item.fileDraftUrl,
                                      item.filePerbaikanNama || `${item.nomorSurat}.docx`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                  title="Unduh file surat"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Unduh
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAjuan.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                          Belum ada surat tugas yang diterima.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'WORKFLOW' && (
            <UserWorkflowTab
              filteredAjuan={filteredAjuan}
              selectedAjuan={selectedAjuan}
              onSelectAjuan={setSelectedAjuan}
            />
          )}
        </div>
      </div>

      <PegawaiDitugaskanModal ajuan={selectedPegawaiAjuan} onClose={() => setSelectedPegawaiAjuan(null)} />

      <WorkflowDetailModal
        ajuan={selectedAjuan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpenPrint={(item) => setSuratToPrint(item)}
      />

      <CetakSuratTugasModal
        surat={suratToPrint}
        isOpen={Boolean(suratToPrint)}
        onClose={() => setSuratToPrint(null)}
      />
    </div>
  );
};

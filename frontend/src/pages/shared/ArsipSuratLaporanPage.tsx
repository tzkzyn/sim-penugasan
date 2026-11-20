import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePenugasan } from '@/context/PenugasanContext';
import { UNIT_COLORS } from '@/data/dummyData';
import type { AjuanSuratTugas, Pegawai } from '@/types';
import { downloadFileUrl } from '@/utils/penugasanHelpers';
import { DashboardAjuanDetailModal } from '@/components/ui/DashboardAjuanDetailModal';
import { CetakSuratTugasModal } from '@/components/ui/CetakSuratTugasModal';
import { DocxPreviewViewer } from '@/components/ui/DocxPreviewViewer';
import {
  Archive,
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Folder,
  MapPin,
  Printer,
  Search,
  X,
} from 'lucide-react';

type ArsipTab = 'SURAT_TERBIT' | 'LAPORAN' | 'BELUM_LAPORAN';

const hasLaporan = (task: AjuanSuratTugas): boolean =>
  Boolean(task.fileLaporanUrl || task.fileLaporanNama || task.tanggalLaporan);

const isImagePreview = (url?: string, name?: string) => {
  const target = `${url || ''} ${name || ''}`.toLowerCase();
  return target.startsWith('data:image/') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(target);
};

const isPdfPreview = (url?: string, name?: string) => {
  const target = `${url || ''} ${name || ''}`.toLowerCase();
  return target.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(target);
};

const isDocxPreview = (url?: string, name?: string) => {
  const target = `${url || ''} ${name || ''}`.toLowerCase();
  return (
    target.includes('wordprocessingml.document') ||
    /\.docx(\?|$)/i.test(target)
  );
};

const normalizeInlinePdfUrl = (fileUrl: string): string => {
  if (fileUrl.startsWith('data:') && !fileUrl.startsWith('data:application/pdf')) {
    return fileUrl.replace(/^data:[^;]*;/i, 'data:application/pdf;');
  }
  return fileUrl;
};

const getPegawaiKey = (p: Pegawai): string => p.id || p.nip || p.nama;

interface PegawaiFolder {
  key: string;
  pegawai: Pegawai;
  tasks: AjuanSuratTugas[];
  suratCount: number;
  laporanCount: number;
  belumLaporanCount: number;
}

export const ArsipSuratLaporanPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isUserRole = user?.role === 'USER';
  const { tasks: allTasks, myTasks, pegawaiList } = usePenugasan();
  const tasks = isUserRole ? myTasks : allTasks;

  const initialTabParam = searchParams.get('tab');
  const [viewMode, setViewMode] = useState<'FOLDER' | 'SEMUA'>(
    initialTabParam === 'belum-laporan' ? 'SEMUA' : 'FOLDER',
  );
  const [selectedPegawaiKey, setSelectedPegawaiKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ArsipTab>(
    initialTabParam === 'belum-laporan' ? 'BELUM_LAPORAN' : 'SURAT_TERBIT',
  );
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAjuan, setSelectedAjuan] = useState<AjuanSuratTugas | null>(null);
  const [suratToPrint, setSuratToPrint] = useState<AjuanSuratTugas | null>(null);
  const [previewLaporan, setPreviewLaporan] = useState<AjuanSuratTugas | null>(null);

  const unitOptions = useMemo(() => {
    const units = new Set<string>(['RBI', 'Fastingkom', 'Kepeg', 'PM']);
    pegawaiList.forEach((p) => {
      if (p.unitKerja?.trim()) units.add(p.unitKerja.trim());
    });
    tasks.forEach((t) => {
      if (t.unitKerja?.trim()) units.add(t.unitKerja.trim());
    });
    return Array.from(units).sort((a, b) => a.localeCompare(b, 'id'));
  }, [pegawaiList, tasks]);

  const pegawaiFolders = useMemo<PegawaiFolder[]>(() => {
    const map = new Map<string, PegawaiFolder>();
    tasks.forEach((t) => {
      const involved = t.pegawaiDitugaskan.length > 0 ? t.pegawaiDitugaskan : [t.pengaju];
      const seenInTask = new Set<string>();
      involved.forEach((p) => {
        const key = getPegawaiKey(p);
        if (seenInTask.has(key)) return;
        seenInTask.add(key);
        const existing = map.get(key);
        const isBelumLaporan = t.status === 'SURAT_TERBIT' && !hasLaporan(t);
        if (existing) {
          existing.tasks.push(t);
          if (t.status === 'SURAT_TERBIT') existing.suratCount += 1;
          if (hasLaporan(t)) existing.laporanCount += 1;
          if (isBelumLaporan) existing.belumLaporanCount += 1;
        } else {
          map.set(key, {
            key,
            pegawai: p,
            tasks: [t],
            suratCount: t.status === 'SURAT_TERBIT' ? 1 : 0,
            laporanCount: hasLaporan(t) ? 1 : 0,
            belumLaporanCount: isBelumLaporan ? 1 : 0,
          });
        }
      });
    });

    let list = Array.from(map.values()).sort((a, b) =>
      a.pegawai.nama.localeCompare(b.pegawai.nama, 'id'),
    );

    if (selectedUnit !== 'ALL') {
      list = list.filter((f) =>
        f.pegawai.unitKerja
          ? f.pegawai.unitKerja === selectedUnit
          : f.tasks.some((t) => t.unitKerja === selectedUnit),
      );
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.pegawai.nama.toLowerCase().includes(q) ||
        (f.pegawai.nip || '').toLowerCase().includes(q) ||
        (f.pegawai.unitKerja || '').toLowerCase().includes(q) ||
        f.tasks.some(
          (t) =>
            t.perihal.toLowerCase().includes(q) ||
            t.nomorSurat.toLowerCase().includes(q),
        ),
    );
  }, [tasks, selectedUnit, searchQuery]);

  const activeFolder = useMemo(
    () =>
      selectedPegawaiKey
        ? pegawaiFolders.find((f) => f.key === selectedPegawaiKey) || null
        : null,
    [pegawaiFolders, selectedPegawaiKey],
  );

  const scopedTasks = useMemo(() => {
    if (!isUserRole && viewMode === 'FOLDER' && activeFolder) {
      return activeFolder.tasks;
    }
    if (selectedUnit !== 'ALL') {
      return tasks.filter((t) => t.unitKerja === selectedUnit);
    }
    return tasks;
  }, [isUserRole, viewMode, activeFolder, tasks, selectedUnit]);

  const stats = useMemo(() => {
    const total = scopedTasks.length;
    const suratTerbit = scopedTasks.filter((t) => t.status === 'SURAT_TERBIT').length;
    const adaLaporan = scopedTasks.filter(hasLaporan).length;
    const belumLaporan = scopedTasks.filter((t) => t.status === 'SURAT_TERBIT' && !hasLaporan(t)).length;
    return { total, suratTerbit, adaLaporan, belumLaporan };
  }, [scopedTasks]);

  const filteredTasks = useMemo(() => {
    return scopedTasks.filter((t) => {
      if (activeTab === 'SURAT_TERBIT' && t.status !== 'SURAT_TERBIT') return false;
      if (activeTab === 'LAPORAN' && !hasLaporan(t)) return false;
      if (activeTab === 'BELUM_LAPORAN' && (t.status !== 'SURAT_TERBIT' || hasLaporan(t))) return false;
      if (selectedUnit !== 'ALL' && t.unitKerja !== selectedUnit) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pegawaiMatch = t.pegawaiDitugaskan.some((p) => p.nama.toLowerCase().includes(q));
        return (
          t.perihal.toLowerCase().includes(q) ||
          t.nomorSurat.toLowerCase().includes(q) ||
          t.pengaju.nama.toLowerCase().includes(q) ||
          (t.lokasiPenugasan || '').toLowerCase().includes(q) ||
          pegawaiMatch
        );
      }
      return true;
    });
  }, [scopedTasks, activeTab, selectedUnit, searchQuery]);

  const getStatusBadge = (status: AjuanSuratTugas['status']) => {
    if (status === 'SURAT_TERBIT') {
      return { label: 'Surat Terbit', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' };
    }
    if (status === 'DITOLAK') {
      return { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 border-rose-200/70' };
    }
    if (status === 'DRAFT') {
      return { label: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return { label: 'Diproses', cls: 'bg-amber-50 text-amber-700 border-amber-200/70' };
  };

  return (
    <div className="p-2 sm:p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
            <Archive className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Arsip Surat &amp; Laporan Penugasan</h1>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Total Penugasan
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{stats.total}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Seluruh surat tercatat</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Surat Resmi Terbit
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{stats.suratTerbit}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Disetujui pimpinan</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#5D87FF]" />
            Laporan Hasil Tugas
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{stats.adaLaporan}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Berkas laporan tersedia</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Menunggu Laporan
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1.5 block">{stats.belumLaporan}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Surat terbit belum dilapor</span>
        </div>
      </div>

      {/* Unified Toolbar + Folder/Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-100 p-5 space-y-4">
          {!isUserRole && viewMode === 'FOLDER' && activeFolder && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#5D87FF]/20 bg-[#ECF2FF]/50 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPegawaiKey(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Semua Folder
                </button>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-[#5D87FF]" />
                  <span className="text-sm font-bold text-slate-900">{activeFolder.pegawai.nama}</span>
                  {activeFolder.pegawai.unitKerja && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#5D87FF] border border-[#5D87FF]/20">
                      {activeFolder.pegawai.unitKerja}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-500">
                {activeFolder.suratCount} Surat • {activeFolder.laporanCount} Laporan
              </span>
            </div>
          )}

          {(!isUserRole && viewMode === 'FOLDER' && !activeFolder) ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#5D87FF]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Folder Arsip per Pegawai ({pegawaiFolders.length})
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Klik folder untuk melihat surat &amp; laporan pegawai
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100/80 p-1">
                {[
                  { key: 'SURAT_TERBIT' as ArsipTab, label: `Surat Penugasan (${stats.suratTerbit})` },
                  { key: 'LAPORAN' as ArsipTab, label: `Laporan Hasil (${stats.adaLaporan})` },
                  { key: 'BELUM_LAPORAN' as ArsipTab, label: `Belum Ada Laporan (${stats.belumLaporan})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      activeTab === tab.key
                        ? 'bg-white text-[#5D87FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Menampilkan {filteredTasks.length} data
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  !isUserRole && viewMode === 'FOLDER' && !activeFolder
                    ? 'Cari nama pegawai, NIP, atau nomor surat...'
                    : 'Cari nomor surat, perihal, nama pegawai, atau lokasi...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-[#5D87FF] focus:bg-white focus:ring-2 focus:ring-[#5D87FF]/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setSelectedPegawaiKey(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#5D87FF]"
              >
                <option value="ALL">Semua Unit</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              {!isUserRole && (
                <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('FOLDER')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      viewMode === 'FOLDER'
                        ? 'bg-white text-[#5D87FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Folder Pegawai
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('SEMUA');
                      setSelectedPegawaiKey(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      viewMode === 'SEMUA'
                        ? 'bg-white text-[#5D87FF] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isUserRole && viewMode === 'FOLDER' && !activeFolder ? (
          <div className="p-5">
            {pegawaiFolders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pegawaiFolders.map((folder) => {
                  const unitColor =
                    (folder.pegawai.unitKerja && UNIT_COLORS[folder.pegawai.unitKerja]) || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                    };
                  return (
                    <button
                      key={folder.key}
                      type="button"
                      onClick={() => setSelectedPegawaiKey(folder.key)}
                      className="group text-left rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-[#5D87FF] hover:bg-white hover:shadow-md transition-all cursor-pointer flex items-start gap-3.5"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0 group-hover:bg-[#5D87FF] group-hover:text-white transition-colors">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {folder.pegawai.nama}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {folder.pegawai.unitKerja && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${unitColor.bg} ${unitColor.text}`}>
                              {folder.pegawai.unitKerja}
                            </span>
                          )}
                          {folder.pegawai.nip && folder.pegawai.nip !== '-' && (
                            <span className="text-[11px] font-mono text-slate-400">
                              {folder.pegawai.nip}
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 text-xs font-semibold text-slate-600 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="text-[#5D87FF]">{folder.suratCount} Surat</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-600">{folder.laporanCount} Laporan</span>
                          {folder.belumLaporanCount > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-amber-600">{folder.belumLaporanCount} Belum Lapor</span>
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Folder className="mx-auto h-9 w-9 text-slate-300 mb-2" />
                <p className="font-semibold text-sm">Belum ada folder pegawai yang sesuai</p>
                <p className="text-xs text-slate-400 mt-1">Ubah filter unit atau kata kunci pencarian.</p>
              </div>
            )}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Surat &amp; Perihal</th>
                <th className="px-6 py-3.5">Pegawai Bertugas</th>
                {activeTab === 'SURAT_TERBIT' ? (
                  <th className="px-6 py-3.5">Status Surat</th>
                ) : activeTab === 'BELUM_LAPORAN' ? (
                  <th className="px-6 py-3.5">Status Laporan</th>
                ) : (
                  <th className="px-6 py-3.5">Berkas Laporan</th>
                )}
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const unitColor = UNIT_COLORS[t.unitKerja] || { bg: 'bg-slate-100', text: 'text-slate-800' };
                const badge = getStatusBadge(t.status);
                const pegawaiNames = t.pegawaiDitugaskan.map((p) => p.nama);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 max-w-sm">
                      <p className="font-semibold text-slate-900 line-clamp-1">{t.perihal}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-[#5D87FF] whitespace-nowrap">{t.nomorSurat}</span>
                        <span aria-hidden="true">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${unitColor.bg} ${unitColor.text}`}>
                          {t.unitKerja}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span className="whitespace-nowrap">
                          {t.tanggalMulai}
                          {t.tanggalSelesai && t.tanggalSelesai !== t.tanggalMulai ? ` s/d ${t.tanggalSelesai}` : ''}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                        <span className="line-clamp-1">{t.lokasiPenugasan}</span>
                      </p>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-700">
                      {pegawaiNames.length === 0 ? (
                        <span className="text-slate-400">-</span>
                      ) : pegawaiNames.length <= 2 ? (
                        <span>{pegawaiNames.join(', ')}</span>
                      ) : (
                        <span>
                          {pegawaiNames[0]} <strong className="text-[#5D87FF]">+{pegawaiNames.length - 1} lainnya</strong>
                        </span>
                      )}
                    </td>

                    {activeTab === 'SURAT_TERBIT' ? (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    ) : activeTab === 'BELUM_LAPORAN' ? (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200/70">
                          Menunggu Laporan
                        </span>
                      </td>
                    ) : (
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 max-w-xs">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={t.fileLaporanNama || 'Berkas Laporan'}>
                            {t.fileLaporanNama || 'Laporan Tanpa Lampiran File'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Diunggah: {t.tanggalLaporan || '-'}
                          </p>
                          {t.catatanLaporan && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">{t.catatanLaporan}</p>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAjuan(t)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          title="Lihat detail penugasan"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detail
                        </button>

                        {activeTab !== 'LAPORAN' && t.status === 'SURAT_TERBIT' && (
                          <button
                            type="button"
                            onClick={() => setSuratToPrint(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#5D87FF]/25 bg-[#ECF2FF] px-2.5 py-1.5 text-xs font-semibold text-[#5D87FF] hover:bg-blue-100 transition cursor-pointer"
                            title="Lihat / cetak surat tugas"
                          >
                            <Printer className="h-3.5 w-3.5" /> {activeTab === 'SURAT_TERBIT' ? 'Buka Surat' : 'Surat'}
                          </button>
                        )}

                        {activeTab === 'SURAT_TERBIT' && (t.filePerbaikanUrl || t.fileDraftUrl) && (
                          <button
                            type="button"
                            onClick={() =>
                              downloadFileUrl(
                                t.filePerbaikanUrl || t.fileDraftUrl,
                                t.filePerbaikanNama || t.fileDraftNama || `${t.nomorSurat}.docx`,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            title="Unduh file surat"
                          >
                            <Download className="h-3.5 w-3.5" /> Unduh
                          </button>
                        )}

                        {activeTab !== 'SURAT_TERBIT' && hasLaporan(t) && (
                          <button
                            type="button"
                            onClick={() => setPreviewLaporan(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            title="Lihat pratinjau laporan hasil tugas"
                          >
                            <Eye className="h-3.5 w-3.5" /> {activeTab === 'LAPORAN' ? 'Lihat Laporan' : 'Laporan'}
                          </button>
                        )}

                        {activeTab === 'LAPORAN' && t.fileLaporanUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              downloadFileUrl(
                                t.fileLaporanUrl,
                                t.fileLaporanNama || `Laporan_${t.nomorSurat.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            title="Unduh file laporan"
                          >
                            <Download className="h-3.5 w-3.5" /> Unduh
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">Belum ada arsip yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-1">Ubah filter atau kata kunci pencarian untuk melihat data lain.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <DashboardAjuanDetailModal
        isOpen={Boolean(selectedAjuan)}
        ajuan={selectedAjuan}
        onClose={() => setSelectedAjuan(null)}
        formatLokasiDisplay={(lokasi) => lokasi}
      />

      <CetakSuratTugasModal
        isOpen={Boolean(suratToPrint)}
        surat={suratToPrint}
        onClose={() => setSuratToPrint(null)}
      />

      {previewLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Pratinjau Laporan Hasil Tugas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {previewLaporan.nomorSurat} • {previewLaporan.perihal}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLaporan(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer shrink-0"
                aria-label="Tutup pratinjau"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {previewLaporan.catatanLaporan && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-1">Catatan Laporan:</span>
                  <p className="whitespace-pre-wrap">{previewLaporan.catatanLaporan}</p>
                </div>
              )}

              {previewLaporan.fileLaporanUrl ? (
                isImagePreview(previewLaporan.fileLaporanUrl, previewLaporan.fileLaporanNama) ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex justify-center">
                    <img
                      src={previewLaporan.fileLaporanUrl}
                      alt={previewLaporan.fileLaporanNama || 'Pratinjau Laporan'}
                      className="max-h-[60vh] rounded-lg object-contain"
                    />
                  </div>
                ) : isPdfPreview(previewLaporan.fileLaporanUrl, previewLaporan.fileLaporanNama) ? (
                  <iframe
                    src={normalizeInlinePdfUrl(previewLaporan.fileLaporanUrl)}
                    title={previewLaporan.fileLaporanNama || 'Pratinjau Laporan PDF'}
                    className="w-full h-[60vh] rounded-xl border border-slate-200 bg-slate-50"
                  />
                ) : isDocxPreview(previewLaporan.fileLaporanUrl, previewLaporan.fileLaporanNama) ? (
                  <DocxPreviewViewer
                    fileUrl={previewLaporan.fileLaporanUrl}
                    fileName={previewLaporan.fileLaporanNama}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
                    <FileText className="mx-auto h-10 w-10 text-[#5D87FF]" />
                    <p className="text-sm font-semibold text-slate-800">
                      {previewLaporan.fileLaporanNama || 'Berkas Laporan'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Format berkas ini tidak mendukung pratinjau langsung di browser. Klik <strong>Unduh Berkas</strong> untuk membukanya.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center space-y-1.5">
                  <FileText className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada lampiran berkas</p>
                  <p className="text-xs text-slate-400">
                    Laporan tercatat pada {previewLaporan.tanggalLaporan || '-'}, tanpa file lampiran.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3.5 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setPreviewLaporan(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              {previewLaporan.fileLaporanUrl && (
                <button
                  type="button"
                  onClick={() =>
                    downloadFileUrl(
                      previewLaporan.fileLaporanUrl!,
                      previewLaporan.fileLaporanNama ||
                        `Laporan_${previewLaporan.nomorSurat.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5D87FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4A75F2] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Berkas
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


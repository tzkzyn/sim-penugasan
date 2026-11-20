import { useState } from 'react';
import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  Pegawai,
  UnitKerjaType,
} from '@/types';
import {
  detectScheduleConflicts,
  getPegawaiDinasStats,
} from '@/utils/penugasanHelpers';
import { A4WordEditorCanvas } from '@/components/ui/CetakSuratTugasModal';
import { ChevronDown, FileEdit, FileText, Search } from 'lucide-react';

interface AdminPegawaiPickerDropdownProps {
  pegawaiList: Pegawai[];
  selectedIds: string[];
  allTasks: AjuanSuratTugas[];
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai: string;
  jamSelesai: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onSelectAll: () => void;
  onReset: () => void;
  onTogglePegawai: (id: string) => void;
}

const formatShortRangeDate = (isoDate: string): string => {
  if (!isoDate) return '-';
  try {
    return new Date(isoDate).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return isoDate.slice(0, 10);
  }
};

const isSamePegawaiOption = (a: Pegawai, b: Pegawai): boolean => {
  if (a.id && b.id && a.id === b.id) return true;
  if (a.nip && b.nip && a.nip.trim() === b.nip.trim()) return true;
  return a.nama.trim().toLowerCase() === b.nama.trim().toLowerCase();
};

export function AdminPegawaiPickerDropdown({
  pegawaiList,
  selectedIds,
  allTasks,
  tanggalMulai,
  tanggalSelesai,
  jamMulai,
  jamSelesai,
  isOpen,
  onToggleOpen,
  onClose,
  onSelectAll,
  onReset,
  onTogglePegawai,
}: AdminPegawaiPickerDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const q = searchTerm.trim().toLowerCase();
  const visiblePegawai = q
    ? pegawaiList.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          (p.nip || '').toLowerCase().includes(q) ||
          (p.unitKerja || '').toLowerCase().includes(q),
      )
    : pegawaiList;

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-700 mb-1">Pegawai Ditugaskan</label>
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 px-3 py-2 text-sm text-slate-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
      >
        <span className="truncate">
          {selectedIds.length === 0
            ? 'Pilih Pegawai'
            : selectedIds.length === 1
              ? pegawaiList.find((p) => p.id === selectedIds[0])?.nama || '1 Pegawai Dipilih'
              : `${selectedIds.length} Pegawai Dipilih`}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute right-0 left-0 sm:left-auto sm:min-w-[360px] z-50 mt-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2 text-xs">
              <span className="font-bold text-slate-700">
                Pilih Pegawai ({selectedIds.length} / {pegawaiList.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Pilih Semua
                </button>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <div className="relative mt-2 mb-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, NIP, atau unit..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 pt-1">
              {visiblePegawai.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const pStats = getPegawaiDinasStats(
                  p,
                  allTasks,
                  tanggalMulai || undefined,
                );
                const pConflicts = detectScheduleConflicts(
                  {
                    tanggalMulai,
                    tanggalSelesai: tanggalSelesai || tanggalMulai,
                    jamMulai,
                    jamSelesai,
                    pegawaiDitugaskan: [p],
                  },
                  allTasks,
                );
                const hasConflict = pConflicts.length > 0;
                const todayIso = new Date().toISOString().slice(0, 10);
                const scheduledTasks = allTasks
                  .filter(
                    (t) =>
                      t.status !== 'DITOLAK' &&
                      (t.tanggalSelesai || t.tanggalMulai).slice(0, 10) >= todayIso &&
                      (t.pegawaiDitugaskan || []).some((assigned) =>
                        isSamePegawaiOption(assigned, p),
                      ),
                  )
                  .sort((a, b) => a.tanggalMulai.localeCompare(b.tanggalMulai));
                const nextScheduled = scheduledTasks[0];
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-xs transition-colors ${
                      hasConflict
                        ? 'bg-rose-50 border border-rose-200 text-rose-900'
                        : isSelected
                          ? 'bg-blue-50/70 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onTogglePegawai(p.id)}
                        className="h-4 w-4 mt-0.5 shrink-0 rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.nama}</p>
                        <p className="text-[10px] text-slate-500">
                          Dinas: {pStats.totalDinas}x (Mgg: {pStats.dinasMingguIni}x &bull; Bln: {pStats.dinasBulanIni}x)
                        </p>
                        {hasConflict ? (
                          <p className="text-[10px] font-bold text-rose-700">
                            Bentrok dgn {pConflicts[0].conflictingTask.nomorSurat}
                          </p>
                        ) : nextScheduled ? (
                          <p className="text-[10px] font-semibold text-amber-700">
                            Terjadwal {scheduledTasks.length} tugas (terdekat: {formatShortRangeDate(nextScheduled.tanggalMulai)}
                            {nextScheduled.tanggalSelesai && nextScheduled.tanggalSelesai !== nextScheduled.tanggalMulai
                              ? `–${formatShortRangeDate(nextScheduled.tanggalSelesai)}`
                              : ''}
                            )
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {p.unitKerja}
                    </span>
                  </label>
                );
              })}
              {visiblePegawai.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">
                  Tidak ada pegawai yang cocok dengan pencarian.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface AdminBuatTugasPreviewColumnProps {
  docMode: 'editor' | 'upload';
  file: File | null;
  nomorSurat: string;
  perihal: string;
  unitKerja: UnitKerjaType;
  kategoriTemplate: KategoriTemplateSurat;
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai: string;
  jamSelesai: string;
  previewLokasi: string;
  lokasiSpesifik: string;
  deskripsi: string;
  dasarSuratDari?: string;
  dasarSuratNomor?: string;
  dasarSuratTanggal?: string;
  sumberBiaya?: 'PENYELENGGARA' | 'DIPA' | 'LAINNYA';
  currentAdmin: Pegawai;
  previewAssignedPegawai: Pegawai[];
  fallbackPegawai?: Pegawai;
  ttdUserPng: string;
  ttdUserSignerName: string;
  ttdUserSignedAt: string;
  onChangeHtml: (html: string) => void;
  onSwitchToEditor: () => void;
}

export function AdminBuatTugasPreviewColumn({
  docMode,
  file,
  nomorSurat,
  perihal,
  unitKerja,
  kategoriTemplate,
  tanggalMulai,
  tanggalSelesai,
  jamMulai,
  jamSelesai,
  previewLokasi,
  lokasiSpesifik,
  deskripsi,
  dasarSuratDari,
  dasarSuratNomor,
  dasarSuratTanggal,
  sumberBiaya,
  currentAdmin,
  previewAssignedPegawai,
  fallbackPegawai,
  ttdUserPng,
  ttdUserSignerName,
  ttdUserSignedAt,
  onChangeHtml,
  onSwitchToEditor,
}: AdminBuatTugasPreviewColumnProps) {
  return (
    <div className="lg:col-span-7 print:col-span-12">
      <div className={docMode === 'editor' ? 'block' : 'hidden'}>
        <A4WordEditorCanvas
          data={{
            id: 'ADMIN-DRAFT-NEW',
            nomorSurat,
            perihal,
            unitKerja,
            kategoriTemplate,
            tanggalMulai,
            tanggalSelesai,
            jamMulai,
            jamSelesai,
            lokasiPenugasan: previewLokasi,
            lokasiSpesifik,
            deskripsi,
            dasarSuratDari: dasarSuratDari || undefined,
            dasarSuratNomor: dasarSuratNomor || undefined,
            dasarSuratTanggal: dasarSuratTanggal || undefined,
            sumberBiaya: sumberBiaya || 'PENYELENGGARA',
            pengaju: currentAdmin,
            pegawaiDitugaskan:
              previewAssignedPegawai.length > 0
                ? previewAssignedPegawai
                : fallbackPegawai
                  ? [fallbackPegawai]
                  : [],
            ttdUserPng: ttdUserPng || undefined,
            ttdUserSignerName: ttdUserSignerName || undefined,
            ttdUserSignedAt: ttdUserSignedAt || undefined,
          }}
          autoSyncFromData={true}
          defaultSignatureRole="user"
          maxHeightClass="max-h-[75vh]"
          showSyncButton={true}
          onChangeHtml={onChangeHtml}
        />
      </div>
      {docMode !== 'editor' && (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <FileText className="h-12 w-12 text-slate-400 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Mode Unggah Berkas Eksternal</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {file
              ? `Berkas siap dikirim: ${file.name}`
              : 'Pilih berkas PDF/Word/Excel di kolom formulir sebelah kiri, atau beralih ke Editor Kertas A4 untuk mengetik surat langsung di web.'}
          </p>
          <button
            type="button"
            onClick={onSwitchToEditor}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" /> Gunakan Editor Kertas A4
          </button>
        </div>
      )}
    </div>
  );
}


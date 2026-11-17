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
import { ChevronDown, FileEdit, FileText } from 'lucide-react';

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
          <div className="absolute right-0 left-0 sm:left-auto sm:min-w-[340px] z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2 text-xs">
              <span className="font-bold text-slate-700">Pilih Pegawai ({selectedIds.length})</span>
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
            <div className="space-y-1 pt-2">
              {pegawaiList.map((p) => {
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
                        {hasConflict && (
                          <p className="text-[10px] font-bold text-rose-700">
                            Bentrok dgn {pConflicts[0].conflictingTask.nomorSurat}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
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


import type {
  KategoriTemplateSurat,
  Pegawai,
  TemplateSuratResmi,
  UnitKerjaType,
} from '@/types';
import { A4WordEditorCanvas } from '@/components/ui/CetakSuratTugasModal';
import { FileEdit, FileText } from 'lucide-react';

interface UserDraftAjuanPreviewProps {
  editingTaskId: string | null;
  nextDraftNumber: number;
  docMode: 'editor' | 'upload';
  file: File | null;
  existingFilePerbaikanNama: string;
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
  dasarSuratDari: string;
  dasarSuratNomor: string;
  dasarSuratTanggal: string;
  sumberBiaya: 'PENYELENGGARA' | 'DIPA' | 'LAINNYA';
  currentPegawai: Pegawai;
  previewAssignedPegawai: Pegawai[];
  ttdUserPng: string;
  ttdUserSignerName: string;
  ttdUserSignedAt: string;
  dokumenDraftText: string;
  selectedApprovalTemplate?: TemplateSuratResmi | null;
  onChangeHtml: (html: string) => void;
  onSignatureChange: (sig: { png: string; name?: string; signedAt: Date }) => void;
  onSwitchToEditor: () => void;
}

export function UserDraftAjuanPreview({
  editingTaskId,
  nextDraftNumber,
  docMode,
  file,
  existingFilePerbaikanNama,
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
  currentPegawai,
  previewAssignedPegawai,
  ttdUserPng,
  ttdUserSignerName,
  ttdUserSignedAt,
  dokumenDraftText,
  selectedApprovalTemplate,
  onChangeHtml,
  onSignatureChange,
  onSwitchToEditor,
}: UserDraftAjuanPreviewProps) {
  return (
    <div className="lg:col-span-7 lg:h-full min-h-0 lg:overflow-y-auto lg:pr-1 flex flex-col print:col-span-12 print:h-auto print:overflow-visible">
      <div className={docMode === 'editor' ? 'block' : 'hidden'}>
        <A4WordEditorCanvas
          key={editingTaskId || 'DRAFT-NEW'}
          data={{
            id: editingTaskId || `DRAFT-NEW-${nextDraftNumber}`,
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
            dasarSuratDari,
            dasarSuratNomor,
            dasarSuratTanggal,
            sumberBiaya,
            namaKepala: 'Baharudin',
            pengaju: currentPegawai,
            pegawaiDitugaskan: previewAssignedPegawai,
            ttdUserPng: ttdUserPng || undefined,
            ttdUserSignerName: ttdUserSignerName || undefined,
            ttdUserSignedAt: ttdUserSignedAt || undefined,
          }}
          initialHtml={editingTaskId ? dokumenDraftText : undefined}
          customTemplate={selectedApprovalTemplate}
          autoSyncFromData={true}
          defaultSignatureRole="user"
          maxHeightClass="max-h-[62vh] lg:max-h-[calc(94vh-285px)]"
          showSyncButton={true}
          onChangeHtml={onChangeHtml}
          onSignatureChange={onSignatureChange}
        />
      </div>
      {docMode !== 'editor' && (
        <div className="flex flex-1 min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-[#EEF3FB] text-[#1D4ED8] flex items-center justify-center mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Mode Unggah Berkas Aktif</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {file
              ? `Berkas siap dikirim: ${file.name}`
              : existingFilePerbaikanNama
                ? `Berkas perbaikan saat ini: ${existingFilePerbaikanNama}`
                : 'Pilih file Word (.doc/.docx) atau PDF di panel kiri, atau kembali ke Editor Kertas A4.'}
          </p>
          <button
            type="button"
            onClick={onSwitchToEditor}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF] transition cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" /> Gunakan Editor Kertas A4
          </button>
        </div>
      )}
    </div>
  );
}


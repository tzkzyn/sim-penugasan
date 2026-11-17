import type { AjuanSuratTugas, WorkflowStep } from '@/types';
import {
  readFileAsDataUrl,
  validateDocumentFile,
  type ScheduleConflict,
} from '@/utils/penugasanHelpers';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  X,
  XCircle,
} from 'lucide-react';

interface ApprovalConfirmModalProps {
  confirmApproveId: string | null;
  confirmTargetTask?: AjuanSuratTugas;
  confirmTargetConflicts: ScheduleConflict[];
  onClose: () => void;
  onOpenA4: (task: AjuanSuratTugas) => void;
  onRejectBentrok: (task: AjuanSuratTugas, conflicts: ScheduleConflict[]) => void;
  onApproveDirect: (id: string) => void;
  onUploadFixAndApprove: (id: string, updates: Partial<AjuanSuratTugas>, fileName: string) => Promise<void>;
  onActionMessage: (msg: string) => void;
}

export function ApprovalConfirmModal({
  confirmApproveId,
  confirmTargetTask,
  confirmTargetConflicts,
  onClose,
  onOpenA4,
  onRejectBentrok,
  onApproveDirect,
  onUploadFixAndApprove,
  onActionMessage,
}: ApprovalConfirmModalProps) {
  if (!confirmApproveId) return null;

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = async () => {
      const selectedFile = input.files?.[0];
      if (!selectedFile || !confirmApproveId) return;
      const err = validateDocumentFile(selectedFile);
      if (err) {
        onActionMessage(err);
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(selectedFile);
        const updatedWorkflow: WorkflowStep[] = (confirmTargetTask?.workflow || []).map((w) => ({
          ...w,
          status: 'COMPLETED',
          tanggal:
            w.tanggal ||
            new Date().toISOString().replace('T', ' ').substring(0, 16),
        }));
        await onUploadFixAndApprove(
          confirmApproveId,
          {
            filePerbaikanUrl: dataUrl,
            filePerbaikanNama: selectedFile.name,
            status: 'SURAT_TERBIT',
            workflow: updatedWorkflow,
          },
          selectedFile.name,
        );
        onClose();
      } catch (e) {
        onActionMessage(e instanceof Error ? e.message : 'Gagal membaca file surat.');
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Konfirmasi Persetujuan
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmTargetConflicts.length > 0 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2 text-xs text-rose-800">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Bentrok Tanggal &amp; Jam Terdeteksi — Wajib Ditolak &amp; Ganti Orang
            </p>
            <p>
              Personil berikut memiliki jadwal lain yang bersamaan ({confirmTargetConflicts.map((c) => c.pegawai.nama).join(', ')}). Surat ini harus ditolak agar pengaju mengganti personil.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Anda dapat membuka naskah dalam bentuk Kertas A4 untuk merevisi teks atau nomor surat langsung sebelum menyetujuinya, mengunggah file Word/PDF hasil perbaikan, atau langsung menyetujui tugas ini.
          </p>
        )}

        <div className="flex flex-col gap-2.5 pt-2">
          {confirmTargetTask && confirmTargetConflicts.length > 0 ? (
            <button
              type="button"
              onClick={() => onRejectBentrok(confirmTargetTask, confirmTargetConflicts)}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Tolak Ajuan (Bentrok - Harus Ganti Orang)
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (confirmTargetTask) {
                    onOpenA4(confirmTargetTask);
                  }
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Buka &amp; Revisi di Kertas A4 (Edit Langsung di Web)
              </button>

              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition-colors border border-blue-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload Surat Fix / Perbaikan Eksternal (Word/PDF)
              </button>

              <button
                type="button"
                onClick={() => {
                  onApproveDirect(confirmApproveId);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Tidak Ada Perubahan, Langsung Setujui
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


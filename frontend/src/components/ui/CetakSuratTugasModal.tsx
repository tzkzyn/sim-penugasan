import React, { useRef, useState } from 'react';
import type {
  AjuanSuratTugas,
  WorkflowStep,
} from '@/types';
import { usePenugasan } from '@/context/PenugasanContext';
import { useAuth } from '@/hooks/useAuth';
import { A4WordEditorCanvas } from '@/components/ui/A4WordEditorCanvas';
import {
  downloadFileUrl,
  readFileAsDataUrl,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import {
  enforceSignatureIntegrityHtml,
  extractSignaturesFromHtml,
  type A4DocumentData,
  type SignatureRole,
} from '@/utils/suratHtmlHelpers';
import {
  X,
  FileDown,
  Save,
  CheckCircle2,
  FileText,
  Upload,
  Send,
} from 'lucide-react';

export { A4WordEditorCanvas };
export type { A4DocumentData, SignatureRole };

interface CetakSuratTugasModalProps {
  surat: AjuanSuratTugas | null;
  isOpen: boolean;
  onClose: () => void;
  showApprovalActions?: boolean;
}

interface CetakSuratTugasModalContentProps {
  currentSurat: AjuanSuratTugas;
  onClose: () => void;
  showApprovalActions: boolean;
}

const CetakSuratTugasModalContent: React.FC<CetakSuratTugasModalContentProps> = ({
  currentSurat,
  onClose,
  showApprovalActions,
}) => {
  const { updateTask } = usePenugasan();
  const { user } = useAuth();
  const canvasEditorRef = useRef<HTMLDivElement>(null);
  const uploadPerbaikanInputRef = useRef<HTMLInputElement>(null);
  const [draftHtml, setDraftHtml] = useState(() => currentSurat.dokumenDraftText || '');
  const [editedNomorSurat, setEditedNomorSurat] = useState(() => currentSurat.nomorSurat);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  const modalAllowedRole: SignatureRole =
    showApprovalActions || user?.role?.toUpperCase() === 'APPROVAL' ? 'approval' : 'user';

  const modalExtracted = extractSignaturesFromHtml(currentSurat.dokumenDraftText);
  const authoritativeData: A4DocumentData = {
    id: currentSurat.id,
    nomorSurat: editedNomorSurat || currentSurat.nomorSurat,
    perihal: currentSurat.perihal,
    unitKerja: currentSurat.unitKerja,
    kategoriTemplate: currentSurat.kategoriTemplate,
    tanggalMulai: currentSurat.tanggalMulai,
    tanggalSelesai: currentSurat.tanggalSelesai,
    jamMulai: currentSurat.jamMulai,
    jamSelesai: currentSurat.jamSelesai,
    lokasiPenugasan: currentSurat.lokasiPenugasan,
    lokasiSpesifik: currentSurat.lokasiSpesifik,
    deskripsi: currentSurat.deskripsi,
    dasarSuratDari: currentSurat.dasarSuratDari,
    dasarSuratNomor: currentSurat.dasarSuratNomor,
    dasarSuratTanggal: currentSurat.dasarSuratTanggal,
    sumberBiaya: currentSurat.sumberBiaya,
    namaKepala: currentSurat.namaKepala || 'Baharudin',
    pengaju: currentSurat.pengaju,
    pegawaiDitugaskan: currentSurat.pegawaiDitugaskan,
    ttdDigitalPng: currentSurat.ttdDigitalPng,
    ttdSignerName: currentSurat.ttdSignerName,
    ttdSignedAt: currentSurat.ttdSignedAt,
    ttdUserPng: currentSurat.ttdUserPng ?? modalExtracted.userPng,
    ttdUserSignerName: currentSurat.ttdUserSignerName,
    ttdUserSignedAt: currentSurat.ttdUserSignedAt ?? modalExtracted.userSignedAt,
    ttdApprovalPng: currentSurat.ttdApprovalPng ?? modalExtracted.approvalPng,
    ttdApprovalSignerName: currentSurat.ttdApprovalSignerName,
    ttdApprovalSignedAt: currentSurat.ttdApprovalSignedAt ?? modalExtracted.approvalSignedAt,
  };

  const getLatestHtml = (): string => {
    const raw = canvasEditorRef.current ? canvasEditorRef.current.innerHTML : draftHtml;
    return enforceSignatureIntegrityHtml(raw, authoritativeData, modalAllowedRole);
  };

  const handleNomorSuratChange = (nextNomor: string) => {
    setEditedNomorSurat(nextNomor);
    const nomorEl = canvasEditorRef.current?.querySelector('#a4-doc-nomor-surat');
    if (nomorEl) {
      nomorEl.textContent = `Nomor: ${nextNomor}`;
    }
  };

  const handleUploadPerbaikan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = '';
    if (!selectedFile) return;

    const validationError = validateDocumentFile(selectedFile);
    if (validationError) {
      setFeedback({ type: 'warning', text: validationError });
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      await updateTask(currentSurat.id, {
        filePerbaikanUrl: dataUrl,
        filePerbaikanNama: selectedFile.name,
      });
      setFeedback({
        type: 'success',
        text: `File perbaikan "${selectedFile.name}" berhasil diunggah dan tersimpan ke database!`,
      });
    } catch (err) {
      setFeedback({
        type: 'warning',
        text: err instanceof Error ? err.message : 'Gagal membaca file perbaikan.',
      });
    }
  };

  const handleSaveChanges = async () => {
    const cleanHtml = getLatestHtml();
    const finalNomor = editedNomorSurat.trim() || currentSurat.nomorSurat;
    await updateTask(currentSurat.id, {
      nomorSurat: finalNomor,
      dokumenDraftText: cleanHtml,
    });
    setFeedback({
      type: 'success',
      text: 'Perubahan nomor surat & naskah pada kertas A4 berhasil disimpan ke sistem!',
    });
  };

  const handleSaveAndResend = async () => {
    const cleanHtml = getLatestHtml();
    const finalNomor = editedNomorSurat.trim() || currentSurat.nomorSurat;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const nextWorkflow: WorkflowStep[] = [
      ...(currentSurat.workflow || []),
      {
        stage: 'DRAFT',
        label: 'Revisi & Kirim Ulang Surat Tugas',
        actor: user?.nama || currentSurat.pengaju?.nama || 'Pegawai',
        tanggal: timestamp,
        status: 'COMPLETED',
        catatan: `Surat diperbarui (Nomor: ${finalNomor}) dan dikirim ulang untuk persetujuan.`,
      },
    ];

    await updateTask(currentSurat.id, {
      nomorSurat: finalNomor,
      dokumenDraftText: cleanHtml,
      alasanPenolakan: undefined,
      status: 'DRAFT',
      workflow: nextWorkflow,
    });
    setFeedback({
      type: 'success',
      text: `Surat Tugas (${finalNomor}) berhasil disimpan dan dikirim kembali ke antrian persetujuan!`,
    });
  };

  const handleSaveAndApprove = async () => {
    const cleanHtml = getLatestHtml();

    const updatedWorkflow: WorkflowStep[] = (currentSurat.workflow || []).map((w) => ({
      ...w,
      status: 'COMPLETED',
      tanggal: w.tanggal || new Date().toISOString().replace('T', ' ').substring(0, 16),
    }));

    await updateTask(currentSurat.id, {
      dokumenDraftText: cleanHtml,
      status: 'SURAT_TERBIT',
      workflow: updatedWorkflow,
    });
    setFeedback({
      type: 'success',
      text: 'Naskah kertas A4 disimpan & Surat Tugas resmi disetujui (SURAT TERBIT)! Siap dicetak.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs print:static print:bg-white print:p-0 print:block">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:m-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        {/* Modal Top Bar */}
        <div className="no-print shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ECF2FF] text-[#5D87FF] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Editor &amp; Cetak Surat Perintah Tugas
              </h3>
              <p className="text-xs text-slate-500">
                Nomor: <span className="font-mono font-semibold text-slate-700">{currentSurat.nomorSurat}</span> &bull; Status:{' '}
                <span className="font-semibold text-[#5D87FF]">{currentSurat.status.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Perubahan
            </button>

            <button
              type="button"
              onClick={handleSaveAndResend}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5D87FF] hover:bg-[#4A75F2] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Simpan &amp; Kirim Kembali
            </button>

            {showApprovalActions && currentSurat.status !== 'SURAT_TERBIT' && (
              <button
                type="button"
                onClick={handleSaveAndApprove}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Setujui &amp; Terbitkan SPT
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto print:overflow-visible">
        {/* Bilah Ubah Nomor Surat & Upload File Perbaikan (Word/PDF) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-2 border-b border-slate-100 bg-slate-50/70 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="modal-edit-nomor-surat" className="text-xs font-semibold text-slate-600">
              Nomor Surat:
            </label>
            <input
              id="modal-edit-nomor-surat"
              type="text"
              value={editedNomorSurat}
              onChange={(e) => handleNomorSuratChange(e.target.value)}
              placeholder="Contoh: 094/125/DISKOMINFO/2026"
              className="w-60 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 focus:border-[#5D87FF] focus:outline-none focus:ring-2 focus:ring-[#5D87FF]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={uploadPerbaikanInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleUploadPerbaikan}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => uploadPerbaikanInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#5D87FF]/25 bg-[#ECF2FF] px-3 py-1.5 text-xs font-semibold text-[#5D87FF] hover:bg-blue-100 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {currentSurat.filePerbaikanUrl ? 'Ganti File Perbaikan (Word/PDF)' : 'Upload File Perbaikan (Word/PDF)'}
            </button>
            {currentSurat.filePerbaikanUrl && (
              <button
                type="button"
                onClick={() =>
                  downloadFileUrl(
                    currentSurat.filePerbaikanUrl,
                    currentSurat.filePerbaikanNama || 'Perbaikan_Surat_Tugas.docx',
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                {currentSurat.filePerbaikanNama || 'Unduh Perbaikan'}
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`no-print flex items-center justify-between border-b px-5 py-2 text-xs font-semibold print:hidden ${
              feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-4 h-4 ${
                  feedback.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                }`}
              />
              {feedback.text}
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className={`${
                feedback.type === 'warning'
                  ? 'text-amber-600 hover:text-amber-800'
                  : 'text-emerald-600 hover:text-emerald-800'
              } cursor-pointer`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interactive A4 Word Document Canvas */}
        <A4WordEditorCanvas
          key={currentSurat.id}
          data={authoritativeData}
          initialHtml={currentSurat.dokumenDraftText}
          onChangeHtml={setDraftHtml}
          autoSyncFromData={false}
          maxHeightClass="max-h-none"
          showSyncButton={true}
          editorRef={canvasEditorRef}
          signerDefaultName={currentSurat.pengaju?.nama || user?.nama}
          defaultSignatureRole={modalAllowedRole}
          embedded={true}
        />
        </div>
      </div>
    </div>
  );
};

export const CetakSuratTugasModal: React.FC<CetakSuratTugasModalProps> = ({
  surat,
  isOpen,
  onClose,
  showApprovalActions = false,
}) => {
  const { tasks } = usePenugasan();
  const currentSurat = surat ? tasks.find((t) => t.id === surat.id) || surat : null;

  if (!isOpen || !currentSurat) return null;

  return (
    <CetakSuratTugasModalContent
      key={currentSurat.id}
      currentSurat={currentSurat}
      onClose={onClose}
      showApprovalActions={showApprovalActions}
    />
  );
};

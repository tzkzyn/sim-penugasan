import React, { useRef, useState } from 'react';
import type {
  AjuanSuratTugas,
  WorkflowStep,
} from '@/types';
import { usePenugasan } from '@/context/PenugasanContext';
import { useAuth } from '@/hooks/useAuth';
import type { SignatureResult } from '@/components/ui/signature-pad';
import { A4WordEditorCanvas } from '@/components/ui/A4WordEditorCanvas';
import {
  downloadFileUrl,
  readFileAsDataUrl,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import {
  enforceSignatureIntegrityHtml,
  extractSignaturesFromHtml,
  formatSignatureTimestamp,
  isValidSignatureDataUrl,
  type A4DocumentData,
  type SignatureRole,
} from '@/utils/suratHtmlHelpers';
import {
  X,
  FileDown,
  Save,
  CheckCircle2,
  FileText,
  PenLine,
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
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);

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

  const handleSignatureSaved = async (sig: SignatureResult, role: SignatureRole) => {
    const cleanHtml = getLatestHtml();
    const signedAtStr = formatSignatureTimestamp(sig.signedAt);
    const signerNameValue =
      sig.name ||
      (role === 'user'
        ? currentSurat.pengaju?.nama || user?.nama || 'Pegawai Pengaju'
        : user?.nama || 'Hj. Anita Purnamasari, S.Kom., M.T.');

    if (role === 'user') {
      await updateTask(currentSurat.id, {
        dokumenDraftText: cleanHtml,
        ttdUserPng: sig.png,
        ttdUserSignerName: signerNameValue,
        ttdUserSignedAt: signedAtStr,
        ttdDigitalPng: sig.png,
        ttdSignerName: signerNameValue,
        ttdSignedAt: signedAtStr,
      });
      setFeedback({
        type: 'success',
        text: 'Tanda tangan Pengaju (Kolom Kiri) berhasil dibubuhkan & disimpan ke sistem!',
      });
    } else {
      await updateTask(currentSurat.id, {
        dokumenDraftText: cleanHtml,
        ttdApprovalPng: sig.png,
        ttdApprovalSignerName: signerNameValue,
        ttdApprovalSignedAt: signedAtStr,
        ttdDigitalPng: sig.png,
        ttdSignerName: signerNameValue,
        ttdSignedAt: signedAtStr,
      });
      setFeedback({
        type: 'success',
        text: 'Tanda tangan Pejabat Approval (Kolom Kanan) berhasil dibubuhkan & disimpan ke sistem!',
      });
    }
  };

  const handleSaveAndApprove = async () => {
    const cleanHtml = getLatestHtml();
    const domSigs = extractSignaturesFromHtml(cleanHtml);
    const hasApprovalSig = Boolean(
      isValidSignatureDataUrl(authoritativeData.ttdApprovalPng) ||
      isValidSignatureDataUrl(domSigs.approvalPng)
    );

    if (!hasApprovalSig) {
      setFeedback({
        type: 'warning',
        text: 'Silakan bubuhkan Tanda Tangan Pejabat Approval (Kolom Kanan) terlebih dahulu sebelum menerbitkan SPT!',
      });
      setIsSignatureOpen(true);
      return;
    }

    const updatedWorkflow: WorkflowStep[] = (currentSurat.workflow || []).map((w) => ({
      ...w,
      status: 'COMPLETED',
      tanggal: w.tanggal || new Date().toISOString().replace('T', ' ').substring(0, 16),
    }));

    await updateTask(currentSurat.id, {
      dokumenDraftText: cleanHtml,
      ttdApprovalPng: authoritativeData.ttdApprovalPng ?? domSigs.approvalPng,
      status: 'SURAT_TERBIT',
      workflow: updatedWorkflow,
    });
    setFeedback({
      type: 'success',
      text: 'Naskah kertas A4 disimpan & Surat Tugas resmi disetujui (SURAT TERBIT)! Siap dicetak.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto print:static print:bg-white print:p-0 print:block">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:m-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        {/* Modal Top Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Editor &amp; Cetak Kertas A4 Surat Perintah Tugas (Ala MS Word)
              </h3>
              <p className="text-xs text-slate-500">
                Nomor: <span className="font-mono font-semibold text-slate-700">{currentSurat.nomorSurat}</span> &bull; Status:{' '}
                <span className="font-semibold text-blue-700">{currentSurat.status.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSignatureOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              {modalAllowedRole === 'approval' ? 'Bubuhkan TTD Approval' : 'Bubuhkan TTD Pengaju'}
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Perubahan
            </button>

            <button
              type="button"
              onClick={handleSaveAndResend}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Simpan &amp; Kirim Kembali
            </button>

            {showApprovalActions && currentSurat.status !== 'SURAT_TERBIT' && (
              <button
                type="button"
                onClick={handleSaveAndApprove}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui &amp; Terbitkan SPT (ACC)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bilah Ubah Nomor Surat & Upload File Perbaikan (Word/PDF) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-slate-200 bg-white print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="modal-edit-nomor-surat" className="text-xs font-bold text-slate-700">
              Ubah Nomor Surat:
            </label>
            <input
              id="modal-edit-nomor-surat"
              type="text"
              value={editedNomorSurat}
              onChange={(e) => handleNomorSuratChange(e.target.value)}
              placeholder="Contoh: 094/125/DISKOMINFO/2026"
              className="w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
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
          maxHeightClass="max-h-[75vh]"
          showSyncButton={true}
          editorRef={canvasEditorRef}
          signerDefaultName={currentSurat.pengaju?.nama || user?.nama}
          defaultSignatureRole={modalAllowedRole}
          onSignatureChange={handleSignatureSaved}
          isSignatureModalOpen={isSignatureOpen}
          onSignatureModalOpenChange={setIsSignatureOpen}
        />
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

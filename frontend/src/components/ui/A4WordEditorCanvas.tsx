import React, { useEffect, useRef, useState } from 'react';
import type {
  KategoriTemplateSurat,
  TemplateSuratResmi,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { SignaturePad, type SignatureResult } from '@/components/ui/signature-pad';
import { exportEditorToDocx } from '@/utils/docxExport';
import { renderApprovalTemplateHtml } from '@/utils/docxImport';
import {
  resolveKategoriTemplate,
} from '@/utils/penugasanHelpers';
import {
  applySignatureSlotToDom,
  buildA4DocumentHtml,
  buildSignatureSlotHtml,
  enforceSignatureIntegrityHtml,
  escapeHtml,
  extractSignaturesFromHtml,
  formatSignatureTimestamp,
  isValidSignatureDataUrl,
  looksLikeHtmlDocument,
  prepareDocumentSignatureSlotsHtml,
  sanitizeSafeHtml,
  type A4DocumentData,
  type SignatureRole,
} from '@/utils/suratHtmlHelpers';
import {
  Printer,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileDown,
  RotateCcw,
  Users,
  User,
} from 'lucide-react';

export type { A4DocumentData, SignatureRole };

export interface A4WordEditorCanvasProps {
  data: A4DocumentData;
  initialHtml?: string;
  customTemplate?: TemplateSuratResmi | null;
  onChangeHtml?: (html: string) => void;
  autoSyncFromData?: boolean;
  maxHeightClass?: string;
  showSyncButton?: boolean;
  editorRef?: React.RefObject<HTMLDivElement | null>;
  signerDefaultName?: string;
  defaultSignatureRole?: SignatureRole;
  onSignatureChange?: (sig: SignatureResult, role: SignatureRole) => void;
  isSignatureModalOpen?: boolean;
  onSignatureModalOpenChange?: (open: boolean) => void;
}

export const A4WordEditorCanvas: React.FC<A4WordEditorCanvasProps> = ({
  data,
  initialHtml,
  customTemplate = null,
  onChangeHtml,
  autoSyncFromData = false,
  maxHeightClass = 'max-h-[72vh]',
  showSyncButton = true,
  editorRef: externalRef,
  signerDefaultName,
  defaultSignatureRole,
  onSignatureChange,
  isSignatureModalOpen,
  onSignatureModalOpenChange,
}) => {
  const { user } = useAuth();
  const internalRef = useRef<HTMLDivElement>(null);
  const editorRef = externalRef || internalRef;
  const [variantOverride, setVariantOverride] = useState<KategoriTemplateSurat | null>(null);
  const templateIdentityKey = `${data.id ?? ''}:${customTemplate?.id ?? ''}:${customTemplate?.diperbaruiPada ?? ''}:${Boolean(initialHtml && initialHtml.trim().length > 0)}`;
  const [manualEditKey, setManualEditKey] = useState<string | null>(() =>
    initialHtml && initialHtml.trim().length > 0 ? templateIdentityKey : null
  );
  const hasManualEdit = manualEditKey === templateIdentityKey;
  const [internalSigOpen, setInternalSigOpen] = useState(false);

  // Kunci ketat posisi tanda tangan sesuai role akun yang login:
  // Akun APPROVAL hanya boleh mengisi TTD Kanan ('approval'),
  // sedangkan Akun USER / ADMIN / SUPER_ADMIN saat pengajuan hanya mengisi TTD Kiri ('user').
  const allowedRole: SignatureRole =
    defaultSignatureRole ?? (user?.role?.toUpperCase() === 'APPROVAL' ? 'approval' : 'user');

  const initialExtractedSigs = extractSignaturesFromHtml(initialHtml);

  const [userSig, setUserSig] = useState<{
    png?: string;
    name?: string;
    signedAt?: string;
  }>(() => ({
    png: data.ttdUserPng ?? initialExtractedSigs.userPng,
    name: data.ttdUserSignerName,
    signedAt: data.ttdUserSignedAt ?? initialExtractedSigs.userSignedAt,
  }));

  const [approvalSig, setApprovalSig] = useState<{
    png?: string;
    name?: string;
    signedAt?: string;
  }>(() => ({
    png: data.ttdApprovalPng ?? initialExtractedSigs.approvalPng,
    name: data.ttdApprovalSignerName,
    signedAt: data.ttdApprovalSignedAt ?? initialExtractedSigs.approvalSignedAt,
  }));

  const sigModalOpen = isSignatureModalOpen ?? internalSigOpen;
  const setSigModalOpen = (nextOpen: boolean) => {
    if (onSignatureModalOpenChange) {
      onSignatureModalOpenChange(nextOpen);
    } else {
      setInternalSigOpen(nextOpen);
    }
  };

  const effectiveData: A4DocumentData = {
    ...data,
    ttdUserPng: userSig.png ?? data.ttdUserPng,
    ttdUserSignerName: userSig.name ?? data.ttdUserSignerName,
    ttdUserSignedAt: userSig.signedAt ?? data.ttdUserSignedAt,
    ttdApprovalPng: approvalSig.png ?? data.ttdApprovalPng,
    ttdApprovalSignerName: approvalSig.name ?? data.ttdApprovalSignerName,
    ttdApprovalSignedAt: approvalSig.signedAt ?? data.ttdApprovalSignedAt,
  };

  const resolvedModalSignerName =
    allowedRole === 'user'
      ? effectiveData.pengaju?.nama || signerDefaultName || user?.nama || ''
      : (user?.role?.toUpperCase() === 'APPROVAL' ? user?.nama : '') || 'Hj. Anita Purnamasari, S.Kom., M.T.';

    const sigStorageKey = `sim_penugasan_saved_sig_${user?.id || user?.username || allowedRole}`;

    const activeKategori: KategoriTemplateSurat =
      variantOverride ??
      data.kategoriTemplate ??
      resolveKategoriTemplate(effectiveData.pegawaiDitugaskan.length);

    const buildResolvedHtml = (variant: KategoriTemplateSurat): string => {
      if (customTemplate) {
        return sanitizeSafeHtml(
          renderApprovalTemplateHtml(
            customTemplate,
            { ...effectiveData, kategoriTemplate: variant },
            import.meta.env.BASE_URL || '/',
          ),
        );
      }
      return sanitizeSafeHtml(buildA4DocumentHtml(effectiveData, variant));
    };

    const serializeDataKey = JSON.stringify({
      id: effectiveData.id,
      customTemplateId: customTemplate?.id || null,
      customTemplateUpdatedAt: customTemplate?.diperbaruiPada || null,
      nomorSurat: effectiveData.nomorSurat,
      perihal: effectiveData.perihal,
      unitKerja: effectiveData.unitKerja,
      kategoriTemplate: activeKategori,
      tanggalMulai: effectiveData.tanggalMulai,
      tanggalSelesai: effectiveData.tanggalSelesai,
      jamMulai: effectiveData.jamMulai,
      jamSelesai: effectiveData.jamSelesai,
      lokasiPenugasan: effectiveData.lokasiPenugasan,
      lokasiSpesifik: effectiveData.lokasiSpesifik,
      deskripsi: effectiveData.deskripsi,
      dasarSuratDari: effectiveData.dasarSuratDari,
      dasarSuratNomor: effectiveData.dasarSuratNomor,
      dasarSuratTanggal: effectiveData.dasarSuratTanggal,
      sumberBiaya: effectiveData.sumberBiaya,
      namaKepala: effectiveData.namaKepala,
      pengajuKey: `${effectiveData.pengaju?.id || ''}:${effectiveData.pengaju?.nama || ''}`,
      pegawaiKey: effectiveData.pegawaiDitugaskan
        .map((p) => `${p.id}:${p.nama}:${p.nip}:${p.pangkatGolongan || ''}:${p.jabatan}`)
        .join('|'),
      ttdUserPng: effectiveData.ttdUserPng,
      ttdUserSignerName: effectiveData.ttdUserSignerName,
      ttdUserSignedAt: effectiveData.ttdUserSignedAt,
      ttdApprovalPng: effectiveData.ttdApprovalPng,
      ttdApprovalSignerName: effectiveData.ttdApprovalSignerName,
      ttdApprovalSignedAt: effectiveData.ttdApprovalSignedAt,
      allowedRole,
    });

    // Inisialisasi konten awal saat dokumen dibuka
    useEffect(() => {
      if (!editorRef.current) return;

      const resolveInitialHtml = (): string => {
        if (initialHtml && initialHtml.trim().length > 0) {
          if (looksLikeHtmlDocument(initialHtml)) {
            const prepared = prepareDocumentSignatureSlotsHtml(initialHtml, effectiveData, allowedRole);
            return enforceSignatureIntegrityHtml(prepared, effectiveData, allowedRole);
          }
          const plainConverted = escapeHtml(initialHtml).replace(/\n/g, '<br/>');
          return buildA4DocumentHtml(effectiveData, activeKategori, plainConverted);
        }
        return buildResolvedHtml(activeKategori);
      };

      const safeHtml = resolveInitialHtml();
      editorRef.current.innerHTML = safeHtml;
      if (onChangeHtml && !initialHtml) {
        onChangeHtml(safeHtml);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.id, allowedRole]);

    // Sinkronisasi otomatis dari form sebelah kiri bila belum diedit manual di atas kertas A4
    useEffect(() => {
      if (!autoSyncFromData || hasManualEdit || !editorRef.current) return;
      const updatedHtml = buildResolvedHtml(activeKategori);
      editorRef.current.innerHTML = updatedHtml;
      if (onChangeHtml) {
        onChangeHtml(updatedHtml);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serializeDataKey, autoSyncFromData, hasManualEdit]);

    const handleEditorInput = () => {
      if (!editorRef.current) return;
      setManualEditKey(templateIdentityKey);
      if (onChangeHtml) {
        onChangeHtml(enforceSignatureIntegrityHtml(editorRef.current.innerHTML, effectiveData, allowedRole));
      }
    };

    const applyTemplateVariant = (variant: KategoriTemplateSurat) => {
      setVariantOverride(variant);
      setManualEditKey(null);
      const freshHtml = buildResolvedHtml(variant);
      if (editorRef.current) {
        editorRef.current.innerHTML = freshHtml;
      }
      if (onChangeHtml) {
        onChangeHtml(freshHtml);
      }
  };

  const handleSyncFromForm = () => {
    setVariantOverride(null);
    setManualEditKey(null);
    const syncedVariant =
      data.kategoriTemplate ?? resolveKategoriTemplate(effectiveData.pegawaiDitugaskan.length);
    const freshHtml = buildResolvedHtml(syncedVariant);
    if (editorRef.current) {
      editorRef.current.innerHTML = freshHtml;
    }
    if (onChangeHtml) {
      onChangeHtml(freshHtml);
    }
  };

  const handleAcceptSignature = (result: SignatureResult) => {
    if (!isValidSignatureDataUrl(result.png)) return;

    const roleToApply = allowedRole;
    const signedAtFormatted = formatSignatureTimestamp(result.signedAt);
    const fallbackName =
      roleToApply === 'user'
        ? effectiveData.pengaju?.nama || signerDefaultName || user?.nama || 'Pegawai Pengaju'
        : 'Hj. Anita Purnamasari, S.Kom., M.T.';
    const finalSignerName = result.name || fallbackName;

    const nextEffectiveData: A4DocumentData =
      roleToApply === 'user'
        ? {
            ...effectiveData,
            ttdUserPng: result.png,
            ttdUserSignerName: finalSignerName,
            ttdUserSignedAt: signedAtFormatted,
          }
        : {
            ...effectiveData,
            ttdApprovalPng: result.png,
            ttdApprovalSignerName: finalSignerName,
            ttdApprovalSignedAt: signedAtFormatted,
          };

    if (roleToApply === 'user') {
      setUserSig({
        png: result.png,
        name: finalSignerName,
        signedAt: signedAtFormatted,
      });
    } else {
      setApprovalSig({
        png: result.png,
        name: finalSignerName,
        signedAt: signedAtFormatted,
      });
    }

    if (editorRef.current) {
      const slotHtml = buildSignatureSlotHtml(roleToApply, result.png, signedAtFormatted, finalSignerName, true);
      applySignatureSlotToDom(editorRef.current, roleToApply, slotHtml, nextEffectiveData, finalSignerName);
      const updatedHtml = enforceSignatureIntegrityHtml(editorRef.current.innerHTML, nextEffectiveData, roleToApply);
      editorRef.current.innerHTML = updatedHtml;
      if (onChangeHtml) {
        onChangeHtml(updatedHtml);
      }
    }

    setSigModalOpen(false);
    if (onSignatureChange) {
      onSignatureChange(result, roleToApply);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const userSlot = target?.closest('#a4-signature-slot-user, [data-sig-role="user"]');
    if (userSlot) {
      e.preventDefault();
      if (allowedRole === 'user') {
        setSigModalOpen(true);
      }
      return;
    }
    const approvalSlot = target?.closest('#a4-signature-slot-approval, [data-sig-role="approval"]');
    if (approvalSlot) {
      e.preventDefault();
      if (allowedRole === 'approval') {
        setSigModalOpen(true);
      }
      return;
    }
    if (target?.closest('#a4-signature-slot, [data-sig-slot="true"]')) {
      e.preventDefault();
      setSigModalOpen(true);
    }
  };

  const execFormat = (command: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false);
      handleEditorInput();
    }
  };

  const handleDownloadWord = async () => {
    if (!editorRef.current) return;
    const safeFilename = (data.nomorSurat || 'Surat_Tugas').replace(/[^a-zA-Z0-9_-]/g, '_');
    await exportEditorToDocx({
      editorContainer: editorRef.current,
      filename: safeFilename,
      baseUrl: import.meta.env.BASE_URL || '/',
    });
  };

  const handlePrint = () => {
    if (!editorRef.current) {
      window.print();
      return;
    }
    const rawHtml = enforceSignatureIntegrityHtml(editorRef.current.innerHTML, effectiveData, allowedRole);
    const parser = new DOMParser();
    const parsed = parser.parseFromString(rawHtml, 'text/html');
    parsed.body.querySelectorAll('img').forEach((img) => {
      const srcAttr = img.getAttribute('src') || '';
      if (srcAttr.startsWith('/')) {
        img.setAttribute('src', `${window.location.origin}${srcAttr}`);
      }
    });
    const printableBodyHtml = sanitizeSafeHtml(parsed.body.innerHTML);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Surat Tugas - ${escapeHtml(data.nomorSurat || 'Draft')}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 18mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: "Bookman Old Style", "URW Bookman", "Bookman", "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    img { max-width: 100%; height: auto; }
    table.spt-layout-table { width: 100%; border-collapse: collapse; border: none; }
    table.spt-layout-table td, table.spt-layout-table th { border: none; vertical-align: top; }
    table.spt-data-table { width: 100%; border-collapse: collapse; }
    table.spt-data-table th, table.spt-data-table td { border: 1px solid #0f172a; padding: 5px 8px; font-size: 10pt; }
    table.spt-data-table th { background-color: #f1f5f9; font-weight: 700; text-align: center; }
  </style>
</head>
<body>${printableBodyHtml}</body>
</html>`);
    doc.close();

    const triggerPrint = () => {
      if (!iframe.contentWindow) return;
      const cleanup = () => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };
      iframe.contentWindow.onafterprint = cleanup;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      window.setTimeout(cleanup, 60_000);
    };

    const imgs = Array.from(doc.querySelectorAll('img'));
    const pending = imgs.filter((img) => !img.complete);
    if (pending.length === 0) {
      window.setTimeout(triggerPrint, 80);
    } else {
      let remaining = pending.length;
      const onDone = () => {
        remaining -= 1;
        if (remaining <= 0) {
          window.setTimeout(triggerPrint, 80);
        }
      };
      pending.forEach((img) => {
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
      });
      window.setTimeout(() => {
        if (remaining > 0) {
          remaining = 0;
          triggerPrint();
        }
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden print:border-none print:bg-white print:shadow-none print:overflow-visible">
      {/* Header & Toolbar Editor Kertas A4 (2 Baris Terorganisir & Clean) */}
      <div className="no-print border-b border-slate-200 bg-white print:hidden">
        {/* Baris 1: Judul / Status Dokumen & Aksi Utama */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Editor Kertas A4</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                hasManualEdit
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${hasManualEdit ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {hasManualEdit ? 'Diedit Manual' : 'Sinkron Otomatis'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {showSyncButton && (
              <button
                type="button"
                onClick={handleSyncFromForm}
                title="Muat ulang data dari isian form sebelah kiri ke kertas A4"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Sinkron Form
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-[11px] font-semibold text-[#1D4ED8] hover:bg-blue-100/80 transition cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" /> Unduh .docx
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1E40AF] shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / PDF
            </button>
          </div>
        </div>

        {/* Baris 2: Segmented Jenis SPT & Formatting Teks Ringkas */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 px-3.5 py-2">
          <div className="inline-flex items-center rounded-xl bg-slate-200/70 p-0.5">
            <button
              type="button"
              onClick={() => applyTemplateVariant('INDIVIDU')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                activeKategori === 'INDIVIDU'
                  ? 'bg-white text-[#1E40AF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3 h-3" /> Individu
            </button>
            <button
              type="button"
              onClick={() => applyTemplateVariant('BERDUA')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                activeKategori === 'BERDUA'
                  ? 'bg-white text-[#1E40AF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3 h-3" /> Berdua
            </button>
            <button
              type="button"
              onClick={() => applyTemplateVariant('KELOMPOK')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                activeKategori === 'KELOMPOK'
                  ? 'bg-white text-[#1E40AF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3 h-3" /> Kelompok
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden xl:inline text-[11px] text-slate-400">
              Klik naskah untuk edit langsung
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('bold')}
                title="Tebal (Bold)"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('italic')}
                title="Miring (Italic)"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('underline')}
                title="Garis Bawah (Underline)"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="mx-1 h-4 w-px bg-slate-200" />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('justifyLeft')}
                title="Rata Kiri"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('justifyCenter')}
                title="Rata Tengah"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('justifyRight')}
                title="Rata Kanan"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat('justifyFull')}
                title="Rata Kiri-Kanan (Justify)"
                className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#1D4ED8] cursor-pointer"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Area Meja Kerja Kertas A4 (Editable & Printable) */}
      <div
        className={`overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-100/90 print:p-0 print:bg-white print:overflow-visible print:max-h-none ${maxHeightClass}`}
      >
        <div
          ref={editorRef}
          id="printable-spt-document"
          contentEditable
          suppressContentEditableWarning
          onClick={handleCanvasClick}
          onInput={handleEditorInput}
          className="a4-paper-sheet w-full max-w-[210mm] min-h-[297mm] bg-white px-7 py-8 sm:px-11 sm:py-10 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/90 print:shadow-none print:ring-0 print:p-4"
        />
      </div>

      {/* Modal Panel Tanda Tangan Digital */}
      {sigModalOpen && (
        <div
          onClick={() => setSigModalOpen(false)}
          className="no-print fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-[2px] animate-in fade-in-0 duration-150 print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] space-y-2 animate-in zoom-in-95 duration-150"
          >
            {/* Indikator Role Aktif (Read-Only, dikunci per akun login) */}
            <div
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm ${
                allowedRole === 'approval'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
            >
              Posisi Tanda Tangan:{' '}
              <strong>
                {allowedRole === 'approval'
                  ? 'Pejabat Approval (Kolom Kanan)'
                  : 'Pemohon / Pegawai Pelaksana (Kolom Kiri)'}
              </strong>
            </div>

            <SignaturePad
              key={sigStorageKey}
              title={
                allowedRole === 'user'
                  ? 'TTD Digital Pengaju / Pelaksana (Kiri)'
                  : 'TTD Digital Pejabat Approval (Kanan)'
              }
              signerName={resolvedModalSignerName}
              storageKey={sigStorageKey}
              showSignedState={false}
              onCancel={() => setSigModalOpen(false)}
              onAccept={handleAcceptSignature}
              className="shadow-[0_24px_60px_-18px_rgb(0_0_0/0.35)]"
            />
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useEffect, useRef, useState } from 'react';
import type {
  AjuanSuratTugas,
  KategoriTemplateSurat,
  Pegawai,
  TemplateSuratResmi,
  WorkflowStep,
} from '@/types';
import { usePenugasan } from '@/context/PenugasanContext';
import { useAuth } from '@/hooks/useAuth';
import { SignaturePad, type SignatureResult } from '@/components/ui/signature-pad';
import { exportEditorToDocx } from '@/utils/docxExport';
import { renderApprovalTemplateHtml } from '@/utils/docxImport';
import {
  downloadFileUrl,
  readFileAsDataUrl,
  resolveKategoriTemplate,
  validateDocumentFile,
} from '@/utils/penugasanHelpers';
import {
  Printer,
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileDown,
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  PenLine,
  Upload,
  Send,
  Users,
  User,
} from 'lucide-react';

export type SignatureRole = 'user' | 'approval';

export interface A4DocumentData {
  id?: string;
  nomorSurat: string;
  perihal: string;
  unitKerja: string;
  kategoriTemplate?: KategoriTemplateSurat;
  tanggalMulai: string;
  tanggalSelesai: string;
  jamMulai?: string;
  jamSelesai?: string;
  lokasiPenugasan: string;
  lokasiSpesifik?: string;
  deskripsi?: string;
  dasarSuratDari?: string;
  dasarSuratNomor?: string;
  dasarSuratTanggal?: string;
  sumberBiaya?: 'PENYELENGGARA' | 'DIPA' | 'LAINNYA';
  namaKepala?: string;
  pengaju?: Pegawai;
  pegawaiDitugaskan: Pegawai[];
  ttdDigitalPng?: string;
  ttdSignerName?: string;
  ttdSignedAt?: string;
  ttdUserPng?: string;
  ttdUserSignerName?: string;
  ttdUserSignedAt?: string;
  ttdApprovalPng?: string;
  ttdApprovalSignerName?: string;
  ttdApprovalSignedAt?: string;
}

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

const VALID_SIGNATURE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/i;

const isValidSignatureDataUrl = (value?: string): value is string =>
  Boolean(value && VALID_SIGNATURE_DATA_URL_RE.test(value.trim()));

const escapeHtml = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const sanitizeSafeHtml = (rawHtml: string): string => {
  if (!rawHtml) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const forbiddenTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'textarea',
      'button',
      'link',
      'meta',
      'style',
      'svg',
      'math',
      'base',
      'template',
      'audio',
      'video',
      'source',
    ];
    forbiddenTags.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    doc.body.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        // Strip whitespace and control chars (<= 32) cleanly without control regex literals
        const normalizedVal = attr.value
          .split('')
          .filter((ch) => ch.charCodeAt(0) > 32)
          .join('')
          .toLowerCase();
        if (attrName.startsWith('on') || attrName === 'srcdoc') {
          el.removeAttribute(attr.name);
        } else if (
          attrName === 'href' ||
          attrName === 'src' ||
          attrName === 'action' ||
          attrName === 'formaction'
        ) {
          const isDangerousProtocol =
            normalizedVal.startsWith('javascript:') ||
            normalizedVal.startsWith('vbscript:') ||
            (normalizedVal.startsWith('data:') && !VALID_SIGNATURE_DATA_URL_RE.test(attr.value.trim()));
          if (isDangerousProtocol) {
            el.removeAttribute(attr.name);
          }
        }
      });
    });

    return doc.body.innerHTML;
  } catch {
    return escapeHtml(rawHtml).replace(/\n/g, '<br/>');
  }
};

const formatTanggalIndo = (tglStr?: string): string => {
  if (!tglStr) return '....................';
  try {
    // Parse YYYY-MM-DD as local calendar date to avoid UTC midnight shifting back 1 day in negative UTC offsets
    const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tglStr.trim());
    const dateObj = isoDateOnly
      ? new Date(Number(isoDateOnly[1]), Number(isoDateOnly[2]) - 1, Number(isoDateOnly[3]))
      : new Date(tglStr);
    if (Number.isNaN(dateObj.getTime())) return tglStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return tglStr;
  }
};

const looksLikeHtmlDocument = (content: string): boolean => {
  const trimmed = content.trim();
  return trimmed.includes('<table') || trimmed.includes('<div') || trimmed.includes('<p');
};

const formatSignatureTimestamp = (date: Date): string =>
  date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildSignatureSlotHtml = (
  role: SignatureRole,
  png?: string,
  signedAt?: string,
  signerName?: string,
  canEdit = true,
): string => {
  const slotId = role === 'user' ? 'a4-signature-slot-user' : 'a4-signature-slot-approval';
  const roleLabel = role === 'user' ? 'Pengaju / Pelaksana' : 'Pejabat Approval';
  const placeholderText = canEdit
    ? role === 'user'
      ? '[ Klik untuk TTD Pegawai / Pengaju ]'
      : '[ Klik untuk TTD Pejabat Approval ]'
    : role === 'user'
      ? '[ Belum ditandatangani Pengaju ]'
      : '[ Menunggu TTD Pejabat Approval ]';

  const interactiveCursor = canEdit ? 'cursor:pointer;' : 'cursor:default;';
  const titleText = canEdit
    ? png
      ? `Klik untuk mengubah tanda tangan ${roleLabel}`
      : `Klik untuk membubuhkan tanda tangan ${roleLabel}`
    : `Kolom TTD ${roleLabel} (khusus akun ${role === 'user' ? 'User / Pemohon' : 'Approval'})`;

  if (isValidSignatureDataUrl(png)) {
    const metaParts = [signerName, signedAt].filter(Boolean).join(' • ');
    const caption = metaParts
      ? `<div style="font-size:8.5px;color:#059669;font-family:sans-serif;margin-top:2px;">&#10003; TTE: ${escapeHtml(metaParts)}</div>`
      : '';
    return `<div id="${slotId}" data-sig-slot="true" data-sig-role="${role}" contenteditable="false" title="${escapeHtml(titleText)}" style="min-height:66px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 0;${interactiveCursor}user-select:none;"><img src="${escapeHtml(png.trim())}" alt="Tanda Tangan Digital" style="max-height:58px;max-width:190px;height:52px;width:auto;object-fit:contain;display:block;margin:0 auto;" />${caption}</div>`;
  }
  const boxStyle = canEdit
    ? 'border:1px dashed #7c3aed;color:#4c1d95;background:#f5f3ff;'
    : 'border:1px dashed #cbd5e1;color:#64748b;background:#f8fafc;';
  return `<div id="${slotId}" data-sig-slot="true" data-sig-role="${role}" contenteditable="false" title="${escapeHtml(titleText)}" style="height:60px;display:flex;align-items:center;justify-content:center;font-size:10px;font-style:italic;border-radius:6px;margin:4px auto;max-width:230px;padding:0 8px;${boxStyle}${interactiveCursor}user-select:none;">${escapeHtml(placeholderText)}</div>`;
};

const buildDualSignatureBlockHtml = (
  data: A4DocumentData,
  docId: string,
  tglTtd: string,
  isNota = false,
  editableRole: SignatureRole = 'user',
): string => {
  const unitKerja = escapeHtml(data.unitKerja || 'Fastingkom');
  const pemohon = data.pengaju || data.pegawaiDitugaskan?.[0];
  const pemohonNama = escapeHtml(pemohon?.nama || data.ttdUserSignerName || 'Pegawai Pelaksana / Pengaju');
  const pemohonNip = pemohon?.nip ? `NIP. ${escapeHtml(pemohon.nip)}` : 'Pelaksana Tugas';

  const userSlotHtml = buildSignatureSlotHtml(
    'user',
    data.ttdUserPng,
    data.ttdUserSignedAt,
    data.ttdUserSignerName,
    editableRole === 'user',
  );

  const approvalSlotHtml = buildSignatureSlotHtml(
    'approval',
    data.ttdApprovalPng,
    data.ttdApprovalSignedAt,
    data.ttdApprovalSignerName,
    editableRole === 'approval',
  );

  const leftTitle = isNota
    ? `Pengusul / Koordinator Unit ${unitKerja},`
    : 'Yang Mengajukan / Pegawai Pelaksana,';

  const rightHeader = isNota
    ? `<div style="font-weight:700;">Mengetahui / Menyetujui,</div>
       <div style="font-weight:600;color:#334155;">Kepala Bidang / Pejabat Approval</div>`
    : `<div>Ditetapkan di Yogyakarta, ${tglTtd}</div>
       <div style="font-weight:700;text-transform:uppercase;margin-top:4px;">An. KEPALA DINAS KOMUNIKASI DAN INFORMATIKA</div>
       <div style="font-weight:600;color:#334155;">Pejabat Approval / Pembimbing Teknis</div>`;

  return `
    <table id="a4-dual-signature-table" class="spt-layout-table" style="font-size:12px;margin-top:22px;">
      <tr>
        <td style="width:48%;text-align:center;vertical-align:bottom;padding-right:10px;">
          <div style="color:#475569;">Pemohon Penugasan</div>
          <div style="font-weight:700;margin-top:4px;">${leftTitle}</div>
          ${userSlotHtml}
          <div id="a4-user-signer-name" style="font-weight:700;text-decoration:underline;font-size:12.5px;">${pemohonNama}</div>
          <div style="font-family:monospace;font-size:11px;">${pemohonNip}</div>
        </td>
        <td style="width:4%;"></td>
        <td style="width:48%;text-align:center;vertical-align:bottom;padding-left:10px;">
          ${rightHeader}
          ${approvalSlotHtml}
          <div id="a4-approval-signer-name" style="font-weight:700;text-decoration:underline;font-size:12.5px;">Hj. Anita Purnamasari, S.Kom., M.T.</div>
          <div style="font-family:monospace;font-size:11px;">NIP. 198106142006042011</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:16px;border:1px solid #cbd5e1;background:#f8fafc;padding:6px 12px;border-radius:6px;display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:#475569;">
      <span><strong style="color:#1e3a8a;">DIVERIFIKASI DIGITAL</strong> &bull; Sistem SIM-Penugasan Diskominfo DIY</span>
      <span style="font-family:monospace;font-weight:700;color:#0f172a;">TTE-QR-${escapeHtml(docId)}</span>
    </div>
  `;
};

const prepareDocumentSignatureSlotsHtml = (
  html: string,
  data: A4DocumentData,
  editableRole: SignatureRole,
): string => {
  if (!html) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Jika dokumen lama masih 1 slot (#a4-signature-slot), migrasi ke 2 kolom
    if (!doc.getElementById('a4-signature-slot-user') && doc.getElementById('a4-signature-slot')) {
      const legacySlot = doc.getElementById('a4-signature-slot');
      let existingUserPng = data.ttdUserPng;
      let existingUserCaption = data.ttdUserSignedAt;
      if (legacySlot && !existingUserPng) {
        const legacyImg = legacySlot.querySelector('img');
        const src = legacyImg?.getAttribute('src') || '';
        if (isValidSignatureDataUrl(src)) {
          existingUserPng = src;
          existingUserCaption = legacySlot.textContent?.replace(/✓\s*TTE:\s*/i, '').trim() || undefined;
        }
      }

      const legacyTable = legacySlot?.closest('table');
      const docId = (data.id || 'DRAFT-NEW').slice(0, 14);
      const tglTtd = formatTanggalIndo(data.tanggalMulai || new Date().toISOString().substring(0, 10));
      const migratedBlock = buildDualSignatureBlockHtml(
        {
          ...data,
          ttdUserPng: existingUserPng,
          ttdUserSignedAt: existingUserCaption,
        },
        docId,
        tglTtd,
        false,
        editableRole,
      );

      if (legacyTable) {
        legacyTable.outerHTML = sanitizeSafeHtml(migratedBlock);
        return doc.body.innerHTML;
      }
    }

    // 2. Kunci slot dengan contenteditable="false" & sesuaikan prompt/cursor per role aktif
    (['user', 'approval'] as const).forEach((role) => {
      const slot = doc.querySelector(`#a4-signature-slot-${role}, [data-sig-role="${role}"]`);
      if (!slot) return;
      const canEdit = role === editableRole;
      slot.setAttribute('contenteditable', 'false');
      const hasImg = Boolean(slot.querySelector('img'));
      if (!hasImg) {
        const replacementHtml = buildSignatureSlotHtml(role, undefined, undefined, undefined, canEdit);
        slot.outerHTML = sanitizeSafeHtml(replacementHtml);
      } else {
        const currentStyle = slot.getAttribute('style') || '';
        const cleanedStyle = currentStyle
          .replace(/cursor\s*:\s*[^;]+;?/gi, '')
          .trim();
        slot.setAttribute(
          'style',
          `${cleanedStyle ? `${cleanedStyle};` : ''}cursor:${canEdit ? 'pointer' : 'default'};user-select:none;`,
        );
        slot.setAttribute(
          'title',
          canEdit
            ? `Klik untuk mengubah tanda tangan ${role === 'user' ? 'Pengaju' : 'Pejabat Approval'}`
            : `Kolom TTD ${role === 'user' ? 'Pengaju' : 'Pejabat Approval'} (terkunci untuk akun Anda)`,
        );
      }
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

interface ExtractedSignatures {
  userPng?: string;
  userSignedAt?: string;
  approvalPng?: string;
  approvalSignedAt?: string;
}

const extractSignaturesFromHtml = (html?: string): ExtractedSignatures => {
  if (!html) return {};
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result: ExtractedSignatures = {};

    const userSlot =
      doc.querySelector('#a4-signature-slot-user, [data-sig-role="user"]') ||
      doc.getElementById('a4-signature-slot');
    const userImgSrc = userSlot?.querySelector('img')?.getAttribute('src') || '';
    if (isValidSignatureDataUrl(userImgSrc)) {
      result.userPng = userImgSrc.trim();
      const caption = userSlot?.textContent?.replace(/✓\s*TTE:\s*/i, '').trim();
      if (caption) result.userSignedAt = caption;
    }

    const approvalSlot = doc.querySelector('#a4-signature-slot-approval, [data-sig-role="approval"]');
    const approvalImgSrc = approvalSlot?.querySelector('img')?.getAttribute('src') || '';
    if (isValidSignatureDataUrl(approvalImgSrc)) {
      result.approvalPng = approvalImgSrc.trim();
      const caption = approvalSlot?.textContent?.replace(/✓\s*TTE:\s*/i, '').trim();
      if (caption) result.approvalSignedAt = caption;
    }

    return result;
  } catch {
    return {};
  }
};

const enforceSignatureIntegrityHtml = (
  rawHtml: string,
  data: A4DocumentData,
  allowedRole: SignatureRole,
): string => {
  const clean = sanitizeSafeHtml(rawHtml);
  if (!clean) return clean;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');
    const lockedRole: SignatureRole = allowedRole === 'user' ? 'approval' : 'user';
    const authPng = lockedRole === 'user' ? data.ttdUserPng : data.ttdApprovalPng;
    const authSignedAt = lockedRole === 'user' ? data.ttdUserSignedAt : data.ttdApprovalSignedAt;
    const authSignerName = lockedRole === 'user' ? data.ttdUserSignerName : data.ttdApprovalSignerName;

    const hasUserSlot = Boolean(doc.querySelector('#a4-signature-slot-user, [data-sig-role="user"]'));
    const hasApprovalSlot = Boolean(doc.querySelector('#a4-signature-slot-approval, [data-sig-role="approval"]'));

    if (!hasUserSlot && !hasApprovalSlot) {
      return doc.body.innerHTML;
    }

    const lockedSlot = doc.querySelector(`#a4-signature-slot-${lockedRole}, [data-sig-role="${lockedRole}"]`);
    if (lockedSlot) {
      lockedSlot.outerHTML = sanitizeSafeHtml(
        buildSignatureSlotHtml(lockedRole, authPng, authSignedAt, authSignerName, false),
      );
    }

    // Pastikan slot milik role aktif tetap terkunci contenteditable="false"
    const ownSlot = doc.querySelector(`#a4-signature-slot-${allowedRole}, [data-sig-role="${allowedRole}"]`);
    if (ownSlot) {
      ownSlot.setAttribute('contenteditable', 'false');
    }

    return doc.body.innerHTML;
  } catch {
    return clean;
  }
};

const applySignatureSlotToDom = (
  container: HTMLElement,
  role: SignatureRole,
  slotHtml: string,
  data: A4DocumentData,
  signerDisplayName?: string,
): void => {
  const safeSlotHtml = sanitizeSafeHtml(slotHtml);
  const targetSelector =
    role === 'user'
      ? '#a4-signature-slot-user, [data-sig-role="user"]'
      : '#a4-signature-slot-approval, [data-sig-role="approval"]';

  const existingRoleSlot = container.querySelector(targetSelector);
  if (existingRoleSlot) {
    existingRoleSlot.outerHTML = safeSlotHtml;
    return;
  }

  // Migrasi dokumen lama yang masih memakai satu slot (#a4-signature-slot) agar jadi 2 kolom (Kiri & Kanan)
  const legacySlot = container.querySelector('#a4-signature-slot');
  if (legacySlot) {
    let preservedUserPng = data.ttdUserPng;
    let preservedUserCaption = data.ttdUserSignedAt;
    if (role === 'approval' && !preservedUserPng) {
      const legacyImg = legacySlot.querySelector('img');
      const src = legacyImg?.getAttribute('src') || '';
      if (isValidSignatureDataUrl(src)) {
        preservedUserPng = src;
        preservedUserCaption = legacySlot.textContent?.replace(/✓\s*TTE:\s*/i, '').trim() || undefined;
      }
    }
    const legacyTable = legacySlot.closest('table');
    const docId = (data.id || 'DRAFT-NEW').slice(0, 14);
    const tglTtd = formatTanggalIndo(data.tanggalMulai || new Date().toISOString().substring(0, 10));
    const upgradedHtml = buildDualSignatureBlockHtml(
      {
        ...data,
        ttdUserPng: role === 'user' ? data.ttdUserPng : preservedUserPng,
        ttdUserSignedAt: role === 'user' ? data.ttdUserSignedAt : preservedUserCaption,
      },
      docId,
      tglTtd,
      false,
      role,
    );
    if (legacyTable) {
      legacyTable.outerHTML = sanitizeSafeHtml(upgradedHtml);
      const newlyCreated = container.querySelector(targetSelector);
      if (newlyCreated) {
        newlyCreated.outerHTML = safeSlotHtml;
      }
      return;
    }
  }

  // Fallback jika naskah lama hanya memakai teks penanda
  const candidates = Array.from(container.querySelectorAll('div, p, td, span'));
  const markerEl = candidates.find((el) => {
    const text = el.textContent || '';
    const hasMarker =
      text.includes('[ Ditandatangani Secara Elektronik (TTE) ]') ||
      text.includes('[ Paraf Pengusul ]');
    if (!hasMarker) return false;
    return !Array.from(el.children).some((child) => {
      const childText = child.textContent || '';
      return (
        childText.includes('[ Ditandatangani Secara Elektronik (TTE) ]') ||
        childText.includes('[ Paraf Pengusul ]')
      );
    });
  });

  if (markerEl) {
    markerEl.outerHTML = safeSlotHtml;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.setAttribute('style', `margin-top:20px;text-align:${role === 'user' ? 'left' : 'right'};font-size:12px;`);
  wrapper.innerHTML = `<div style="display:inline-block;text-align:center;min-width:220px;">${safeSlotHtml}<div style="font-weight:700;text-decoration:underline;margin-top:4px;">${escapeHtml(signerDisplayName || 'Pejabat Penandatangan')}</div></div>`;
  container.appendChild(wrapper);
};

const buildA4DocumentHtml = (
  data: A4DocumentData,
  kategoriTemplate?: KategoriTemplateSurat,
  customBodyHtml?: string,
): string => {
  const nomorSurat = escapeHtml(data.nomorSurat || '...........................');
  const perihal = escapeHtml(data.perihal || '...........................');
  const lokasi = escapeHtml(
    [data.lokasiSpesifik, data.lokasiPenugasan].filter(Boolean).join(', ') ||
      '...........................'
  );
  const tglMulai = formatTanggalIndo(data.tanggalMulai);
  const tglSelesai = formatTanggalIndo(data.tanggalSelesai || data.tanggalMulai);
  const dasarDari = escapeHtml(data.dasarSuratDari || '...........................');
  const dasarNomor = escapeHtml(data.dasarSuratNomor || '...........................');
  const dasarTanggal = data.dasarSuratTanggal ? escapeHtml(data.dasarSuratTanggal) : '';
  const namaKepala = escapeHtml(data.namaKepala || 'Baharudin');

  const daftarPegawai =
    data.pegawaiDitugaskan && data.pegawaiDitugaskan.length > 0
      ? data.pegawaiDitugaskan
      : [
          {
            id: 'placeholder',
            nama: '...........................',
            nip: '...........................',
            unitKerja: (data.unitKerja || 'RBI') as Pegawai['unitKerja'],
            jabatan: '...........................',
            pangkatGolongan: '...........................',
          },
        ];

  const resolvedKategori = resolveKategoriTemplate(
    daftarPegawai.length,
    kategoriTemplate ?? data.kategoriTemplate,
  );

  // Biaya Perjalanan Dinas sesuai catatan revisi resmi atasan:
  // 1. Biaya dari DIPA BBPPMPV BMTI Tahun Anggaran ....
  // 2. Biaya dari Penyelenggara
  // 3. Lain-lain -> Perjalanan dinas dari .. / Akomodasi dari ..
  const teksBiaya = (() => {
    if (data.sumberBiaya === 'DIPA') {
      const yearMatch = /^(\d{4})-/.exec((data.tanggalMulai || '').trim());
      const tahun = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear() || 2026;
      return `Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada DIPA BBPPMPV BMTI Tahun Anggaran ${tahun}.`;
    }
    if (data.sumberBiaya === 'LAINNYA') {
      return `Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada pihak penyelenggara (akomodasi) dan DIPA BBPPMPV BMTI (perjalanan dinas).`;
    }
    return `Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada pihak penyelenggara sesuai dengan ketentuan yang berlaku.`;
  })();

  const kepadaSectionHtml = (() => {
    if (resolvedKategori === 'INDIVIDU') {
      const peg = daftarPegawai[0];
      return `
        <table class="spt-layout-table" width="100%" style="font-size:11pt;line-height:1.55;margin:6px 0 14px 0;width:100%;border-collapse:collapse;">
          <tr>
            <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
            <td width="185" style="width:185px;padding:2px 0;">nama</td>
            <td width="14" style="width:14px;padding:2px 0;">:</td>
            <td style="font-weight:700;padding:2px 0;">${escapeHtml(peg.nama)}</td>
          </tr>
          <tr>
            <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
            <td width="185" style="width:185px;padding:2px 0;letter-spacing:1.5px;">N I P</td>
            <td width="14" style="width:14px;padding:2px 0;">:</td>
            <td style="padding:2px 0;">${escapeHtml(peg.nip || '-')}</td>
          </tr>
          <tr>
            <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
            <td width="185" style="width:185px;padding:2px 0;">Pangkat dan Golongan</td>
            <td width="14" style="width:14px;padding:2px 0;">:</td>
            <td style="padding:2px 0;">${escapeHtml(peg.pangkatGolongan || 'Penata Tingkat I, III/d')}</td>
          </tr>
          <tr>
            <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
            <td width="185" style="width:185px;padding:2px 0;">jabatan</td>
            <td width="14" style="width:14px;padding:2px 0;">:</td>
            <td style="padding:2px 0;">${escapeHtml(peg.jabatan || 'Pranata Laboratorium Pendidikan Ahli Muda')}</td>
          </tr>
        </table>
      `;
    }

    if (resolvedKategori === 'BERDUA') {
      const pairPegawai = daftarPegawai.slice(0, 2);
      const pairRows = pairPegawai
        .map(
          (peg, idx) => `
          <table class="spt-layout-table" width="100%" style="font-size:11pt;line-height:1.5;margin:0 0 10px 0;border-collapse:collapse;width:100%;">
            <tr>
              <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
              <td width="22" style="width:22px;font-weight:700;padding:2px 0;">${idx + 1}.</td>
              <td width="170" style="width:170px;padding:2px 0;">nama</td>
              <td width="14" style="width:14px;padding:2px 0;">:</td>
              <td style="font-weight:700;padding:2px 0;">${escapeHtml(peg.nama)}</td>
            </tr>
            <tr>
              <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
              <td width="22" style="width:22px;">&nbsp;</td>
              <td width="170" style="width:170px;padding:2px 0;letter-spacing:1.5px;">N I P</td>
              <td width="14" style="width:14px;">:</td>
              <td style="padding:2px 0;">${escapeHtml(peg.nip || '-')}</td>
            </tr>
            <tr>
              <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
              <td width="22" style="width:22px;">&nbsp;</td>
              <td width="170" style="width:170px;padding:2px 0;">Pangkat dan Golongan</td>
              <td width="14" style="width:14px;">:</td>
              <td style="padding:2px 0;">${escapeHtml(peg.pangkatGolongan || 'Penata Tingkat I, III/d')}</td>
            </tr>
            <tr>
              <td width="28" style="width:28px;padding:2px 0;">&nbsp;</td>
              <td width="22" style="width:22px;">&nbsp;</td>
              <td width="170" style="width:170px;padding:2px 0;">jabatan</td>
              <td width="14" style="width:14px;">:</td>
              <td style="padding:2px 0;">${escapeHtml(peg.jabatan || 'Pelaksana Teknis')}</td>
            </tr>
          </table>
        `
        )
        .join('');

      return `<div style="margin:6px 0 14px 0;">${pairRows}</div>`;
    }

    // Kelompok (Tim)
    const rowsHtml = daftarPegawai
      .map(
        (peg, idx) => `
        <tr>
          <td style="text-align:center;font-weight:700;border:1px solid #334155;padding:6px;">${idx + 1}</td>
          <td style="font-weight:700;border:1px solid #334155;padding:6px;">${escapeHtml(peg.nama)}</td>
          <td style="text-align:center;border:1px solid #334155;padding:6px;">${escapeHtml(peg.nip)}</td>
          <td style="text-align:center;border:1px solid #334155;padding:6px;">${escapeHtml(peg.pangkatGolongan || 'Penata Tingkat I, III/d')}</td>
          <td style="border:1px solid #334155;padding:6px;">${escapeHtml(peg.jabatan || 'Pelaksana Teknis')}</td>
        </tr>`
      )
      .join('');

    return `
      <table class="spt-data-table" style="width:100%;border-collapse:collapse;margin:10px 0 16px 0;font-size:10pt;">
        <thead>
          <tr>
            <th style="width:32px;border:1px solid #334155;padding:6px;background:#f8fafc;">No</th>
            <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">Nama Pegawai &amp; Gelar</th>
            <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">NIP</th>
            <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">Pangkat / Golongan</th>
            <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">Jabatan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  })();

  const kopSuratHtml = `
    <div class="spt-kop-kemendikdasmen" style="margin-bottom:18px;">
      <img src="${import.meta.env.BASE_URL}kop-kemendikdasmen.png" alt="Kementerian Pendidikan Dasar dan Menengah - BBPPMPV BMTI" style="width:100%;height:auto;display:block;" />
    </div>
  `;

  if (customBodyHtml) {
    return `<div style="font-family:'Bookman Old Style','URW Bookman','Bookman',serif;color:#0f172a;font-size:11pt;line-height:1.5;">${kopSuratHtml}<div style="line-height:1.65;">${customBodyHtml}</div></div>`;
  }

  const tanggalDiselenggarakan =
    tglSelesai && tglSelesai !== tglMulai
      ? `tanggal ${tglMulai} sampai dengan tanggal ${tglSelesai}`
      : `tanggal ${tglMulai}`;

  const hasDasarInput = Boolean(data.dasarSuratDari || data.dasarSuratNomor || data.dasarSuratTanggal);
  const dasarSuratText = hasDasarInput
    ? `Tugas ini diberikan berdasarkan surat dari ${dasarDari} nomor: ${dasarNomor}${dasarTanggal ? `, tanggal ${dasarTanggal}` : ''}.`
    : `Tugas ini diberikan berdasarkan surat dari ........................... nomor: ..........................., tanggal ............................`;

  return `
    <div style="font-family:'Bookman Old Style','URW Bookman','Bookman',serif;color:#0f172a;font-size:11pt;line-height:1.5;">
      ${kopSuratHtml}

      <div style="text-align:center;margin:18px 0 22px 0;">
        <div style="font-size:14pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;">SURAT TUGAS</div>
        <div id="a4-doc-nomor-surat" style="font-size:11pt;margin-top:4px;">Nomor ${nomorSurat}</div>
      </div>

      <div style="text-align:justify;line-height:1.65;margin-bottom:10px;">
        Kepala Balai Besar Pengembangan Penjaminan Mutu Pendidikan Vokasi Bidang Mesin dan Teknik Industri (BBPPMPV BMTI) menugasi
      </div>

      ${kepadaSectionHtml}

      <div style="text-align:justify;line-height:1.65;margin-bottom:12px;">
        sebagai ${perihal}. Kegiatan akan diselenggarakan pada ${tanggalDiselenggarakan} di ${lokasi}. ${dasarSuratText}
      </div>

      <div style="text-align:justify;line-height:1.65;margin-bottom:14px;">
        ${teksBiaya}
      </div>

      <div style="text-align:justify;line-height:1.65;margin-bottom:28px;">
        Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan yang bersangkutan diharapkan membuat laporan.
      </div>

      <!-- Bagian Pejabat Penandatangan Resmi (Tanpa TTD Sesuai Revisi Atasan) -->
      <table class="spt-layout-table" width="100%" style="width:100%;border-collapse:collapse;margin-top:24px;">
        <tr>
          <td width="58%" style="width:58%;">&nbsp;</td>
          <td width="42%" style="width:42%;text-align:left;line-height:1.5;">
            <div>${tglMulai}</div>
            <div style="margin-top:2px;">Kepala,</div>
            <div style="height:55px;">&nbsp;</div>
            <div style="font-weight:700;">${namaKepala}</div>
          </td>
        </tr>
      </table>

      <!-- Catatan Kaki BSrE Resmi (Format Banner Resmi Dokumen) -->
      <div style="margin-top:40px;">
        <img src="${import.meta.env.BASE_URL}footer-bsre.jpg" alt="Catatan Kaki BSrE UU ITE" style="width:100%;height:auto;display:block;" />
      </div>
    </div>
  `;
};

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

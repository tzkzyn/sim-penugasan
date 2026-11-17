import type { KategoriTemplateSurat, Pegawai } from '@/types';
import { resolveKategoriTemplate } from '@/utils/penugasanHelpers';

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

const VALID_SIGNATURE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/i;

export const isValidSignatureDataUrl = (value?: string): value is string =>
  Boolean(value && VALID_SIGNATURE_DATA_URL_RE.test(value.trim()));

export const escapeHtml = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const sanitizeSafeHtml = (rawHtml: string): string => {
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

export const formatTanggalIndo = (tglStr?: string): string => {
  if (!tglStr) return '....................';
  try {
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

export const looksLikeHtmlDocument = (content: string): boolean => {
  const trimmed = content.trim();
  return trimmed.includes('<table') || trimmed.includes('<div') || trimmed.includes('<p');
};

export const formatSignatureTimestamp = (date: Date): string =>
  date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const buildSignatureSlotHtml = (
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

export const buildDualSignatureBlockHtml = (
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

export const prepareDocumentSignatureSlotsHtml = (
  html: string,
  data: A4DocumentData,
  editableRole: SignatureRole,
): string => {
  if (!html) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

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
        const cleanedStyle = currentStyle.replace(/cursor\s*:\s*[^;]+;?/gi, '').trim();
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

export interface ExtractedSignatures {
  userPng?: string;
  userSignedAt?: string;
  approvalPng?: string;
  approvalSignedAt?: string;
}

export const extractSignaturesFromHtml = (html?: string): ExtractedSignatures => {
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

export const enforceSignatureIntegrityHtml = (
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

    const ownSlot = doc.querySelector(`#a4-signature-slot-${allowedRole}, [data-sig-role="${allowedRole}"]`);
    if (ownSlot) {
      ownSlot.setAttribute('contenteditable', 'false');
    }

    return doc.body.innerHTML;
  } catch {
    return clean;
  }
};

export const applySignatureSlotToDom = (
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

export const buildA4DocumentHtml = (
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

  const teksBiaya = (() => {
    if (data.sumberBiaya === 'DIPA') {
      const yearMatch = /^(\d{4})-/.exec((data.tanggalMulai || '').trim());
      const tahun = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear() || 2026;
      return `Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada DIPA BBPPMPV BMTI Tahun Anggaran ${tahun}.`;
    }
    if (data.sumberBiaya === 'LAINNYA') {
      return 'Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada pihak penyelenggara (akomodasi) dan DIPA BBPPMPV BMTI (perjalanan dinas).';
    }
    return 'Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada pihak penyelenggara sesuai dengan ketentuan yang berlaku.';
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
    : 'Tugas ini diberikan berdasarkan surat dari ........................... nomor: ..........................., tanggal ............................';

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

      <div style="margin-top:40px;">
        <img src="${import.meta.env.BASE_URL}footer-bsre.jpg" alt="Catatan Kaki BSrE UU ITE" style="width:100%;height:auto;display:block;" />
      </div>
    </div>
  `;
};


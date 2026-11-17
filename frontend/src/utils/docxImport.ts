import type {
  KategoriTemplateSurat,
  Pegawai,
  TemplatePrefillData,
  TemplateSuratResmi,
} from '@/types';
import { resolveKategoriTemplate } from '@/utils/penugasanHelpers';

const escapeHtml = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatTanggalIndoLocal = (tglStr?: string): string => {
  if (!tglStr) return '';
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
};

interface ZipFileEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const findEocdOffset = (bytes: Uint8Array): number => {
  const minOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      return i;
    }
  }
  return -1;
};

const readZipEntries = async (buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> => {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const map = new Map<string, Uint8Array>();

  const eocdOffset = findEocdOffset(bytes);
  if (eocdOffset < 0) {
    throw new Error('Berkas bukan arsip .docx yang valid.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);
  const entries: ZipFileEntry[] = [];

  for (let i = 0; i < totalEntries; i++) {
    if (cdOffset + 46 > bytes.length) break;
    const sig = view.getUint32(cdOffset, true);
    if (sig !== 0x02014b50) break;

    const method = view.getUint16(cdOffset + 10, true);
    const compressedSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);
    const name = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));

    entries.push({ name, method, compressedSize, localHeaderOffset });
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }

  for (const entry of entries) {
    const lh = entry.localHeaderOffset;
    if (lh + 30 > bytes.length) continue;
    if (view.getUint32(lh, true) !== 0x04034b50) continue;

    const lhNameLen = view.getUint16(lh + 26, true);
    const lhExtraLen = view.getUint16(lh + 28, true);
    const dataStart = lh + 30 + lhNameLen + lhExtraLen;
    const dataEnd = Math.min(bytes.length, dataStart + entry.compressedSize);
    const slice = bytes.subarray(dataStart, dataEnd);

    if (entry.method === 0) {
      map.set(entry.name, slice);
    } else if (entry.method === 8) {
      if (typeof DecompressionStream === 'undefined') {
        throw new Error('Browser tidak mendukung DecompressionStream untuk membaca .docx terkompresi.');
      }
      const rawBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer;
      const stream = new Blob([rawBuffer]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const decompressed = await new Response(stream).arrayBuffer();
      map.set(entry.name, new Uint8Array(decompressed));
    }
  }

  return map;
};

const getChildElementsByLocalName = (parent: Element, localName: string): Element[] =>
  Array.from(parent.children).filter((child) => child.localName === localName);

const getFirstChildByLocalName = (parent: Element | null, localName: string): Element | null => {
  if (!parent) return null;
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].localName === localName) return parent.children[i];
  }
  return null;
};

const getAttrLocal = (el: Element | null, attrLocalName: string): string => {
  if (!el) return '';
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.localName === attrLocalName || attr.name.endsWith(`:${attrLocalName}`)) {
      return attr.value;
    }
  }
  return '';
};

const extractRunHtml = (rEl: Element): string => {
  const rPr = getFirstChildByLocalName(rEl, 'rPr');
  const isBold = Boolean(getFirstChildByLocalName(rPr, 'b'));
  const isItalic = Boolean(getFirstChildByLocalName(rPr, 'i'));
  const uEl = getFirstChildByLocalName(rPr, 'u');
  const isUnderline = Boolean(uEl && getAttrLocal(uEl, 'val') !== 'none');

  let content = '';
  Array.from(rEl.children).forEach((child) => {
    if (child.localName === 't') {
      content += escapeHtml(child.textContent || '');
    } else if (child.localName === 'tab') {
      content += '&nbsp;&nbsp;&nbsp;&nbsp;';
    } else if (child.localName === 'br') {
      content += '<br/>';
    }
  });

  if (!content) return '';
  if (isBold) content = `<strong>${content}</strong>`;
  if (isItalic) content = `<em>${content}</em>`;
  if (isUnderline) content = `<u>${content}</u>`;
  return content;
};

const extractParagraphHtml = (pEl: Element): { html: string; text: string } => {
  const pPr = getFirstChildByLocalName(pEl, 'pPr');
  const jcEl = getFirstChildByLocalName(pPr, 'jc');
  const rawJc = getAttrLocal(jcEl, 'val').toLowerCase();
  const textAlign =
    rawJc === 'center'
      ? 'center'
      : rawJc === 'right'
        ? 'right'
        : rawJc === 'both'
          ? 'justify'
          : 'left';

  let innerHtml = '';
  let plainText = '';

  Array.from(pEl.children).forEach((child) => {
    if (child.localName === 'r') {
      innerHtml += extractRunHtml(child);
      plainText += child.textContent || '';
    } else if (child.localName === 'hyperlink') {
      getChildElementsByLocalName(child, 'r').forEach((r) => {
        innerHtml += extractRunHtml(r);
        plainText += r.textContent || '';
      });
    }
  });

  const trimmedText = plainText.replace(/\u00a0/g, ' ').trim();
  if (!trimmedText) {
    return { html: '', text: '' };
  }

  const isTitle = trimmedText.toUpperCase() === 'SURAT TUGAS';
  const fontSizeStyle = isTitle ? 'font-size:14pt;font-weight:700;letter-spacing:1px;' : 'font-size:11pt;';
  const marginStyle = isTitle ? 'margin:14px 0 4px 0;' : 'margin:0 0 10px 0;';

  return {
    html: `<div style="text-align:${textAlign};line-height:1.6;${fontSizeStyle}${marginStyle}">${innerHtml}</div>`,
    text: trimmedText,
  };
};

const extractTableHtml = (tblEl: Element): { html: string; text: string } => {
  const tblPr = getFirstChildByLocalName(tblEl, 'tblPr');
  const tblBorders = getFirstChildByLocalName(tblPr, 'tblBorders');
  let hasBorder = false;
  if (tblBorders) {
    Array.from(tblBorders.children).forEach((side) => {
      const val = getAttrLocal(side, 'val').toLowerCase();
      if (val && val !== 'none' && val !== 'nil') {
        hasBorder = true;
      }
    });
  }

  const rows = getChildElementsByLocalName(tblEl, 'tr');
  if (rows.length === 0) return { html: '', text: '' };

  let fullText = '';
  const rowsHtml = rows
    .map((trEl, rowIdx) => {
      const cells = getChildElementsByLocalName(trEl, 'tc');
      const cellsHtml = cells
        .map((tcEl) => {
          const cellParagraphs = getChildElementsByLocalName(tcEl, 'p');
          const cellHtmlParts: string[] = [];
          cellParagraphs.forEach((p) => {
            const pRes = extractParagraphHtml(p);
            if (pRes.text) {
              fullText += `${pRes.text} `;
              cellHtmlParts.push(`<div>${pRes.html.replace(/^<div[^>]*>|<\/div>$/g, '')}</div>`);
            }
          });
          const cellInner = cellHtmlParts.length > 0 ? cellHtmlParts.join('') : '&nbsp;';
          if (hasBorder) {
            const isHeader = rowIdx === 0;
            const tag = isHeader ? 'th' : 'td';
            const bg = isHeader ? 'background:#f8fafc;font-weight:700;' : '';
            return `<${tag} style="border:1px solid #334155;padding:6px;${bg}">${cellInner}</${tag}>`;
          }
          return `<td style="padding:2px 6px 2px 0;vertical-align:top;">${cellInner}</td>`;
        })
        .join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .join('');

  if (!fullText.trim()) return { html: '', text: '' };

  const tableClass = hasBorder ? 'spt-data-table' : 'spt-layout-table';
  const tableStyle = hasBorder
    ? 'width:100%;border-collapse:collapse;margin:10px 0 16px 0;font-size:10pt;'
    : 'width:100%;border-collapse:collapse;margin:6px 0 14px 0;font-size:11pt;line-height:1.5;';

  return {
    html: `<table class="${tableClass}" width="100%" style="${tableStyle}">${rowsHtml}</table>`,
    text: fullText.trim(),
  };
};

const detectPrefillFromLines = (lines: string[]): TemplatePrefillData => {
  const joined = lines.join('\n');
  const prefill: TemplatePrefillData = {};

  const nomorMatch = /(?:^|\n)\s*Nomor\s*:?\s*([^\n]+)/i.exec(joined);
  if (nomorMatch && !nomorMatch[1].includes('...')) {
    prefill.nomorSurat = nomorMatch[1].trim();
  }

  const namaMatch = /(?:^|\n)\s*nama\s*:\s*([^\n]+)/i.exec(joined);
  if (namaMatch && !namaMatch[1].includes('...')) {
    prefill.namaPegawai = namaMatch[1].trim();
  }

  const nipMatch = /(?:^|\n)\s*N\s*I\s*P\s*:\s*([^\n]+)/i.exec(joined);
  if (nipMatch && !nipMatch[1].includes('...')) {
    prefill.nip = nipMatch[1].trim();
  }

  const pangkatMatch = /(?:^|\n)\s*Pangkat\s+dan\s+Golongan\s*:\s*([^\n]+)/i.exec(joined);
  if (pangkatMatch && !pangkatMatch[1].includes('...')) {
    prefill.pangkatGolongan = pangkatMatch[1].trim();
  }

  const jabatanMatch = /(?:^|\n)\s*jabatan\s*:\s*([^\n]+)/i.exec(joined);
  if (jabatanMatch && !jabatanMatch[1].includes('...')) {
    prefill.jabatan = jabatanMatch[1].trim();
  }

  const perihalMatch = /sebagai\s+([^.\n]+?)(?:\.|\s+Kegiatan\s+akan)/i.exec(joined);
  if (perihalMatch && !perihalMatch[1].includes('...')) {
    prefill.perihal = perihalMatch[1].trim();
  }

  const lokasiMatch = /diselenggarakan\s+pada\s+tanggal\s+[^\n]+?\s+di\s+([^.\n]+)/i.exec(joined);
  if (lokasiMatch && !lokasiMatch[1].includes('...')) {
    prefill.lokasiSpesifik = lokasiMatch[1].trim();
  }

  const dasarMatch = /berdasarkan\s+surat\s+dari\s+([^\n]+?)\s+nomor\s*:\s*([^,\n]+?)(?:,\s*tanggal\s+([^.\n]+))?(?:\.|$)/i.exec(joined);
  if (dasarMatch) {
    if (dasarMatch[1] && !dasarMatch[1].includes('...')) prefill.dasarSuratDari = dasarMatch[1].trim();
    if (dasarMatch[2] && !dasarMatch[2].includes('...')) prefill.dasarSuratNomor = dasarMatch[2].trim();
    if (dasarMatch[3] && !dasarMatch[3].includes('...')) prefill.dasarSuratTanggal = dasarMatch[3].trim();
  }

  if (/DIPA\s+BBPPMPV/i.test(joined)) {
    prefill.sumberBiaya = 'DIPA';
  } else if (/akomodasi/i.test(joined)) {
    prefill.sumberBiaya = 'LAINNYA';
  }

  const kepalaMatch = /Kepala\s*,?\s*\n+\s*([^\n]+)/i.exec(joined);
  if (kepalaMatch && !kepalaMatch[1].includes('...')) {
    prefill.namaKepala = kepalaMatch[1].trim();
  }

  return prefill;
};

export interface ParsedDocxTemplateResult {
  kontenHtml: string;
  plainLines: string[];
  prefillData: TemplatePrefillData;
}

export const parseDocxFileToTemplate = async (file: File): Promise<ParsedDocxTemplateResult> => {
  if (!/\.docx$/i.test(file.name)) {
    throw new Error('Mohon unggah file berformat .docx (MS Word modern).');
  }

  const buffer = await file.arrayBuffer();
  const files = await readZipEntries(buffer);
  const docBytes = files.get('word/document.xml');
  if (!docBytes) {
    throw new Error('File .docx tidak memiliki word/document.xml yang valid.');
  }

  const xmlText = new TextDecoder().decode(docBytes);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  const body = xmlDoc.getElementsByTagNameNS('*', 'body')[0];
  if (!body) {
    throw new Error('Konten dokumen .docx kosong atau rusak.');
  }

  const htmlBlocks: string[] = [];
  const plainLines: string[] = [];

  Array.from(body.children).forEach((node) => {
    if (node.localName === 'p') {
      const { html, text } = extractParagraphHtml(node);
      if (html) {
        htmlBlocks.push(html);
        plainLines.push(text);
      }
    } else if (node.localName === 'tbl') {
      const { html, text } = extractTableHtml(node);
      if (html) {
        htmlBlocks.push(html);
        plainLines.push(text);
      }
    }
  });

  if (htmlBlocks.length === 0) {
    htmlBlocks.push(
      '<div style="text-align:center;margin:14px 0 20px 0;"><div style="font-size:14pt;font-weight:700;">SURAT TUGAS</div><div>Nomor {{NOMOR_SURAT}}</div></div>',
    );
  }

  return {
    kontenHtml: htmlBlocks.join('\n'),
    plainLines,
    prefillData: detectPrefillFromLines(plainLines),
  };
};

export interface TemplateSubstitutionData {
  nomorSurat?: string;
  perihal?: string;
  unitKerja?: string;
  kategoriTemplate?: KategoriTemplateSurat;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  lokasiPenugasan?: string;
  lokasiSpesifik?: string;
  dasarSuratDari?: string;
  dasarSuratNomor?: string;
  dasarSuratTanggal?: string;
  sumberBiaya?: 'PENYELENGGARA' | 'DIPA' | 'LAINNYA';
  namaKepala?: string;
  pegawaiDitugaskan: Pegawai[];
}

const buildPegawaiTableHtml = (
  pegawaiList: Pegawai[],
  kategori: KategoriTemplateSurat,
): string => {
  const list = pegawaiList.length > 0
    ? pegawaiList
    : [
        {
          id: 'placeholder',
          nama: '...........................',
          nip: '...........................',
          unitKerja: 'RBI' as const,
          jabatan: '...........................',
          pangkatGolongan: '...........................',
        },
      ];

  if (kategori === 'INDIVIDU') {
    const p = list[0];
    return `<table class="spt-layout-table" width="100%" style="font-size:11pt;line-height:1.55;margin:6px 0 14px 0;width:100%;border-collapse:collapse;">
      <tr><td width="28" style="width:28px;">&nbsp;</td><td width="185" style="width:185px;">nama</td><td width="14" style="width:14px;">:</td><td style="font-weight:700;">${escapeHtml(p.nama)}</td></tr>
      <tr><td width="28" style="width:28px;">&nbsp;</td><td width="185" style="width:185px;letter-spacing:1.5px;">N I P</td><td width="14" style="width:14px;">:</td><td>${escapeHtml(p.nip || '-')}</td></tr>
      <tr><td width="28" style="width:28px;">&nbsp;</td><td width="185" style="width:185px;">Pangkat dan Golongan</td><td width="14" style="width:14px;">:</td><td>${escapeHtml(p.pangkatGolongan || '-')}</td></tr>
      <tr><td width="28" style="width:28px;">&nbsp;</td><td width="185" style="width:185px;">jabatan</td><td width="14" style="width:14px;">:</td><td>${escapeHtml(p.jabatan || '-')}</td></tr>
    </table>`;
  }

  if (kategori === 'BERDUA') {
    return list
      .slice(0, 2)
      .map(
        (p, idx) => `<table class="spt-layout-table" width="100%" style="font-size:11pt;line-height:1.5;margin:0 0 10px 0;width:100%;border-collapse:collapse;">
          <tr><td width="28" style="width:28px;">&nbsp;</td><td width="22" style="width:22px;font-weight:700;">${idx + 1}.</td><td width="170" style="width:170px;">nama</td><td width="14" style="width:14px;">:</td><td style="font-weight:700;">${escapeHtml(p.nama)}</td></tr>
          <tr><td width="28" style="width:28px;">&nbsp;</td><td width="22" style="width:22px;">&nbsp;</td><td width="170" style="width:170px;letter-spacing:1.5px;">N I P</td><td width="14" style="width:14px;">:</td><td>${escapeHtml(p.nip || '-')}</td></tr>
          <tr><td width="28" style="width:28px;">&nbsp;</td><td width="22" style="width:22px;">&nbsp;</td><td width="170" style="width:170px;">Pangkat dan Golongan</td><td width="14" style="width:14px;">:</td><td>${escapeHtml(p.pangkatGolongan || '-')}</td></tr>
          <tr><td width="28" style="width:28px;">&nbsp;</td><td width="22" style="width:22px;">&nbsp;</td><td width="170" style="width:170px;">jabatan</td><td width="14" style="width:14px;">:</td><td>${escapeHtml(p.jabatan || '-')}</td></tr>
        </table>`,
      )
      .join('');
  }

  const rows = list
    .map(
      (p, idx) => `<tr>
        <td style="text-align:center;font-weight:700;border:1px solid #334155;padding:6px;">${idx + 1}</td>
        <td style="font-weight:700;border:1px solid #334155;padding:6px;">${escapeHtml(p.nama)}</td>
        <td style="text-align:center;border:1px solid #334155;padding:6px;">${escapeHtml(p.nip || '-')}</td>
        <td style="text-align:center;border:1px solid #334155;padding:6px;">${escapeHtml(p.pangkatGolongan || '-')}</td>
        <td style="border:1px solid #334155;padding:6px;">${escapeHtml(p.jabatan || '-')}</td>
      </tr>`,
    )
    .join('');

  return `<table class="spt-data-table" style="width:100%;border-collapse:collapse;margin:10px 0 16px 0;font-size:10pt;">
    <thead>
      <tr>
        <th style="width:32px;border:1px solid #334155;padding:6px;background:#f8fafc;">No</th>
        <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">Nama Pegawai &amp; Gelar</th>
        <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">NIP</th>
        <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">Pangkat / Golongan</th>
        <th style="border:1px solid #334155;padding:6px;background:#f8fafc;">Jabatan</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
};

const replacePlainTextInHtmlNodes = (html: string, fromText: string, toText: string): string => {
  if (!fromText || !toText || fromText === toText) return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent && node.textContent.includes(fromText)) {
        node.textContent = node.textContent.split(fromText).join(toText);
      }
      node = walker.nextNode();
    }
    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

export const renderApprovalTemplateHtml = (
  template: TemplateSuratResmi,
  data: TemplateSubstitutionData,
  baseUrl = '/',
): string => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const primaryPegawai = data.pegawaiDitugaskan[0];
  const kategori = resolveKategoriTemplate(
    data.pegawaiDitugaskan.length,
    data.kategoriTemplate ?? template.kategoriTemplate,
  );

  const tglMulai = formatTanggalIndoLocal(data.tanggalMulai) || template.prefillData?.tanggalMulai || '....................';
  const tglSelesai = formatTanggalIndoLocal(data.tanggalSelesai || data.tanggalMulai);
  const rentangTanggal =
    tglSelesai && tglSelesai !== tglMulai ? `${tglMulai} sampai dengan tanggal ${tglSelesai}` : tglMulai;

  const lokasi =
    [data.lokasiSpesifik, data.lokasiPenugasan].filter(Boolean).join(', ') ||
    template.prefillData?.lokasiSpesifik ||
    template.prefillData?.lokasiPenugasan ||
    '...........................';

  const dasarDari = data.dasarSuratDari || template.prefillData?.dasarSuratDari || '...........................';
  const dasarNomor = data.dasarSuratNomor || template.prefillData?.dasarSuratNomor || '...........................';
  const dasarTanggal = data.dasarSuratTanggal || template.prefillData?.dasarSuratTanggal || '';
  const dasarText = `Tugas ini diberikan berdasarkan surat dari ${dasarDari} nomor: ${dasarNomor}${
    dasarTanggal ? `, tanggal ${dasarTanggal}` : ''
  }.`;

  const biayaText = (() => {
    const mode = data.sumberBiaya ?? template.prefillData?.sumberBiaya ?? 'PENYELENGGARA';
    if (mode === 'DIPA') {
      const yr = /^(\d{4})-/.exec(data.tanggalMulai || '')?.[1] || '2026';
      return `Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada DIPA BBPPMPV BMTI Tahun Anggaran ${yr}.`;
    }
    if (mode === 'LAINNYA') {
      return 'Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada pihak penyelenggara (akomodasi) dan DIPA BBPPMPV BMTI (perjalanan dinas).';
    }
    return 'Seluruh biaya perjalanan dinas yang berkaitan dengan kegiatan tersebut dibebankan pada pihak penyelenggara sesuai dengan ketentuan yang berlaku.';
  })();

  let bodyHtml = template.kontenHtml;

  // 1. Substitusi variabel {{...}}
  const tokens: Record<string, string> = {
    '{{NOMOR_SURAT}}': escapeHtml(data.nomorSurat || template.prefillData?.nomorSurat || '...........................'),
    '{{NAMA_PEGAWAI}}': escapeHtml(primaryPegawai?.nama || template.prefillData?.namaPegawai || '...........................'),
    '{{NIP}}': escapeHtml(primaryPegawai?.nip || template.prefillData?.nip || '...........................'),
    '{{PANGKAT}}': escapeHtml(primaryPegawai?.pangkatGolongan || template.prefillData?.pangkatGolongan || '...........................'),
    '{{JABATAN}}': escapeHtml(primaryPegawai?.jabatan || template.prefillData?.jabatan || '...........................'),
    '{{TABEL_PEGAWAI}}': buildPegawaiTableHtml(data.pegawaiDitugaskan, kategori),
    '{{PERIHAL}}': escapeHtml(data.perihal || template.prefillData?.perihal || '...........................'),
    '{{TANGGAL}}': escapeHtml(rentangTanggal),
    '{{LOKASI}}': escapeHtml(lokasi),
    '{{DASAR_SURAT}}': escapeHtml(dasarText),
    '{{BIAYA}}': escapeHtml(biayaText),
    '{{NAMA_KEPALA}}': escapeHtml(data.namaKepala || template.prefillData?.namaKepala || 'Baharudin'),
  };

  Object.entries(tokens).forEach(([token, replacement]) => {
    if (bodyHtml.includes(token)) {
      bodyHtml = bodyHtml.split(token).join(replacement);
    }
  });

  // 2. Jika file .docx dari Approval sudah berisi nama/nomor/perihal statis tanpa token {{...}},
  //    otomatis perbarui nilainya saat User mengetik/memilih inputan baru di formulir!
  const prefill = template.prefillData;
  if (prefill) {
    if (prefill.nomorSurat && data.nomorSurat) {
      bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.nomorSurat, data.nomorSurat);
    }
    if (primaryPegawai) {
      if (prefill.namaPegawai) {
        bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.namaPegawai, primaryPegawai.nama);
      }
      if (prefill.nip && primaryPegawai.nip) {
        bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.nip, primaryPegawai.nip);
      }
      if (prefill.pangkatGolongan && primaryPegawai.pangkatGolongan) {
        bodyHtml = replacePlainTextInHtmlNodes(
          bodyHtml,
          prefill.pangkatGolongan,
          primaryPegawai.pangkatGolongan,
        );
      }
      if (prefill.jabatan && primaryPegawai.jabatan) {
        bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.jabatan, primaryPegawai.jabatan);
      }
    }
    if (prefill.perihal && data.perihal) {
      bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.perihal, data.perihal);
    }
    if (prefill.lokasiSpesifik && (data.lokasiSpesifik || data.lokasiPenugasan)) {
      bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.lokasiSpesifik, lokasi);
    }
    if (prefill.dasarSuratDari && data.dasarSuratDari) {
      bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.dasarSuratDari, data.dasarSuratDari);
    }
    if (prefill.dasarSuratNomor && data.dasarSuratNomor) {
      bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.dasarSuratNomor, data.dasarSuratNomor);
    }
    if (prefill.dasarSuratTanggal && data.dasarSuratTanggal) {
      bodyHtml = replacePlainTextInHtmlNodes(bodyHtml, prefill.dasarSuratTanggal, data.dasarSuratTanggal);
    }
  }

  const kopHtml = template.sertakanKopResmi
    ? `<div class="spt-kop-kemendikdasmen" style="margin-bottom:18px;">
         <img src="${normalizedBase}kop-kemendikdasmen.png" alt="Kementerian Pendidikan Dasar dan Menengah - BBPPMPV BMTI" style="width:100%;height:auto;display:block;" />
       </div>`
    : '';

  const footerHtml = template.sertakanKopResmi
    ? `<div style="margin-top:40px;">
         <img src="${normalizedBase}footer-bsre.jpg" alt="Catatan Kaki BSrE UU ITE" style="width:100%;height:auto;display:block;" />
       </div>`
    : '';

  return `<div style="font-family:'Bookman Old Style','URW Bookman','Bookman',serif;color:#0f172a;font-size:11pt;line-height:1.5;">
    ${kopHtml}
    ${bodyHtml}
    ${footerHtml}
  </div>`;
};


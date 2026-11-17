/**
 * Native pure-TypeScript OOXML (.docx) generator without external npm dependencies.
 * Builds a valid PKZIP (stored method 0 + CRC-32) containing WordprocessingML XML
 * and embedded Kop Surat + BSrE Footer media assets so exported files open natively
 * in Microsoft Word, LibreOffice Writer, and Google Docs with exact A4 layout.
 */

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const createZipBlob = (entries: ZipEntry[], mimeType: string): Blob => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const size = data.length;

    // Local File Header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // compression method: 0 (store)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x5421, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    // Central Directory Header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // compression method: 0
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk start
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // local header offset
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [...localParts, ...centralParts, eocd].map(
    (u8) => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer,
  );
  return new Blob(blobParts, { type: mimeType });
};

const escapeXml = (val: string): string =>
  val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  sz?: number; // half-points, e.g. 22 = 11pt
}

const buildRunXml = (text: string, style: RunStyle = {}): string => {
  const sz = style.sz ?? 22;
  const rPr = [
    `<w:rFonts w:ascii="Bookman Old Style" w:eastAsia="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Bookman Old Style"/>`,
    style.bold ? '<w:b/>' : '',
    style.italic ? '<w:i/>' : '',
    style.underline ? '<w:u w:val="single"/>' : '',
    `<w:sz w:val="${sz}"/>`,
    `<w:szCs w:val="${sz}"/>`,
  ]
    .filter(Boolean)
    .join('');

  return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
};

const extractInlineRuns = (node: Node, inherited: RunStyle = {}): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = (node.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
    if (!raw) return '';
    return buildRunXml(raw, inherited);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'br') {
    return '<w:r><w:br/></w:r>';
  }

  const inlineStyle = el.getAttribute('style') || '';
  const nextStyle: RunStyle = {
    ...inherited,
    bold:
      inherited.bold ||
      tag === 'strong' ||
      tag === 'b' ||
      /font-weight\s*:\s*(700|bold)/i.test(inlineStyle),
    italic:
      inherited.italic ||
      tag === 'em' ||
      tag === 'i' ||
      /font-style\s*:\s*italic/i.test(inlineStyle),
    underline:
      inherited.underline ||
      tag === 'u' ||
      /text-decoration[^;]*underline/i.test(inlineStyle),
  };

  let out = '';
  el.childNodes.forEach((child) => {
    out += extractInlineRuns(child, nextStyle);
  });
  return out;
};

const buildParagraphXml = (
  runsXml: string,
  options: {
    align?: 'left' | 'center' | 'right' | 'both';
    before?: number;
    after?: number;
    line?: number;
  } = {},
): string => {
  const jc = options.align ? `<w:jc w:val="${options.align}"/>` : '';
  const spacingParts = [
    options.before !== undefined ? `w:before="${options.before}"` : '',
    options.after !== undefined ? `w:after="${options.after}"` : 'w:after="120"',
    `w:line="${options.line ?? 312}"`,
    `w:lineRule="auto"`,
  ]
    .filter(Boolean)
    .join(' ');
  return `<w:p><w:pPr><w:spacing ${spacingParts}/>${jc}</w:pPr>${runsXml}</w:p>`;
};

const buildDrawingXml = (
  rId: string,
  docPrId: number,
  name: string,
  cx: number,
  cy: number,
): string =>
  `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${docPrId}" name="${escapeXml(name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${escapeXml(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;

const NONE_BORDERS_XML = `<w:tblBorders>
  <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
  <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
  <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
  <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
  <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
  <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
</w:tblBorders>`;

const GRID_BORDERS_XML = `<w:tblBorders>
  <w:top w:val="single" w:sz="6" w:space="0" w:color="334155"/>
  <w:left w:val="single" w:sz="6" w:space="0" w:color="334155"/>
  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="334155"/>
  <w:right w:val="single" w:sz="6" w:space="0" w:color="334155"/>
  <w:insideH w:val="single" w:sz="6" w:space="0" w:color="334155"/>
  <w:insideV w:val="single" w:sz="6" w:space="0" w:color="334155"/>
</w:tblBorders>`;

const convertLayoutTableToXml = (tableEl: HTMLTableElement): string => {
  const rows = Array.from(tableEl.querySelectorAll('tr'));
  if (rows.length === 0) return '';
  const firstColCount = rows[0].querySelectorAll('td, th').length;

  // Deteksi tabel Pejabat Penandatangan Kepala (2 kolom: spacer + blok kanan)
  const textContent = tableEl.textContent || '';
  if (firstColCount === 2 && /Kepala\s*,?/i.test(textContent)) {
    const rightCell = rows[0].querySelectorAll('td, th')[1];
    const lineDivs = rightCell ? Array.from(rightCell.children) : [];
    const linesXml =
      lineDivs.length > 0
        ? lineDivs
            .map((div, idx) => {
              const txt = (div.textContent || '').replace(/\u00a0/g, '').trim();
              if (!txt) {
                return buildParagraphXml('', { before: 480, after: 120, line: 240 });
              }
              const isBold =
                idx === lineDivs.length - 1 ||
                /font-weight\s*:\s*(700|bold)/i.test(div.getAttribute('style') || '');
              return buildParagraphXml(buildRunXml(txt, { bold: isBold, sz: 22 }), {
                align: 'left',
                before: 0,
                after: 40,
                line: 260,
              });
            })
            .join('')
        : buildParagraphXml(buildRunXml(textContent.trim(), { sz: 22 }));

    return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="9900" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        ${NONE_BORDERS_XML}
      </w:tblPr>
      <w:tblGrid><w:gridCol w:w="5700"/><w:gridCol w:w="4200"/></w:tblGrid>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="5700" w:type="dxa"/></w:tcPr>${buildParagraphXml('', { after: 0 })}</w:tc>
        <w:tc><w:tcPr><w:tcW w:w="4200" w:type="dxa"/></w:tcPr>${linesXml}</w:tc>
      </w:tr>
    </w:tbl>`;
  }

  // Tabel identitas pegawai (INDIVIDU: 4 kolom; BERDUA: 5 kolom)
  const colWidths =
    firstColCount === 5
      ? [360, 340, 2500, 220, 6480]
      : firstColCount === 4
        ? [360, 2680, 220, 6640]
        : firstColCount === 3
          ? [2700, 220, 6980]
          : Array.from({ length: firstColCount }, () => Math.floor(9900 / Math.max(1, firstColCount)));

  const gridColsXml = colWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join('');
  const rowsXml = rows
    .map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th'));
      const cellsXml = cells
        .map((cell, idx) => {
          const colW = colWidths[idx] ?? 2000;
          const styleAttr = cell.getAttribute('style') || '';
          const isBold = /font-weight\s*:\s*(700|bold)/i.test(styleAttr);
          const rawText = (cell.textContent || '').replace(/\u00a0/g, '').trim();
          const pXml = rawText
            ? buildParagraphXml(buildRunXml(rawText, { bold: isBold, sz: 22 }), {
                align: 'left',
                before: 0,
                after: 40,
                line: 276,
              })
            : buildParagraphXml('', { before: 0, after: 40, line: 276 });
          return `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/></w:tcPr>${pXml}</w:tc>`;
        })
        .join('');
      return `<w:tr>${cellsXml}</w:tr>`;
    })
    .join('');

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="9900" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      ${NONE_BORDERS_XML}
    </w:tblPr>
    <w:tblGrid>${gridColsXml}</w:tblGrid>
    ${rowsXml}
  </w:tbl>`;
};

const convertDataTableToXml = (tableEl: HTMLTableElement): string => {
  const rows = Array.from(tableEl.querySelectorAll('tr'));
  if (rows.length === 0) return '';
  const colCount = rows[0].querySelectorAll('th, td').length;
  const colWidths =
    colCount === 5
      ? [550, 2550, 2100, 2100, 2600]
      : Array.from({ length: colCount }, () => Math.floor(9900 / Math.max(1, colCount)));

  const gridColsXml = colWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join('');
  const rowsXml = rows
    .map((tr, rIdx) => {
      const cells = Array.from(tr.querySelectorAll('th, td'));
      const isHeader = rIdx === 0 || tr.parentElement?.tagName.toLowerCase() === 'thead';
      const cellsXml = cells
        .map((cell, cIdx) => {
          const colW = colWidths[cIdx] ?? 1800;
          const styleAttr = cell.getAttribute('style') || '';
          const alignMatch = /text-align\s*:\s*(center|right|left)/i.exec(styleAttr);
          const align = isHeader
            ? 'center'
            : ((alignMatch?.[1]?.toLowerCase() as 'center' | 'right' | 'left') || 'left');
          const isBold = isHeader || /font-weight\s*:\s*(700|bold)/i.test(styleAttr);
          const txt = (cell.textContent || '').replace(/\u00a0/g, ' ').trim();
          const pXml = buildParagraphXml(buildRunXml(txt, { bold: isBold, sz: 20 }), {
            align,
            before: 40,
            after: 40,
            line: 240,
          });
          const shd = isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>' : '';
          return `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/>${shd}<w:tcMar><w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar></w:tcPr>${pXml}</w:tc>`;
        })
        .join('');
      return `<w:tr>${cellsXml}</w:tr>`;
    })
    .join('');

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="9900" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      ${GRID_BORDERS_XML}
    </w:tblPr>
    <w:tblGrid>${gridColsXml}</w:tblGrid>
    ${rowsXml}
  </w:tbl>`;
};

const convertDomChildrenToBodyXml = (container: Element, kopRId: string): string => {
  const parts: string[] = [];
  let hasPlacedKop = false;

  const walkNode = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const className = el.getAttribute('class') || '';
    const styleAttr = el.getAttribute('style') || '';

    // 1. Kop Surat Kemendikdasmen -> taruh sebagai gambar proporsional penuh lebar A4 (6286500 x 878074 EMU)
    if (
      className.includes('spt-kop-kemendikdasmen') ||
      el.querySelector('img[src*="kop-kemendikdasmen"]')
    ) {
      if (!hasPlacedKop) {
        hasPlacedKop = true;
        parts.push(
          buildParagraphXml(buildDrawingXml(kopRId, 1, 'Kop Surat Kemendikdasmen', 6286500, 878074), {
            align: 'center',
            before: 0,
            after: 180,
            line: 240,
          }),
        );
      }
      return;
    }

    // 2. Footer BSrE -> sudah ditempatkan di word/footer1.xml agar rapi di dasar halaman
    if (el.querySelector('img[src*="footer-bsre"]') || el.getAttribute('src')?.includes('footer-bsre')) {
      return;
    }

    // 3. Tabel data kelompok atau tabel layout
    if (tag === 'table') {
      if (className.includes('spt-data-table')) {
        parts.push(convertDataTableToXml(el as HTMLTableElement));
        parts.push(buildParagraphXml('', { before: 0, after: 100, line: 240 }));
      } else {
        parts.push(convertLayoutTableToXml(el as HTMLTableElement));
        parts.push(buildParagraphXml('', { before: 0, after: 80, line: 240 }));
      }
      return;
    }

    // 4. Container div yang membungkus banyak tabel (misalnya format BERDUA) atau blok judul SURAT TUGAS
    const nestedTables = el.querySelectorAll('table');
    if (nestedTables.length > 0 && tag !== 'p') {
      Array.from(el.children).forEach((child) => walkNode(child));
      return;
    }

    // 5. Blok Judul (SURAT TUGAS / Nomor ...)
    if (/text-align\s*:\s*center/i.test(styleAttr) && el.children.length > 0) {
      Array.from(el.children).forEach((child) => {
        const childText = (child.textContent || '').replace(/\u00a0/g, ' ').trim();
        if (!childText) return;
        const isTitle = childText.toUpperCase() === 'SURAT TUGAS';
        parts.push(
          buildParagraphXml(
            buildRunXml(childText, { bold: isTitle, sz: isTitle ? 28 : 22 }),
            {
              align: 'center',
              before: isTitle ? 120 : 20,
              after: isTitle ? 40 : 240,
              line: 260,
            },
          ),
        );
      });
      return;
    }

    // 6. Paragraf / blok teks biasa
    const runsXml = extractInlineRuns(el, { sz: 22 });
    if (runsXml.trim()) {
      const alignMatch = /text-align\s*:\s*(justify|center|right|left)/i.exec(styleAttr);
      const rawAlign = alignMatch?.[1]?.toLowerCase();
      const align: 'left' | 'center' | 'right' | 'both' =
        rawAlign === 'justify'
          ? 'both'
          : rawAlign === 'center' || rawAlign === 'right'
            ? rawAlign
            : 'both';
      parts.push(buildParagraphXml(runsXml, { align, before: 0, after: 140, line: 312 }));
    }
  };

  const rootChildren =
    container.children.length === 1 && container.firstElementChild?.tagName.toLowerCase() === 'div'
      ? Array.from(container.firstElementChild.children)
      : Array.from(container.children);

  rootChildren.forEach((child) => walkNode(child));

  if (!hasPlacedKop) {
    parts.unshift(
      buildParagraphXml(buildDrawingXml(kopRId, 1, 'Kop Surat Kemendikdasmen', 6286500, 878074), {
        align: 'center',
        before: 0,
        after: 180,
        line: 240,
      }),
    );
  }

  return parts.join('');
};

const fetchAssetBytes = async (url: string, fallbackImg?: HTMLImageElement): Promise<Uint8Array> => {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
  } catch {
    // Fallback to canvas extraction from already-loaded image element
  }

  if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
    const canvas = document.createElement('canvas');
    canvas.width = fallbackImg.naturalWidth;
    canvas.height = fallbackImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(fallbackImg, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1] || '';
      const bin = atob(base64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
  }

  return new Uint8Array(0);
};

export interface ExportDocxOptions {
  editorContainer: HTMLElement;
  filename: string;
  baseUrl: string;
}

export const exportEditorToDocx = async ({
  editorContainer,
  filename,
  baseUrl,
}: ExportDocxOptions): Promise<void> => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const liveImgs = Array.from(editorContainer.querySelectorAll('img'));
  const liveKop = liveImgs.find((i) => i.src.includes('kop-kemendikdasmen'));
  const liveFooter = liveImgs.find((i) => i.src.includes('footer-bsre'));

  const [kopBytes, footerBytes] = await Promise.all([
    fetchAssetBytes(`${normalizedBase}kop-kemendikdasmen.png`, liveKop),
    fetchAssetBytes(`${normalizedBase}footer-bsre.jpg`, liveFooter),
  ]);

  const kopExt = kopBytes.length > 0 ? 'png' : 'png';
  const footerExt = footerBytes[0] === 0x89 && footerBytes[1] === 0x50 ? 'png' : 'jpg';

  const bodyContentXml = convertDomChildrenToBodyXml(editorContainer, 'rIdKop');

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rIdKop" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.${kopExt}"/>
</Relationships>`;

  const footerRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdFooterImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.${footerExt}"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Bookman Old Style" w:eastAsia="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Bookman Old Style"/>
        <w:color w:val="0F172A"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  ${
    footerBytes.length > 0
      ? buildParagraphXml(
          buildDrawingXml('rIdFooterImg', 2, 'Catatan Kaki BSrE', 6286500, 400462),
          { align: 'center', before: 0, after: 0, line: 240 },
        )
      : buildParagraphXml('', { after: 0 })
  }
</w:ftr>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${bodyContentXml}
    <w:sectPr>
      <w:footerReference w:type="default" r:id="rIdFooter1"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="680" w:right="1003" w:bottom="1100" w:left="1003" w:header="450" w:footer="450" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const te = new TextEncoder();
  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: te.encode(contentTypesXml) },
    { name: '_rels/.rels', data: te.encode(rootRelsXml) },
    { name: 'word/document.xml', data: te.encode(documentXml) },
    { name: 'word/_rels/document.xml.rels', data: te.encode(docRelsXml) },
    { name: 'word/footer1.xml', data: te.encode(footerXml) },
    { name: 'word/_rels/footer1.xml.rels', data: te.encode(footerRelsXml) },
    { name: 'word/styles.xml', data: te.encode(stylesXml) },
  ];

  if (kopBytes.length > 0) {
    entries.push({ name: `word/media/image1.${kopExt}`, data: kopBytes });
  }
  if (footerBytes.length > 0) {
    entries.push({ name: `word/media/image2.${footerExt}`, data: footerBytes });
  }

  const blob = createZipBlob(
    entries,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const cleanName = filename.replace(/\.docx?$/i, '');
  anchor.href = url;
  anchor.download = `${cleanName}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};


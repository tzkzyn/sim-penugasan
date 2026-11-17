import type {
  AjuanSuratTugas,
  Pegawai,
  StatusSuratTugas,
  TemplateSuratResmi,
  UnitKerjaType,
} from '@/types';
import { dummyAjuanSuratTugas, dummyPegawaiList } from '@/data/dummyData';
import { DEFAULT_STARTER_TEMPLATE_HTML } from '@/utils/docxImport';

export const TEMPLATE_STORAGE_KEY = 'sim_penugasan_approval_templates';

export const isPegawaiMatch = (target: Pegawai | undefined, currentUser: Pegawai | null): boolean => {
  if (!target || !currentUser) return false;

  const targetNama = (target.nama || '').trim().toLowerCase();
  const currentNama = (currentUser.nama || '').trim().toLowerCase();
  const targetUsername = (target.username || '').trim().toLowerCase();
  const currentUsername = (currentUser.username || '').trim().toLowerCase();

  // Cegah data tugas lama yang sempat memakai id 'peg-01' untuk non-Taryadi bocor ke user lain / Taryadi
  const isLegacyCorruptedPeg01 = target.id === 'peg-01' && targetNama !== 'taryadi';
  if (isLegacyCorruptedPeg01) {
    const matchByUsername = Boolean(targetUsername && currentUsername && targetUsername === currentUsername);
    const matchByNama = Boolean(targetNama && currentNama && targetNama === currentNama);
    return matchByUsername || matchByNama;
  }

  if (target.id && currentUser.id && target.id === currentUser.id) return true;

  const targetNip = (target.nip || '').trim();
  const currentNip = (currentUser.nip || '').trim();
  if (targetNip && currentNip && targetNip !== '-' && targetNip === currentNip) return true;

  if (targetUsername && currentUsername && targetUsername === currentUsername) return true;
  if (targetNama && currentNama && targetNama === currentNama) return true;

  return false;
};

export const normalizeTaskRecord = (raw: unknown): AjuanSuratTugas | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const rec = raw as Partial<AjuanSuratTugas> & Record<string, unknown>;
  const id = typeof rec.id === 'string' ? rec.id : typeof rec.id === 'number' ? String(rec.id) : '';
  const perihal = typeof rec.perihal === 'string' ? rec.perihal : 'Penugasan';
  if (!id || id.startsWith('TUGAS-TEST') || id.startsWith('TUGAS-REJECT')) return null;
  if (perihal.includes('Uji Coba') || perihal.includes('Test')) return null;

  const fallbackPengaju = dummyPegawaiList[0];
  const rawPengaju = rec.pengaju && typeof rec.pengaju === 'object' ? (rec.pengaju as Pegawai) : fallbackPengaju;
  const pegawaiDitugaskan = Array.isArray(rec.pegawaiDitugaskan)
    ? rec.pegawaiDitugaskan.filter((p): p is Pegawai => Boolean(p && typeof p === 'object'))
    : [];
  const workflow = Array.isArray(rec.workflow)
    ? rec.workflow.filter((w) => Boolean(w && typeof w === 'object'))
    : [];
  const koordinat: [number, number] =
    Array.isArray(rec.koordinat) &&
    rec.koordinat.length === 2 &&
    typeof rec.koordinat[0] === 'number' &&
    typeof rec.koordinat[1] === 'number'
      ? [rec.koordinat[0], rec.koordinat[1]]
      : [-6.9147, 107.6098];

  return {
    ...rec,
    id,
    nomorSurat: typeof rec.nomorSurat === 'string' ? rec.nomorSurat : '-',
    perihal,
    pengaju: rawPengaju,
    pegawaiDitugaskan,
    unitKerja: (typeof rec.unitKerja === 'string' && rec.unitKerja ? rec.unitKerja : 'RBI') as UnitKerjaType,
    tanggalMulai: typeof rec.tanggalMulai === 'string' ? rec.tanggalMulai : '',
    tanggalSelesai: typeof rec.tanggalSelesai === 'string' ? rec.tanggalSelesai : '',
    lokasiPenugasan: typeof rec.lokasiPenugasan === 'string' ? rec.lokasiPenugasan : '',
    deskripsi: typeof rec.deskripsi === 'string' ? rec.deskripsi : '',
    koordinat,
    status: (typeof rec.status === 'string' && rec.status ? rec.status : 'DRAFT') as StatusSuratTugas,
    workflow,
  };
};

export const normalizeTaskList = (rawList: unknown): AjuanSuratTugas[] => {
  if (!Array.isArray(rawList)) return dummyAjuanSuratTugas;
  return rawList.map(normalizeTaskRecord).filter((t): t is AjuanSuratTugas => t !== null);
};

export const normalizeTemplateList = (rawList: unknown): TemplateSuratResmi[] => {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((item): item is TemplateSuratResmi => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const rec = item as Partial<TemplateSuratResmi>;
      return typeof rec.id === 'string' && typeof rec.namaTemplate === 'string' && typeof rec.kontenHtml === 'string';
    })
    .map((item) => {
      const needsCleanHtml =
        !item.kontenHtml.trim() ||
        item.kontenHtml.includes('data:image/') ||
        !item.kontenHtml.includes('{{');
      return {
        ...item,
        hasFileDocx: Boolean(item.hasFileDocx || item.fileDocxDataUrl || item.fileNamaAsli),
        kontenHtml: needsCleanHtml ? DEFAULT_STARTER_TEMPLATE_HTML : item.kontenHtml,
        sertakanKopResmi: needsCleanHtml ? true : item.sertakanKopResmi,
      };
    });
};


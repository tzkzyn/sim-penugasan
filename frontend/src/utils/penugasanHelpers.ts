import type { AjuanSuratTugas, KategoriTemplateSurat, Pegawai } from '@/types';

export const DEFAULT_JAM_MULAI = '08:00';
export const DEFAULT_JAM_SELESAI = '17:00';
export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export interface ScheduleConflict {
  pegawai: Pegawai;
  conflictingTask: AjuanSuratTugas;
  overlapStartDate: string;
  overlapEndDate: string;
  targetTimeRange: string;
  conflictTimeRange: string;
}

export interface PegawaiDinasStats {
  totalDinas: number;
  dinasMingguIni: number;
  dinasBulanIni: number;
}

export interface RekapMingguanBulanan {
  weekLabel: string;
  monthLabel: string;
  totalSurat: number;
  suratMingguIni: number;
  suratBulanIni: number;
  totalPenugasanOrangMingguIni: number;
  totalPenugasanOrangBulanIni: number;
  pegawaiRekap: Array<{
    pegawai: Pegawai;
    totalDinas: number;
    dinasMingguIni: number;
    dinasBulanIni: number;
  }>;
}

export const isSamePegawai = (a?: Pegawai | null, b?: Pegawai | null): boolean => {
  if (!a || !b) return false;
  const namaA = (a.nama || '').trim().toLowerCase();
  const namaB = (b.nama || '').trim().toLowerCase();
  const userA = (a.username || '').trim().toLowerCase();
  const userB = (b.username || '').trim().toLowerCase();

  // Cegah false match data lama peg-01 yang bukan Taryadi
  if ((a.id === 'peg-01' && namaA !== 'taryadi') || (b.id === 'peg-01' && namaB !== 'taryadi')) {
    return Boolean((userA && userB && userA === userB) || (namaA && namaB && namaA === namaB));
  }

  if (a.id && b.id && a.id === b.id) return true;
  const nipA = (a.nip || '').trim();
  const nipB = (b.nip || '').trim();
  if (nipA && nipB && nipA !== '-' && nipB !== '-' && nipA === nipB) return true;
  if (userA && userB && userA === userB) return true;
  if (namaA && namaB && namaA === namaB) return true;
  return false;
};

const toIsoDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseReferenceDate = (refDateStr?: string): Date => {
  if (refDateStr && /^\d{4}-\d{2}-\d{2}/.test(refDateStr)) {
    const [y, m, d] = refDateStr.slice(0, 10).split('-').map(Number);
    const parsed = new Date(y, m - 1, d);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getWeekRangeIso = (refDate: Date): { start: string; end: string; label: string } => {
  const dayOfWeek = refDate.getDay(); // 0 = Minggu, 1 = Senin
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + diffToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
  return {
    start: toIsoDateString(monday),
    end: toIsoDateString(sunday),
    label: `${fmt.format(monday)} – ${fmt.format(sunday)} ${sunday.getFullYear()}`,
  };
};

const getMonthRangeIso = (refDate: Date): { start: string; end: string; label: string } => {
  const first = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const last = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
  const fmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
  return {
    start: toIsoDateString(first),
    end: toIsoDateString(last),
    label: fmt.format(first),
  };
};

const timeToMinutes = (timeStr: string): number => {
  const match = /^(\d{1,2}):(\d{2})/.exec(timeStr.trim());
  if (!match) return 8 * 60;
  return Number(match[1]) * 60 + Number(match[2]);
};

const doesTaskOverlapDateRange = (
  task: AjuanSuratTugas,
  rangeStart: string,
  rangeEnd: string,
): boolean => {
  if (!task.tanggalMulai) return false;
  const start = task.tanggalMulai.slice(0, 10);
  const end = (task.tanggalSelesai || task.tanggalMulai).slice(0, 10);
  return start <= rangeEnd && rangeStart <= end;
};

export const formatJamRange = (jamMulai?: string, jamSelesai?: string): string =>
  `${jamMulai || DEFAULT_JAM_MULAI} – ${jamSelesai || DEFAULT_JAM_SELESAI} WIB`;

export const resolveKategoriTemplate = (
  pegawaiCount: number,
  explicit?: KategoriTemplateSurat,
): KategoriTemplateSurat => {
  if (explicit === 'INDIVIDU' || explicit === 'BERDUA' || explicit === 'KELOMPOK') {
    return explicit;
  }
  if (pegawaiCount <= 1) return 'INDIVIDU';
  if (pegawaiCount === 2) return 'BERDUA';
  return 'KELOMPOK';
};

export const getKategoriLabel = (kategori: KategoriTemplateSurat): string => {
  switch (kategori) {
    case 'INDIVIDU':
      return 'Individu (1 Orang)';
    case 'BERDUA':
      return 'Berdua (2 Orang)';
    case 'KELOMPOK':
      return 'Kelompok (Tim)';
  }
};

export const detectScheduleConflicts = (
  candidate: {
    id?: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    jamMulai?: string;
    jamSelesai?: string;
    pegawaiDitugaskan: Pegawai[];
  },
  allTasks: AjuanSuratTugas[],
): ScheduleConflict[] => {
  if (!candidate.tanggalMulai || candidate.pegawaiDitugaskan.length === 0) return [];

  const candStartDate = candidate.tanggalMulai.slice(0, 10);
  const candEndDate = (candidate.tanggalSelesai || candidate.tanggalMulai).slice(0, 10);
  const candJamMulai = candidate.jamMulai || DEFAULT_JAM_MULAI;
  const candJamSelesai = candidate.jamSelesai || DEFAULT_JAM_SELESAI;
  const candStartMin = timeToMinutes(candJamMulai);
  const candEndMin = Math.max(timeToMinutes(candJamSelesai), candStartMin + 1);

  const conflicts: ScheduleConflict[] = [];

  for (const other of allTasks) {
    if (candidate.id && other.id === candidate.id) continue;
    if (other.status === 'DITOLAK') continue;
    if (!other.tanggalMulai) continue;

    const otherStartDate = other.tanggalMulai.slice(0, 10);
    const otherEndDate = (other.tanggalSelesai || other.tanggalMulai).slice(0, 10);

    // Cek irisan tanggal
    if (!(candStartDate <= otherEndDate && otherStartDate <= candEndDate)) {
      continue;
    }

    // Cek irisan jam
    const otherJamMulai = other.jamMulai || DEFAULT_JAM_MULAI;
    const otherJamSelesai = other.jamSelesai || DEFAULT_JAM_SELESAI;
    const otherStartMin = timeToMinutes(otherJamMulai);
    const otherEndMin = Math.max(timeToMinutes(otherJamSelesai), otherStartMin + 1);

    const timeOverlaps = candStartMin < otherEndMin && otherStartMin < candEndMin;
    if (!timeOverlaps) continue;

    const overlapStartDate = candStartDate > otherStartDate ? candStartDate : otherStartDate;
    const overlapEndDate = candEndDate < otherEndDate ? candEndDate : otherEndDate;

    for (const targetPegawai of candidate.pegawaiDitugaskan) {
      const assignedInOther = (other.pegawaiDitugaskan || []).some((p) =>
        isSamePegawai(p, targetPegawai),
      );
      if (assignedInOther) {
        conflicts.push({
          pegawai: targetPegawai,
          conflictingTask: other,
          overlapStartDate,
          overlapEndDate,
          targetTimeRange: `${candJamMulai}–${candJamSelesai}`,
          conflictTimeRange: `${otherJamMulai}–${otherJamSelesai}`,
        });
      }
    }
  }

  return conflicts;
};

export const getPegawaiDinasStats = (
  pegawai: Pegawai,
  allTasks: AjuanSuratTugas[],
  refDateStr?: string,
  excludeTaskId?: string,
): PegawaiDinasStats => {
  const refDate = parseReferenceDate(refDateStr);
  const weekRange = getWeekRangeIso(refDate);
  const monthRange = getMonthRangeIso(refDate);

  let totalDinas = 0;
  let dinasMingguIni = 0;
  let dinasBulanIni = 0;

  for (const t of allTasks) {
    if (t.status === 'DITOLAK') continue;
    if (excludeTaskId && t.id === excludeTaskId) continue;
    const involved = (t.pegawaiDitugaskan || []).some((p) => isSamePegawai(p, pegawai));
    if (!involved) continue;

    totalDinas += 1;
    if (doesTaskOverlapDateRange(t, weekRange.start, weekRange.end)) {
      dinasMingguIni += 1;
    }
    if (doesTaskOverlapDateRange(t, monthRange.start, monthRange.end)) {
      dinasBulanIni += 1;
    }
  }

  return { totalDinas, dinasMingguIni, dinasBulanIni };
};

export const getRekapMingguanBulanan = (
  allTasks: AjuanSuratTugas[],
  pegawaiList: Pegawai[],
  refDateStr?: string,
): RekapMingguanBulanan => {
  const refDate = parseReferenceDate(refDateStr);
  const weekRange = getWeekRangeIso(refDate);
  const monthRange = getMonthRangeIso(refDate);

  const activeTasks = allTasks.filter((t) => t.status !== 'DITOLAK');
  const suratMinggu = activeTasks.filter((t) =>
    doesTaskOverlapDateRange(t, weekRange.start, weekRange.end),
  );
  const suratBulan = activeTasks.filter((t) =>
    doesTaskOverlapDateRange(t, monthRange.start, monthRange.end),
  );

  const totalPenugasanOrangMingguIni = suratMinggu.reduce(
    (sum, t) => sum + (t.pegawaiDitugaskan?.length || 0),
    0,
  );
  const totalPenugasanOrangBulanIni = suratBulan.reduce(
    (sum, t) => sum + (t.pegawaiDitugaskan?.length || 0),
    0,
  );

  const pegawaiRekap = pegawaiList
    .map((pegawai) => {
      const stats = getPegawaiDinasStats(pegawai, allTasks, refDateStr);
      return {
        pegawai,
        ...stats,
      };
    })
    .filter((item) => item.totalDinas > 0)
    .sort((a, b) => b.totalDinas - a.totalDinas);

  return {
    weekLabel: weekRange.label,
    monthLabel: monthRange.label,
    totalSurat: activeTasks.length,
    suratMingguIni: suratMinggu.length,
    suratBulanIni: suratBulan.length,
    totalPenugasanOrangMingguIni,
    totalPenugasanOrangBulanIni,
    pegawaiRekap,
  };
};

export const validateDocumentFile = (file: File): string | null => {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_DOC_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasAllowedExt) {
    return 'Format berkas tidak didukung. Gunakan PDF, DOC, atau DOCX.';
  }
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    return 'Ukuran berkas melebihi batas maksimal 10 MB.';
  }
  return null;
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Format pembacaan berkas tidak valid.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas dokumen.'));
    reader.readAsDataURL(file);
  });

export const downloadFileUrl = (fileUrl?: string, fallbackName = 'dokumen.pdf'): boolean => {
  if (!fileUrl) return false;
  const isSafeUrl =
    fileUrl.startsWith('data:') ||
    fileUrl.startsWith('blob:') ||
    fileUrl.startsWith('https://') ||
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('/');
  if (!isSafeUrl) return false;

  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};


import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type PegawaiEntity,
  PrismaService,
  type SuratTugasEntity,
  type TemplateSuratEntity,
} from '../../prisma.service';

interface PegawaiScheduleRef {
  id?: string;
  nip?: string;
  nama?: string;
}

const toMinutes = (hhmm: unknown, fallback: number): number => {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return fallback;
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  return h * 60 + m;
};

const isSamePegawaiRef = (a: PegawaiScheduleRef, b: PegawaiScheduleRef): boolean => {
  if (a.id && b.id && a.id === b.id) return true;
  if (a.nip && b.nip && a.nip.trim() === b.nip.trim()) return true;
  if (a.nama && b.nama && a.nama.trim().toLowerCase() === b.nama.trim().toLowerCase()) {
    return true;
  }
  return false;
};

const findScheduleConflictMessage = (
  candidate: Record<string, unknown>,
  allTasks: SuratTugasEntity[],
  ignoreId?: string,
): string | null => {
  const status = typeof candidate.status === 'string' ? candidate.status : '';
  if (status === 'DITOLAK' || status === 'DRAFT') return null;

  const tanggalMulai =
    typeof candidate.tanggalMulai === 'string'
      ? candidate.tanggalMulai.slice(0, 10)
      : '';
  const tanggalSelesai =
    typeof candidate.tanggalSelesai === 'string' && candidate.tanggalSelesai
      ? candidate.tanggalSelesai.slice(0, 10)
      : tanggalMulai;
  const pegawaiList = Array.isArray(candidate.pegawaiDitugaskan)
    ? (candidate.pegawaiDitugaskan as PegawaiScheduleRef[])
    : [];

  if (!tanggalMulai || pegawaiList.length === 0) return null;

  const candStartMin = toMinutes(candidate.jamMulai, 8 * 60);
  const candEndMin = Math.max(toMinutes(candidate.jamSelesai, 17 * 60), candStartMin + 1);

  for (const other of allTasks) {
    if (ignoreId && other.id === ignoreId) continue;
    if (other.status === 'DITOLAK' || other.status === 'DRAFT') continue;
    if (!other.tanggalMulai) continue;

    const otherStart = String(other.tanggalMulai).slice(0, 10);
    const otherEnd = other.tanggalSelesai
      ? String(other.tanggalSelesai).slice(0, 10)
      : otherStart;

    if (!(tanggalMulai <= otherEnd && otherStart <= tanggalSelesai)) continue;

    const otherStartMin = toMinutes(other['jamMulai'], 8 * 60);
    const otherEndMin = Math.max(
      toMinutes(other['jamSelesai'], 17 * 60),
      otherStartMin + 1,
    );
    if (!(candStartMin < otherEndMin && otherStartMin < candEndMin)) continue;

    const otherPegawai = Array.isArray(other['pegawaiDitugaskan'])
      ? (other['pegawaiDitugaskan'] as PegawaiScheduleRef[])
      : [];

    for (const p of pegawaiList) {
      if (otherPegawai.some((op) => isSamePegawaiRef(p, op))) {
        const nama = p.nama || p.nip || 'Pegawai';
        return `Bentrok jadwal: ${nama} sudah ditugaskan pada surat "${other.nomorSurat}" (${otherStart} s.d. ${otherEnd}).`;
      }
    }
  }

  return null;
};

@Injectable()
export class TugasService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<SuratTugasEntity[]> {
    return this.prisma.suratTugas.findMany();
  }

  async findOne(id: string): Promise<SuratTugasEntity | null> {
    return this.prisma.suratTugas.findUnique({
      where: { id },
    });
  }

  async create(data: Record<string, unknown>): Promise<SuratTugasEntity> {
    const nomorSurat =
      typeof data.nomorSurat === 'string' ? data.nomorSurat.trim() : '';
    const existingList = await this.prisma.suratTugas.findMany();

    if (nomorSurat && !nomorSurat.toUpperCase().startsWith('DRAFT')) {
      const duplicate = existingList.find(
        (item) =>
          typeof item.nomorSurat === 'string' &&
          item.nomorSurat.trim().toLowerCase() === nomorSurat.toLowerCase(),
      );
      if (duplicate) {
        throw new ConflictException(
          `Nomor surat "${nomorSurat}" sudah digunakan pada pengajuan lain.`,
        );
      }
    }

    const conflictMessage = findScheduleConflictMessage(data, existingList);
    if (conflictMessage) {
      throw new ConflictException(conflictMessage);
    }

    return this.prisma.suratTugas.create({
      data,
    });
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<SuratTugasEntity | null> {
    const existing = await this.prisma.suratTugas.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Surat tugas tidak ditemukan.');
    }

    const nextStatus =
      typeof data.status === 'string' ? data.status.trim() : '';
    const currentStatus =
      typeof existing.status === 'string' ? existing.status.trim() : '';
    const isFinalTransition =
      nextStatus === 'SURAT_TERBIT' || nextStatus === 'DITOLAK';
    const isAlreadyFinal =
      currentStatus === 'SURAT_TERBIT' || currentStatus === 'DITOLAK';

    if (isFinalTransition && isAlreadyFinal && nextStatus !== currentStatus) {
      throw new ConflictException(
        `Surat tugas sudah berstatus ${currentStatus} dan tidak dapat diubah lagi menjadi ${nextStatus}.`,
      );
    }

    if (nextStatus === 'SURAT_TERBIT') {
      const mergedCandidate: Record<string, unknown> = {
        ...existing,
        ...data,
        status: nextStatus,
      };
      const allTasks = await this.prisma.suratTugas.findMany();
      const conflictMessage = findScheduleConflictMessage(
        mergedCandidate,
        allTasks,
        id,
      );
      if (conflictMessage) {
        throw new ConflictException(conflictMessage);
      }
    }

    return this.prisma.suratTugas.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<SuratTugasEntity | null> {
    return this.prisma.suratTugas.delete({
      where: { id },
    });
  }

  // ------------------------------------------------------------
  // CRUD Pegawai (PostgreSQL)
  // ------------------------------------------------------------

  async findAllPegawai(): Promise<PegawaiEntity[]> {
    return this.prisma.pegawai.findMany();
  }

  async findOnePegawai(id: string): Promise<PegawaiEntity | null> {
    return this.prisma.pegawai.findUnique({
      where: { id },
    });
  }

  async createPegawai(data: Partial<PegawaiEntity>): Promise<PegawaiEntity> {
    return this.prisma.pegawai.create({
      data,
    });
  }

  async updatePegawai(
    id: string,
    data: Partial<PegawaiEntity>,
  ): Promise<PegawaiEntity> {
    return this.prisma.pegawai.update({
      where: { id },
      data,
    });
  }

  async deletePegawai(id: string): Promise<PegawaiEntity> {
    return this.prisma.pegawai.delete({
      where: { id },
    });
  }

  // ------------------------------------------------------------
  // CRUD Template Surat Resmi (PostgreSQL)
  // ------------------------------------------------------------

  async findAllTemplates(): Promise<TemplateSuratEntity[]> {
    const list = await this.prisma.templateSurat.findMany();
    return list.map((item) => {
      const hasFileDocx = Boolean(item.fileDocxDataUrl || item.hasFileDocx);
      const copy: TemplateSuratEntity = { ...item, hasFileDocx };
      delete copy.fileDocxDataUrl;
      return copy;
    });
  }

  async findOneTemplate(id: string): Promise<TemplateSuratEntity | null> {
    return this.prisma.templateSurat.findUnique({
      where: { id },
    });
  }

  async createTemplate(
    data: Record<string, unknown>,
  ): Promise<TemplateSuratEntity> {
    return this.prisma.templateSurat.create({
      data,
    });
  }

  async updateTemplate(
    id: string,
    data: Record<string, unknown>,
  ): Promise<TemplateSuratEntity | null> {
    return this.prisma.templateSurat.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string): Promise<TemplateSuratEntity | null> {
    return this.prisma.templateSurat.delete({
      where: { id },
    });
  }
}

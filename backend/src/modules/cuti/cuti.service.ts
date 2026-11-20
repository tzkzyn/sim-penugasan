import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type PengajuanCutiEntity,
  PrismaService,
} from '../../prisma.service';

@Injectable()
export class CutiService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PengajuanCutiEntity[]> {
    return this.prisma.cuti.findMany();
  }

  async findOne(id: string): Promise<PengajuanCutiEntity> {
    const found = await this.prisma.cuti.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Data pengajuan cuti tidak ditemukan.');
    }
    return found;
  }

  async create(data: Record<string, unknown>): Promise<PengajuanCutiEntity> {
    const nama = typeof data.nama === 'string' ? data.nama.trim() : '';
    const nip = typeof data.nip === 'string' ? data.nip.trim() : '';
    const mulai = typeof data.mulai === 'string' ? data.mulai.trim() : '';
    const selesai = typeof data.selesai === 'string' ? data.selesai.trim() : '';
    const alasan = typeof data.alasan === 'string' ? data.alasan.trim() : '';

    if (!nama || !nip) {
      throw new BadRequestException('Identitas pegawai pengaju wajib diisi.');
    }
    if (!mulai || !selesai) {
      throw new BadRequestException('Tanggal mulai dan selesai wajib diisi.');
    }
    if (selesai < mulai) {
      throw new BadRequestException(
        'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
      );
    }
    if (!alasan) {
      throw new BadRequestException('Alasan pengajuan wajib diisi.');
    }

    return this.prisma.cuti.create({ data });
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<PengajuanCutiEntity> {
    const existing = await this.prisma.cuti.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Data pengajuan cuti tidak ditemukan.');
    }

    const nextStatus = typeof data.status === 'string' ? data.status : undefined;
    if (
      nextStatus &&
      (nextStatus === 'DISETUJUI' || nextStatus === 'DITOLAK') &&
      existing.status !== 'MENUNGGU' &&
      existing.status !== nextStatus
    ) {
      throw new ConflictException(
        `Pengajuan ini sudah berstatus final (${existing.status}) dan tidak dapat diubah lagi.`,
      );
    }

    const updated = await this.prisma.cuti.update({ where: { id }, data });
    if (!updated) {
      throw new NotFoundException('Data pengajuan cuti tidak ditemukan.');
    }
    return updated;
  }

  async delete(id: string): Promise<PengajuanCutiEntity> {
    const deleted = await this.prisma.cuti.delete({ where: { id } });
    if (!deleted) {
      throw new NotFoundException('Data pengajuan cuti tidak ditemukan.');
    }
    return deleted;
  }
}


import { Injectable } from '@nestjs/common';
import {
  type PegawaiEntity,
  PrismaService,
  type SuratTugasEntity,
  type TemplateSuratEntity,
} from '../../prisma.service';

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
    return this.prisma.suratTugas.create({
      data,
    });
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<SuratTugasEntity | null> {
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

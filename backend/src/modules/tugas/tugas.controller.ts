import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { type PegawaiEntity } from '../../prisma.service';
import { TugasService } from './tugas.service';

@Controller('tugas')
export class TugasController {
  constructor(private readonly tugasService: TugasService) {}

  @Get()
  getTugas() {
    return this.tugasService.findAll();
  }

  @Get(':id')
  getTugasById(@Param('id') id: string) {
    return this.tugasService.findOne(id);
  }

  @Post()
  createTugas(@Body() body: Record<string, unknown>) {
    return this.tugasService.create(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tugasService.update(id, { status });
  }

  @Patch(':id')
  updateTugas(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.tugasService.update(id, body);
  }

  @Delete(':id')
  deleteTugas(@Param('id') id: string) {
    return this.tugasService.delete(id);
  }
}

@Controller('pegawai')
export class PegawaiController {
  constructor(private readonly tugasService: TugasService) {}

  @Get()
  getPegawai() {
    return this.tugasService.findAllPegawai();
  }

  @Get(':id')
  async getPegawaiById(@Param('id') id: string) {
    const found = await this.tugasService.findOnePegawai(id);
    if (!found) {
      throw new NotFoundException('Data pegawai tidak ditemukan.');
    }
    return found;
  }

  @Post()
  createPegawai(@Body() body: Partial<PegawaiEntity>) {
    return this.tugasService.createPegawai(body);
  }

  @Patch(':id')
  updatePegawai(@Param('id') id: string, @Body() body: Partial<PegawaiEntity>) {
    return this.tugasService.updatePegawai(id, body);
  }

  @Delete(':id')
  deletePegawai(@Param('id') id: string) {
    return this.tugasService.deletePegawai(id);
  }
}

@Controller('templates')
export class TemplatesController {
  constructor(private readonly tugasService: TugasService) {}

  @Get()
  getTemplates() {
    return this.tugasService.findAllTemplates();
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    const found = await this.tugasService.findOneTemplate(id);
    if (!found) {
      throw new NotFoundException('Template surat tidak ditemukan.');
    }
    return found;
  }

  @Post()
  createTemplate(@Body() body: Record<string, unknown>) {
    return this.tugasService.createTemplate(body);
  }

  @Patch(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const updated = await this.tugasService.updateTemplate(id, body);
    if (!updated) {
      throw new NotFoundException('Template surat tidak ditemukan.');
    }
    return updated;
  }

  @Delete(':id')
  deleteTemplate(@Param('id') id: string) {
    return this.tugasService.deleteTemplate(id);
  }
}

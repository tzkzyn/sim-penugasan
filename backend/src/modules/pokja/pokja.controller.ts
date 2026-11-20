import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('pokja')
export class PokjaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getPokja() {
    return this.prisma.pokja.findMany();
  }

  @Post()
  createPokja(@Body() body: { kode?: string; nama?: string; id?: string }) {
    const kode = typeof body.kode === 'string' ? body.kode.trim() : '';
    const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
    if (!kode || !nama) {
      throw new BadRequestException('Kode dan nama POKJA wajib diisi.');
    }
    return this.prisma.pokja.create({ data: { id: body.id, kode, nama } });
  }

  @Patch(':id')
  async updatePokja(
    @Param('id') id: string,
    @Body() body: { kode?: string; nama?: string },
  ) {
    const updated = await this.prisma.pokja.update({
      where: { id },
      data: body,
    });
    if (!updated) {
      throw new NotFoundException('Data POKJA tidak ditemukan.');
    }
    return updated;
  }

  @Delete(':id')
  async deletePokja(@Param('id') id: string) {
    const deleted = await this.prisma.pokja.delete({ where: { id } });
    if (!deleted) {
      throw new NotFoundException('Data POKJA tidak ditemukan.');
    }
    return deleted;
  }
}


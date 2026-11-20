import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { type NotifikasiEntity, PrismaService } from '../../prisma.service';

@Controller('notifikasi')
export class NotifikasiController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getNotifikasi(@Query('role') role?: string) {
    return this.prisma.notifikasi.findMany(role);
  }

  @Post()
  createNotifikasi(@Body() body: Partial<NotifikasiEntity>) {
    return this.prisma.notifikasi.create({ data: body });
  }

  @Patch('mark-all-read')
  async markAllRead(@Query('role') role?: string) {
    await this.prisma.notifikasi.markAllRead(role);
    return { ok: true };
  }

  @Patch(':id')
  async updateNotifikasi(
    @Param('id') id: string,
    @Body() body: { unread?: boolean },
  ) {
    const updated = await this.prisma.notifikasi.update({
      where: { id },
      data: { unread: body.unread },
    });
    if (!updated) {
      throw new NotFoundException('Notifikasi tidak ditemukan.');
    }
    return updated;
  }

  @Delete(':id')
  async deleteNotifikasi(@Param('id') id: string) {
    const ok = await this.prisma.notifikasi.delete({ where: { id } });
    if (!ok) {
      throw new NotFoundException('Notifikasi tidak ditemukan.');
    }
    return { ok: true };
  }

  @Delete()
  async clearAll(@Query('role') role?: string) {
    await this.prisma.notifikasi.clearAll(role);
    return { ok: true };
  }
}


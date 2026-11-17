import { Module } from '@nestjs/common';
import {
  PegawaiController,
  TemplatesController,
  TugasController,
} from './tugas.controller';
import { TugasService } from './tugas.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TugasController, PegawaiController, TemplatesController],
  providers: [TugasService, PrismaService],
  exports: [TugasService, PrismaService],
})
export class TugasModule {}

import { Module } from '@nestjs/common';
import { TugasModule } from '../tugas/tugas.module';
import { NotifikasiController } from './notifikasi.controller';

@Module({
  imports: [TugasModule],
  controllers: [NotifikasiController],
})
export class NotifikasiModule {}


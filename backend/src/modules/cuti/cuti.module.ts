import { Module } from '@nestjs/common';
import { TugasModule } from '../tugas/tugas.module';
import { CutiController } from './cuti.controller';
import { CutiService } from './cuti.service';

@Module({
  imports: [TugasModule],
  controllers: [CutiController],
  providers: [CutiService],
  exports: [CutiService],
})
export class CutiModule {}


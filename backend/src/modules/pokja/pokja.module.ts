import { Module } from '@nestjs/common';
import { TugasModule } from '../tugas/tugas.module';
import { PokjaController } from './pokja.controller';

@Module({
  imports: [TugasModule],
  controllers: [PokjaController],
})
export class PokjaModule {}


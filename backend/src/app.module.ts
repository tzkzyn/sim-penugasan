import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardController } from './modules/dashboard/dashboard.controller';
import { AbsensiController } from './modules/absensi/absensi.controller';
import { AuthController } from './modules/auth/auth.controller';
import { CutiModule } from './modules/cuti/cuti.module';
import { NotifikasiModule } from './modules/notifikasi/notifikasi.module';
import { PokjaModule } from './modules/pokja/pokja.module';
import { TugasModule } from './modules/tugas/tugas.module';

@Module({
  imports: [TugasModule, CutiModule, PokjaModule, NotifikasiModule],
  controllers: [
    AppController,
    DashboardController,
    AbsensiController,
    AuthController,
  ],
  providers: [AppService],
})
export class AppModule {}

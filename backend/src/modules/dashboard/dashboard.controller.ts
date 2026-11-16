import { Controller, Get } from '@nestjs/common';
import { TugasService } from '../tugas/tugas.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly tugasService: TugasService) {}

  @Get()
  async getDashboard() {
    const tasks = await this.tugasService.findAll();
    const activeAssignments = tasks.filter(
      (t: any) => t.status === 'SURAT_TERBIT'
    ).length;
    const draftApproval = tasks.filter(
      (t: any) =>
        t.status === 'DRAFT' ||
        t.status === 'VERIFIKASI_SUBBAGIAN' ||
        t.status === 'PERSETUJUAN_PIMPINAN'
    ).length;

    return {
      welcome: {
        unitKerja: 'RBI',
        role: 'ADMIN',
        nama: 'Taryadi',
      },
      stats: {
        activeAssignments,
        attendanceToday: 0,
        draftApproval,
        estimatedTukin: 0,
      },
      recentAssignments: tasks.slice(0, 5),
      recentAttendance: [],
    };
  }
}

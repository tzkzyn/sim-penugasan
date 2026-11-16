import { Controller, Get } from '@nestjs/common';

@Controller('absensi')
export class AbsensiController {
  @Get()
  getAbsensi() {
    return {
      pribadi: {
        totalHadir: 0,
        totalTerlambat: 0,
        totalIzin: 0,
        persentaseKehadiran: 0,
        tukin: {
          periodeBulan: 'Bulan Berjalan',
          tunjanganDasar: 0,
          totalPotonganPersen: 0,
          totalPotonganNominal: 0,
          tunjanganDiterima: 0,
        },
      },
      pegawaiLain: [],
    };
  }
}

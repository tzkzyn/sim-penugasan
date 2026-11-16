import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
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
  createTugas(@Body() body: any) {
    return this.tugasService.create(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tugasService.update(id, { status });
  }

  @Patch(':id')
  updateTugas(@Param('id') id: string, @Body() body: any) {
    return this.tugasService.update(id, body);
  }

  @Delete(':id')
  deleteTugas(@Param('id') id: string) {
    return this.tugasService.delete(id);
  }
}

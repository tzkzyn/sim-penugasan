import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CutiService } from './cuti.service';

@Controller('cuti')
export class CutiController {
  constructor(private readonly cutiService: CutiService) {}

  @Get()
  getCuti() {
    return this.cutiService.findAll();
  }

  @Get(':id')
  getCutiById(@Param('id') id: string) {
    return this.cutiService.findOne(id);
  }

  @Post()
  createCuti(@Body() body: Record<string, unknown>) {
    return this.cutiService.create(body);
  }

  @Patch(':id')
  updateCuti(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.cutiService.update(id, body);
  }

  @Delete(':id')
  deleteCuti(@Param('id') id: string) {
    return this.cutiService.delete(id);
  }
}


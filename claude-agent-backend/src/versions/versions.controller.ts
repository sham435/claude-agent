import { Controller, Get, Post, Param, Body, HttpCode } from '@nestjs/common';
import { VersionsService } from './versions.service';

@Controller('versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get('list')
  async list() {
    return this.versionsService.listBackups();
  }

  @Get('logs')
  async logs() {
    return this.versionsService.getDeploymentLogs();
  }

  @Post('rollback/:id')
  @HttpCode(200)
  async rollback(@Param('id') id: string) {
    return this.versionsService.rollbackBackup(id);
  }

  @Get('diff/:id')
  async diff(@Param('id') id: string) {
    return this.versionsService.getDiff(id);
  }

  @Post('create')
  async create(@Body() body: { user?: string; notes?: string }) {
    return this.versionsService.createBackup(body.user || 'system', body.notes);
  }
}

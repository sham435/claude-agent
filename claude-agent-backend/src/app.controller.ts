import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return { message: 'Claude Agent API', status: 'running', docs: '/api' };
  }

  // Health
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  // Agent endpoints
  @Get('agent/status')
  getAgentStatus() {
    return this.appService.getAgentStatus();
  }

  @Post('agent/run')
  runAgent(@Body() body: { prompt: string; config?: { model?: string; maxTokens?: number; temperature?: number } }) {
    return this.appService.runAgent(body.prompt, body.config);
  }

  @Get('agent/history')
  getExecutionHistory() {
    return this.appService.getExecutionHistory();
  }

  @Get('agent/stats')
  getAgentStats() {
    return this.appService.getAgentStats();
  }

  // Tools endpoints
  @Get('tools')
  getAllTools() {
    return this.appService.getAllTools();
  }

  @Get('tools/:name')
  getTool(@Param('name') name: string) {
    return this.appService.getTool(name);
  }

  @Post('tools/:name/test')
  testTool(@Param('name') name: string, @Body() input: any) {
    return this.appService.testTool(name, input);
  }

  // Projects endpoints
  @Get('projects')
  getProjects() {
    return this.appService.getProjects();
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.appService.getProject(id);
  }

  @Post('projects')
  createProject(@Body() body: { name: string; path: string; description?: string }) {
    return this.appService.createProject(body);
  }

  @Put('projects/:id')
  updateProject(@Param('id') id: string, @Body() updates: any) {
    return this.appService.updateProject(id, updates);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id') id: string) {
    return this.appService.deleteProject(id);
  }

  // Execution endpoints
  @Get('executions')
  getExecutions() {
    return this.appService.getExecutions();
  }

  @Get('executions/:id')
  getExecution(@Param('id') id: string) {
    return this.appService.getExecution(id);
  }

  @Post('executions/:id/cancel')
  cancelExecution(@Param('id') id: string) {
    return this.appService.cancelExecution(id);
  }

  // Settings endpoints
  @Get('settings')
  getSettings() {
    return this.appService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() updates: any) {
    return this.appService.updateSettings(updates);
  }

  // Auth endpoints (mock)
  @Post('auth/login')
  login(@Body() body: { apiKey: string }) {
    return this.appService.login(body.apiKey);
  }

  @Post('auth/logout')
  logout() {
    return this.appService.logout();
  }

  // Model endpoints
  @Get('models/stats/:modelId')
  getModelStats(@Param('modelId') modelId: string) {
    return this.appService.getModelStats(modelId);
  }

  @Get('models/history/:modelId')
  getModelHistory(@Param('modelId') modelId: string) {
    return this.appService.getModelHistory(modelId);
  }

  // Image generation endpoints
  @Post('image/generate')
  generateImage(@Body() body: { prompt: string; model: string; size: string }) {
    return this.appService.generateImage(body);
  }

  // PDF processing endpoints
  @Post('pdf/process')
  @UseInterceptors(FileInterceptor('file'))
  processPDF(@UploadedFile() file: Express.Multer.File) {
    return this.appService.processPDF(file);
  }

  // PPT generation endpoints
  @Post('ppt/generate')
  generatePPT(@Body() body: { topic: string; numSlides: number }) {
    return this.appService.generatePPT(body);
  }

  // Smart PPT generation from PDF content
  @Post('pdf/generate-smart-ppt')
  generateSmartPpt(@Body() body: { content: string; title: string; template?: string; clientId?: string }) {
    return this.appService.generateSmartPpt(body);
  }

  // Save PDF document to database
  @Post('pdf/save')
  savePdfDocument(@Body() body: { title: string; content: string; filename?: string }) {
    return this.appService.savePdfDocument(body);
  }
}

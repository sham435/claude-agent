import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './llm/openai.provider';
import { PdfPptService, PptGenerationResult } from './services/pdf-ppt.service';

@Injectable()
export class AppService {
  private executions: any[] = [];
  private projects: any[] = [];
  private llm: OpenAIProvider | null = null;
  private pdfPptService: PdfPptService;
  private settings = {
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    maxTokens: 4096,
    maxRetries: 3,
    timeout: 30000,
    theme: 'dark',
    autoScroll: true,
    showTimestamps: true,
  };

  constructor() {
    this.pdfPptService = new PdfPptService();
  }

  private getLLM(): OpenAIProvider | null {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!this.llm) {
      this.llm = new OpenAIProvider();
    }
    return this.llm;
  }

  getHealth() {
    return { success: true, data: { status: 'ok', timestamp: new Date().toISOString() } };
  }

  // Agent
  getAgentStatus() {
    return {
      success: true,
      data: {
        id: 'agent-default',
        projectPath: process.cwd(),
        model: this.settings.model,
        maxTokens: this.settings.maxTokens,
        isRunning: false,
        currentTask: null,
        lastExecution: null,
        totalExecutions: this.executions.length,
      },
    };
  }

  async runAgent(prompt: string, config?: { model?: string; maxTokens?: number; temperature?: number }) {
    const startTime = Date.now();
    let result: string;
    let status = 'completed';
    let error: string | null = null;

    const llm = this.getLLM();

    if (llm) {
      try {
        result = await llm.generate(prompt, {
          model: config?.model || this.settings.model,
          maxTokens: config?.maxTokens || this.settings.maxTokens,
          temperature: config?.temperature || 0.7,
        });
      } catch (e) {
        status = 'failed';
        error = e instanceof Error ? e.message : 'LLM generation failed';
        result = '';
      }
    } else {
      result = `[LLM not configured] Please set OPENAI_API_KEY or OPENROUTER_API_KEY environment variable. Prompt: ${prompt}`;
    }

    const execution = {
      id: `exec-${Date.now()}`,
      agentId: 'agent-default',
      prompt,
      status,
      startTime,
      endTime: Date.now(),
      duration: Date.now() - startTime,
      toolCalls: [],
      result,
      error,
      metadata: { model: config?.model || this.settings.model },
    };
    this.executions.unshift(execution);
    return { success: true, data: execution };
  }

  getExecutionHistory() {
    return { success: true, data: this.executions };
  }

  getAgentStats() {
    const completed = this.executions.filter((e) => e.status === 'completed').length;
    const failed = this.executions.filter((e) => e.status === 'failed').length;
    return {
      success: true,
      data: {
        totalExecutions: this.executions.length,
        successfulExecutions: completed,
        failedExecutions: failed,
        averageDuration: 2500,
        mostUsedTool: 'bash',
        executionTrend: [{ date: new Date().toISOString().split('T')[0], count: this.executions.length, duration: 2500 }],
      },
    };
  }

  // Tools
  getAllTools() {
    return {
      success: true,
      data: [
        { id: '1', name: 'Read', description: 'Read file contents', category: 'file', parameters: [{ name: 'path', type: 'string', required: true, description: 'Path to the file' }, { name: 'limit', type: 'number', required: false, description: 'Max lines to read' }, { name: 'offset', type: 'number', required: false, description: 'Line offset to start from' }] },
        { id: '2', name: 'Write', description: 'Write to file', category: 'file', parameters: [{ name: 'path', type: 'string', required: true, description: 'Path to the file' }, { name: 'content', type: 'string', required: true, description: 'Content to write' }] },
        { id: '3', name: 'Grep', description: 'Search patterns in files', category: 'search', parameters: [{ name: 'pattern', type: 'string', required: true, description: 'Regex pattern' }, { name: 'path', type: 'string', required: false, description: 'Directory to search' }] },
        { id: '4', name: 'Bash', description: 'Execute shell commands', category: 'command', parameters: [{ name: 'command', type: 'string', required: true, description: 'Command to execute' }, { name: 'timeout', type: 'number', required: false, description: 'Timeout in ms' }] },
        { id: '5', name: 'Glob', description: 'Find files by pattern', category: 'search', parameters: [{ name: 'pattern', type: 'string', required: true, description: 'Glob pattern' }, { name: 'path', type: 'string', required: false, description: 'Base directory' }] },
        { id: '6', name: 'Edit', description: 'Edit existing files', category: 'file', parameters: [{ name: 'path', type: 'string', required: true, description: 'File to edit' }, { name: 'oldString', type: 'string', required: true, description: 'Text to replace' }, { name: 'newString', type: 'string', required: true, description: 'Replacement text' }] },
        { id: '7', name: 'WebFetch', description: 'Fetch URL content', category: 'web', parameters: [{ name: 'url', type: 'string', required: true, description: 'URL to fetch' }, { name: 'format', type: 'string', required: false, description: 'Output format' }] },
        { id: '8', name: 'WebSearch', description: 'Search the web', category: 'web', parameters: [{ name: 'query', type: 'string', required: true, description: 'Search query' }, { name: 'numResults', type: 'number', required: false, description: 'Max results' }] },
      ],
    };
  }

  getTool(name: string) {
    const tools = this.getAllTools().data;
    const tool = tools.find((t) => t.name.toLowerCase() === name.toLowerCase());
    return { success: !!tool, data: tool };
  }

  testTool(name: string, input: any) {
    return { success: true, data: { tool: name, input, output: `Tool ${name} executed successfully`, duration: 100 } };
  }

  // Projects
  getProjects() {
    return { success: true, data: this.projects };
  }

  getProject(id: string) {
    const project = this.projects.find((p) => p.id === id);
    return { success: !!project, data: project };
  }

  createProject(body: { name: string; path: string; description?: string }) {
    const project = { id: `proj-${Date.now()}`, ...body, createdAt: Date.now(), updatedAt: Date.now(), config: {} };
    this.projects.push(project);
    return { success: true, data: project };
  }

  updateProject(id: string, updates: any) {
    const project = this.projects.find((p) => p.id === id);
    if (project) Object.assign(project, updates, { updatedAt: Date.now() });
    return { success: !!project, data: project };
  }

  deleteProject(id: string) {
    this.projects = this.projects.filter((p) => p.id !== id);
    return { success: true, data: { deleted: true } };
  }

  // Executions
  getExecutions() {
    return { success: true, data: this.executions };
  }

  getExecution(id: string) {
    const execution = this.executions.find((e) => e.id === id);
    return { success: !!execution, data: execution };
  }

  cancelExecution(id: string) {
    const execution = this.executions.find((e) => e.id === id);
    if (execution) execution.status = 'cancelled';
    return { success: true, data: { cancelled: true } };
  }

  // Settings
  getSettings() {
    return { success: true, data: this.settings };
  }

  updateSettings(updates: any) {
    this.settings = { ...this.settings, ...updates };
    return { success: true, data: this.settings };
  }

  // Auth
  login(apiKey: string) {
    return { success: true, data: { token: 'mock-token-' + Date.now() } };
  }

  logout() {
    return { success: true };
  }

  // Model stats
  getModelStats(modelId: string) {
    const modelRequests = this.executions.filter(
      (e) => e.metadata?.model === modelId
    );
    const totalRequests = modelRequests.length;
    const totalTokens = modelRequests.reduce((sum, e) => sum + (e.metadata?.tokens || 0), 0);
    const successCount = modelRequests.filter((e) => e.status === 'completed').length;
    const avgTime = totalRequests > 0
      ? Math.round(modelRequests.reduce((sum, e) => sum + e.duration, 0) / totalRequests)
      : 0;
    const lastRequest = modelRequests[0]?.startTime || null;

    return {
      success: true,
      data: {
        totalRequests,
        totalTokens,
        avgResponseTime: avgTime,
        successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0,
        lastRequest,
      },
    };
  }

  getModelHistory(modelId: string) {
    const history = this.executions
      .filter((e) => e.metadata?.model === modelId)
      .map((e) => ({
        id: e.id,
        model: e.metadata?.model || modelId,
        prompt: e.prompt,
        tokens: e.metadata?.tokens || 0,
        timeMs: e.duration,
        status: e.status === 'completed' ? 'success' : 'failed',
        timestamp: new Date(e.startTime).toISOString(),
      }));

    return { success: true, data: history };
  }

  // Image generation (placeholder - integrate with actual image API)
  generateImage(data: { prompt: string; model: string; size: string }) {
    return {
      success: true,
      data: {
        imageUrl: `https://picsum.photos/seed/${Date.now()}/512/512`,
        prompt: data.prompt,
        model: data.model,
        size: data.size,
      },
    };
  }

  // PDF processing (placeholder - integrate with actual PDF parsing)
  processPDF(data: { file?: any }) {
    return {
      success: true,
      data: {
        extractedText: 'Sample extracted text from PDF...',
        summary: 'This is a sample summary of the PDF content.',
        pages: 5,
      },
    };
  }

  // PPT generation (placeholder - integrate with actual PPT library)
  generatePPT(data: { topic: string; numSlides: number }) {
    const slides = Array.from({ length: data.numSlides }, (_, i) => ({
      title: `Slide ${i + 1}: ${i === 0 ? 'Introduction' : i === data.numSlides - 1 ? 'Conclusion' : 'Content'}`,
      content: [
        `Point 1 about ${data.topic}`,
        `Point 2 about ${data.topic}`,
        `Point 3 about ${data.topic}`,
      ],
    }));

    return {
      success: true,
      data: {
        slides,
        downloadUrl: '#',
        topic: data.topic,
      },
    };
  }

  // Smart PPT generation
  async generateSmartPpt(data: { content: string; title: string; template?: string }): Promise<PptGenerationResult> {
    try {
      const result = await this.pdfPptService.generatePpt(data.content, data.title, data.template);
      return result;
    } catch (err: any) {
      return {
        success: false,
        message: `PPT generation failed: ${err.message}`,
      };
    }
  }

  // Save PDF document
  savedDocuments: Array<{ id: string; title: string; content: string; filename?: string; createdAt: string }> = [];

  savePdfDocument(data: { title: string; content: string; filename?: string }) {
    const doc = {
      id: `doc-${Date.now()}`,
      title: data.title,
      content: data.content,
      filename: data.filename,
      createdAt: new Date().toISOString(),
    };
    this.savedDocuments.push(doc);
    return { success: true, id: doc.id, message: 'Document saved' };
  }
}

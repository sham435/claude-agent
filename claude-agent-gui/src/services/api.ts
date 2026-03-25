import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { 
  AgentStatus, 
  Tool, 
  ExecutionRecord, 
  Project, 
  AgentSettings, 
  ExecutionStats, 
  ApiResponse
} from '../types';

export class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getAgentStatus(): Promise<AgentStatus> {
    const response = await this.client.get<ApiResponse<AgentStatus>>('/agent/status');
    return response.data.data!;
  }

  async runAgent(prompt: string, config?: { model?: string; maxTokens?: number; temperature?: number }): Promise<ExecutionRecord> {
    const response = await this.client.post<ApiResponse<ExecutionRecord>>('/agent/run', { prompt, config });
    return response.data.data!;
  }

  async getExecutionHistory(limit: number = 50): Promise<ExecutionRecord[]> {
    const response = await this.client.get<ApiResponse<ExecutionRecord[]>>(`/agent/history?limit=${limit}`);
    return response.data.data!;
  }

  async getAgentStats(): Promise<ExecutionStats> {
    const response = await this.client.get<ApiResponse<ExecutionStats>>('/agent/stats');
    return response.data.data!;
  }

  async getAllTools(): Promise<Tool[]> {
    const response = await this.client.get<ApiResponse<Tool[]>>('/tools');
    return response.data.data!;
  }

  async getTool(name: string): Promise<Tool> {
    const response = await this.client.get<ApiResponse<Tool>>(`/tools/${name}`);
    return response.data.data!;
  }

  async testTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    const response = await this.client.post<ApiResponse<unknown>>(`/tools/${name}/test`, input);
    return response.data.data!;
  }

  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<ApiResponse<Project[]>>('/projects');
    return response.data.data!;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data.data!;
  }

  async createProject(name: string, path: string, description?: string): Promise<Project> {
    const response = await this.client.post<ApiResponse<Project>>('/projects', { name, path, description });
    return response.data.data!;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.client.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return response.data.data!;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  async getExecution(id: string): Promise<ExecutionRecord> {
    const response = await this.client.get<ApiResponse<ExecutionRecord>>(`/executions/${id}`);
    return response.data.data!;
  }

  async cancelExecution(id: string): Promise<void> {
    await this.client.post(`/executions/${id}/cancel`);
  }

  async getSettings(): Promise<AgentSettings> {
    const response = await this.client.get<ApiResponse<AgentSettings>>('/settings');
    return response.data.data!;
  }

  async updateSettings(settings: Partial<AgentSettings>): Promise<AgentSettings> {
    const response = await this.client.put<ApiResponse<AgentSettings>>('/settings', settings);
    return response.data.data!;
  }

  async login(apiKey: string): Promise<{ token: string }> {
    const response = await this.client.post<ApiResponse<{ token: string }>>('/auth/login', { apiKey });
    const data = response.data.data!;
    localStorage.setItem('token', data.token);
    return data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    await this.client.post('/auth/logout');
  }

  async getModelStats(modelId: string): Promise<any> {
    const response = await this.client.get<any>(`/models/stats/${modelId}`);
    return response.data;
  }

  async getModelHistory(modelId: string): Promise<any> {
    const response = await this.client.get<any>(`/models/history/${modelId}`);
    return response.data;
  }

  async generateImage(data: { prompt: string; model: string; size: string }): Promise<any> {
    const response = await this.client.post<any>('/image/generate', data);
    return response.data.data;
  }

  async processPDF(formData: FormData): Promise<any> {
    const response = await this.client.post('/pdf/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }

  async generatePPT(data: { topic: string; numSlides: number }): Promise<any> {
    const response = await this.client.post<any>('/ppt/generate', data);
    return response.data.data;
  }

  async generateSmartPpt(data: { content: string; title: string; template?: string }): Promise<any> {
    const response = await this.client.post<any>('/pdf/generate-smart-ppt', data);
    return response.data;
  }

  async savePdfDocument(data: { title: string; content: string; filename?: string }): Promise<any> {
    const response = await this.client.post<any>('/pdf/save', data);
    return response.data;
  }

  async getVersions(): Promise<any> {
    const response = await this.client.get<any>('/versions/list');
    return response.data;
  }

  async getVersionLogs(): Promise<any> {
    const response = await this.client.get<any>('/versions/logs');
    return response.data;
  }

  async createVersion(data: { user?: string; notes?: string }): Promise<any> {
    const response = await this.client.post<any>('/versions/create', data);
    return response.data;
  }

  async rollbackVersion(id: string): Promise<any> {
    const response = await this.client.post<any>(`/versions/rollback/${id}`);
    return response.data;
  }

  async getVersionDiff(id: string): Promise<any> {
    const response = await this.client.get<any>(`/versions/diff/${id}`);
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
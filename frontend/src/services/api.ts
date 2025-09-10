import type { Job, JobLog, CreateJobRequest, UpdateJobRequest } from '../types/api.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the default error message
        }
        throw new Error(errorMessage);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Jobs API
  async createJob(jobData: CreateJobRequest): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async getJobs(limit = 20, offset = 0): Promise<Job[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request<Job[]>(`/jobs?${params}`);
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async updateJob(id: string, jobData: UpdateJobRequest): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: string): Promise<void> {
    return this.request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async runJob(id: string): Promise<JobLog> {
    return this.request<JobLog>(`/jobs/${id}/run`, {
      method: 'POST',
    });
  }

  async getJobLogs(id: string, limit = 50, offset = 0): Promise<JobLog[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return this.request<JobLog[]>(`/jobs/${id}/logs?${params}`);
  }

  // Test job endpoint server-side to avoid CORS
  async testJobEndpoint(payload: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<{ status: number; status_text: string; headers: Record<string, string>; body: any; }> {
    return this.request(`/jobs/test`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Auth API
  async getProfile(): Promise<any> {
    return this.request<any>('/profile');
  }

  // Test API (no auth required)
  async testConnection(): Promise<any> {
    return this.request<any>('/test');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

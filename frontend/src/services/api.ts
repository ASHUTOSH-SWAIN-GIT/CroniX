import type { Job, JobLog, CreateJobRequest, UpdateJobRequest } from '../types/api.js';
import { cache, CACHE_TYPES } from '../utils/cache.js';

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
      credentials: 'include',
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

  // Jobs API with caching
  async createJob(jobData: CreateJobRequest): Promise<Job> {
    const result = await this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    
    // Invalidate jobs list cache
    console.log('Creating job, invalidating jobs list cache');
    cache.invalidate(CACHE_TYPES.JOBS_LIST);
    
    return result;
  }

  async getJobs(limit = 20, offset = 0): Promise<Job[]> {
    // Check cache first
    const cacheKey = `${limit}-${offset}`;
    const cached = cache.get<Job[]>(CACHE_TYPES.JOBS_LIST, cacheKey);
    if (cached) {
      console.log(`Jobs cache hit for key: ${cacheKey}`);
      return cached;
    }

    console.log(`Jobs cache miss for key: ${cacheKey}, fetching from API`);
    // Fetch from API
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const result = await this.request<Job[]>(`/jobs?${params}`);
    
    // Cache the result
    cache.set(CACHE_TYPES.JOBS_LIST, result, cacheKey);
    console.log(`Cached jobs for key: ${cacheKey}`);
    
    return result;
  }

  async getJob(id: string): Promise<Job> {
    // Check cache first
    const cached = cache.get<Job>(CACHE_TYPES.JOB_DETAILS, id);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const result = await this.request<Job>(`/jobs/${id}`);
    
    // Cache the result
    cache.set(CACHE_TYPES.JOB_DETAILS, result, id);
    
    return result;
  }

  async updateJob(id: string, jobData: UpdateJobRequest): Promise<Job> {
    const result = await this.request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
    
    // Invalidate related caches
    cache.invalidate(CACHE_TYPES.JOBS_LIST);
    cache.invalidate(CACHE_TYPES.JOB_DETAILS, id);
    
    return result;
  }

  async deleteJob(id: string): Promise<void> {
    await this.request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
    
    // Invalidate related caches
    cache.invalidate(CACHE_TYPES.JOBS_LIST);
    cache.invalidate(CACHE_TYPES.JOB_DETAILS, id);
    cache.invalidate(CACHE_TYPES.JOB_LOGS, id);
  }

  async runJob(id: string): Promise<JobLog> {
    const result = await this.request<JobLog>(`/jobs/${id}/run`, {
      method: 'POST',
    });
    
    // Invalidate job logs cache
    cache.invalidate(CACHE_TYPES.JOB_LOGS, id);
    
    return result;
  }

  async getJobLogs(id: string): Promise<JobLog[]> {
    // Do not cache job logs; always fetch fresh 5 most recent logs
    const cacheBuster = Date.now();
    return this.request<JobLog[]>(`/jobs/${id}/logs?_=${cacheBuster}`, {
      cache: 'no-store',
    });
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

  // Auth API with caching
  async getProfile(): Promise<any> {
    // Check cache first
    const cached = cache.get<any>(CACHE_TYPES.USER_PROFILE);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const result = await this.request<any>('/profile');
    
    // Cache the result
    cache.set(CACHE_TYPES.USER_PROFILE, result);
    
    return result;
  }

  // Test API (no auth required)
  async testConnection(): Promise<any> {
    return this.request<any>('/test');
  }

  // Logout (no auth required)
  async logout(): Promise<void> {
    // Use direct fetch since this endpoint is outside the /api group
    const response = await fetch(`${this.baseURL.replace('/api', '')}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
    }
  }

  // Cache management methods
  clearCache(): void {
    cache.clear();
  }

  invalidateCache(type: string, identifier?: string): void {
    cache.invalidate(type, identifier);
  }

  clearJobCache(jobId: string): void {
    cache.clearJobCache(jobId);
  }

  async cleanupAllLogs(): Promise<void> {
    await this.request('/jobs/cleanup-logs', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

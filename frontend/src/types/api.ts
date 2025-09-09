// API Types matching the backend structure

export interface Job {
  id: string;
  user_id: string;
  name: string;
  schedule: string;
  endpoint: string;
  method: string;
  headers: string; // JSON string from backend
  body: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: string;
  response_code: number | null;
  error: string | null;
}

export interface CreateJobRequest {
  name: string;
  schedule: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  active: boolean;
}

export interface UpdateJobRequest {
  name?: string;
  schedule?: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  active?: boolean;
}
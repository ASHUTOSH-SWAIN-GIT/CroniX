-- +goose Up
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule TEXT NOT NULL, -- cron spec like "*/5 * * * *"
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET',
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    body TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(active);

CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INT,
    status TEXT NOT NULL, -- success|failure
    response_code INT,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_started_at ON job_logs(started_at);

-- +goose Down
DROP TABLE IF EXISTS job_logs;
DROP TABLE IF EXISTS jobs;

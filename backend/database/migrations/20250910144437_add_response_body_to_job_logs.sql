-- +goose Up
ALTER TABLE job_logs ADD COLUMN IF NOT EXISTS response_body TEXT;

-- +goose Down
ALTER TABLE job_logs DROP COLUMN IF EXISTS response_body;
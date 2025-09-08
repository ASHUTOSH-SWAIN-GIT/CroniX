-- name: CreateJob :one
INSERT INTO jobs (user_id, name, schedule, endpoint, method, headers, body, active)
VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, true))
RETURNING *;

-- name: GetJob :one
SELECT * FROM jobs WHERE id = $1;

-- name: ListJobsByUser :many
SELECT * FROM jobs
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateJob :one
UPDATE jobs
SET
  name = COALESCE($2, name),
  schedule = COALESCE($3, schedule),
  endpoint = COALESCE($4, endpoint),
  method = COALESCE($5, method),
  headers = COALESCE($6, headers),
  body = COALESCE($7, body),
  active = COALESCE($8, active),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteJob :exec
DELETE FROM jobs WHERE id = $1;

-- name: InsertJobLog :one
INSERT INTO job_logs (job_id, started_at, finished_at, duration_ms, status, response_code, error)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListJobLogs :many
SELECT * FROM job_logs
WHERE job_id = $1
ORDER BY started_at DESC
LIMIT $2 OFFSET $3;

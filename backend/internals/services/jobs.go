package services

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"cronix.ashutosh.net/internals/db"
)

type JobsService struct{
	q *db.Queries
}


func NewJobsService(q *db.Queries) *JobsService {return &JobsService{q:q}}


func (s *JobsService) Create(ctx context.Context, userID pgtype.UUID, name, sched, endpoint, method string, headers map[string]string, body *string, active bool) (db.Job, error) {
	h, _ := json.Marshal(headers)
	return s.q.CreateJob(ctx, db.CreateJobParams{
		UserID:   userID,
		Name:     name,
		Schedule: sched,
		Endpoint: endpoint,
		Method:   method,
		Headers:  h,
		Body:     pgtype.Text{String: getStr(body), Valid: body != nil},
		Active:   active,
	})
}


func(s *JobsService) Update(ctx context.Context , userID pgtype.UUID , limit , offset int32)([]db.Job,error){
	return s.q.ListJobsByUser(ctx,db.ListJobsByUserParams{UserID:userID, Limit:limit , Offset:offset})
}

func (s *JobsService) Get(ctx context.Context, id pgtype.UUID) (db.Job, error) {
	return s.q.GetJob(ctx, id)
}

func (s *JobsService) Delete(ctx context.Context, id pgtype.UUID) error {
	return s.q.DeleteJob(ctx, id)
}

func (s *JobsService)RunOnce(ctx context.Context , job db.Job)(db.JobLog, error){
	start := time.Now()
	code := 0
	status := "success"

	var errStr string

	reqBody := []byte(nil)
	if job.Body.Valid{reqBody = []byte(job.Body.String)}
	req,_ := http.NewRequest(job.Method , job.Endpoint , bytes.NewReader(reqBody))

	if len(job.Headers)>0 {
		var hdr map[string]string
		_ = json.Unmarshal(job.Headers , &hdr)
		for k , v := range hdr {req.Header.Set(k,v)}
	}


	resp , err := http.DefaultClient.Do(req)
	if err != nil {status,errStr = "failure" , err.Error()}
	if resp != nil {code = resp.StatusCode}

	dur := int32(time.Since(start).Milliseconds())
	return s.q.InsertJobLog(ctx , db.InsertJobLogParams{
		JobID: job.ID,
		StartedAt: pgtype.Timestamptz{Time: start , Valid: true},
		FinishedAt: pgtype.Timestamptz{Time: time.Now() , Valid: true},
		DurationMs: pgtype.Int4{Int32: dur , Valid: true},
		Status: status,
		ResponseCode: pgtype.Int4{Int32: int32(code) , Valid: resp != nil},
		Error: pgtype.Text{String: errStr,Valid: errStr != ""},
	})
}


func toTextPtr(s *string) pgtype.Text {
	if s == nil { return pgtype.Text{} }
	return pgtype.Text{String: *s, Valid: true}
}
func toJSONBPtr(b []byte, ok bool) []byte {
	if !ok { return nil }
	return b
}
func toBoolPtr(b *bool) pgtype.Bool {
	if b == nil { return pgtype.Bool{} }
	return pgtype.Bool{Bool: *b, Valid: true}
}
func getStr(s *string) string {
	if s == nil { return "" }
	return *s
}

package services

import (
	"context"
	"log"

	"time"

	"cronix.ashutosh.net/internals/db"
	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	c   *cron.Cron
	js  *JobsService
	ids map[string]cron.EntryID
}

func NewScheduler(js *JobsService) *Scheduler {
	return &Scheduler{
		c:   cron.New(cron.WithSeconds()),
		js:  js,
		ids: make(map[string]cron.EntryID),
	}
}
func (s *Scheduler) Start(ctx context.Context, jobs []db.Job) error {
	for _, j := range jobs {
		if j.Active {
			_ = s.AddJob(j)
		}

	}
	s.c.Start()
	return nil
}

func (s *Scheduler) Stop() { s.c.Stop() }

func (s *Scheduler) AddJob(job db.Job) error {
	// If job already scheduled, remove and replace
	if entry, ok := s.ids[job.ID.String()]; ok {
		s.c.Remove(entry)
		delete(s.ids, job.ID.String())
	}

	// Register the cron task; run each fire in its own goroutine with timeout
	id, err := s.c.AddFunc(job.Schedule, func() {
		go func(j db.Job) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("panic in job %s: %v", j.ID.String(), r)
				}
			}()
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if _, err := s.js.RunOnce(ctx, j); err != nil {
				log.Printf("run job %s error: %v", j.ID.String(), err)
			}
		}(job)
	})
	if err != nil {
		return err
	}
	s.ids[job.ID.String()] = id
	return nil
}

func (s *Scheduler) RemoveJob(jobID string) {
	if entry, ok := s.ids[jobID]; ok {
		s.c.Remove(entry)
		delete(s.ids, jobID)
	}
}

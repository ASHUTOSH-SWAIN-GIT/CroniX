package services

import (
	"context"
	"log"

	"cronix.ashutosh.net/internals/db"
	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	c          *cron.Cron
	js         *JobsService
	jobEntries map[string]cron.EntryID // Track job entries by job ID
}

func NewScheduler(js *JobsService) *Scheduler {
	return &Scheduler{
		c:          cron.New(cron.WithSeconds()),
		js:         js,
		jobEntries: make(map[string]cron.EntryID),
	}
}

func (s *Scheduler) Start(ctx context.Context, activeJobs []db.Job) error {
	for _, j := range activeJobs {
		job := j
		// Only schedule active jobs
		if job.Active {
			_, err := s.c.AddFunc(job.Schedule, func() {
				log.Printf("Running job: %s", job.Name)
				_, err := s.js.RunOnce(context.Background(), job)
				if err != nil {
					log.Printf("Job %s failed: %v", job.Name, err)
				} else {
					log.Printf("Job %s completed successfully", job.Name)
				}
			})
			if err != nil {
				log.Printf("Failed to schedule job %s: %v", job.Name, err)
			} else {
				log.Printf("Scheduled job: %s with schedule: %s", job.Name, job.Schedule)
			}
		}
	}
	s.c.Start()
	return nil
}

func (s *Scheduler) Stop() {
	s.c.Stop()
}

// AddJob adds a job to the scheduler
func (s *Scheduler) AddJob(job db.Job) error {
	if !job.Active {
		return nil // Don't schedule inactive jobs
	}

	// Remove existing job if it exists
	s.RemoveJob(job.ID.String())

	entryID, err := s.c.AddFunc(job.Schedule, func() {
		log.Printf("Running job: %s", job.Name)
		_, err := s.js.RunOnce(context.Background(), job)
		if err != nil {
			log.Printf("Job %s failed: %v", job.Name, err)
		} else {
			log.Printf("Job %s completed successfully", job.Name)
		}
	})

	if err != nil {
		log.Printf("Failed to schedule job %s: %v", job.Name, err)
		return err
	}

	s.jobEntries[job.ID.String()] = entryID
	log.Printf("Scheduled job: %s with schedule: %s", job.Name, job.Schedule)
	return nil
}

// RemoveJob removes a job from the scheduler
func (s *Scheduler) RemoveJob(jobID string) {
	if entryID, exists := s.jobEntries[jobID]; exists {
		s.c.Remove(entryID)
		delete(s.jobEntries, jobID)
		log.Printf("Removed job from scheduler: %s", jobID)
	}
}

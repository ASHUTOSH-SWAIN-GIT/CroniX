package services

import (
	"context"

	"cronix.ashutosh.net/internals/db"
	"github.com/robfig/cron/v3"
)


type Scheduler struct{
	c *cron.Cron
	js *JobsService
}

func NewScheduler(js *JobsService) * Scheduler{
	return &Scheduler{c:cron.New(cron.WithSeconds()) , js: js}
}


func(s *Scheduler)Start(ctx context.Context , activeJobs []db.Job) error{
	for _,j := range activeJobs{
		job := j
		_,_ =s.c.AddFunc(job.Schedule,func() {
			_,_ = s.js.RunOnce(context.Background(),job)
		})
	}
	s.c.Start()
	return nil 
}

func (s *Scheduler)Stop(){
	s.c.Stop()
}
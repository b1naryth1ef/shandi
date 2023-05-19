package app

import (
	"time"

	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
)

type eventBatcher struct {
	batch     []*proto.Event
	lastFlush time.Time
}

func newEventBatcher() *eventBatcher {
	return &eventBatcher{
		batch:     make([]*proto.Event, 0),
		lastFlush: time.Now(),
	}
}

func (e *eventBatcher) Push(event *proto.Event) bool {
	e.batch = append(e.batch, event)
	if len(e.batch) > 64 || (time.Now().Sub(e.lastFlush).Seconds() > 1 && len(e.batch) > 0) {
		return true
	}
	return false
}

func (e *eventBatcher) Flush() []*proto.Event {
	oldBatch := e.batch
	e.batch = make([]*proto.Event, 0)
	e.lastFlush = time.Now()
	return oldBatch
}

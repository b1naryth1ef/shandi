package shared

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

type SSEResponse struct {
	w    io.Writer
	f    http.Flusher
	Done chan struct{}
}

func (s *SSEResponse) WriteJSON(data any) error {
	encoded, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return s.Write(encoded)
}

func (s *SSEResponse) Write(data []byte) error {
	outgoing := []byte("data: ")
	outgoing = append(outgoing, data...)
	outgoing = append(outgoing, '\n', '\n')
	_, err := s.w.Write(outgoing)
	if err != nil {
		return err
	}
	s.f.Flush()
	return nil
}

var ErrStreamingUnsupported = errors.New("streaming unsupported")

func NewSSEResponse(w http.ResponseWriter) (*SSEResponse, error) {
	f, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return nil, ErrStreamingUnsupported
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	done := make(chan struct{})
	notify := w.(middleware.WrapResponseWriter).Unwrap().(http.CloseNotifier).CloseNotify()
	go func() {
		<-notify
		close(done)
	}()

	return &SSEResponse{
		w:    w,
		f:    f,
		Done: done,
	}, nil
}

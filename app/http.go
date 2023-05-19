package app

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"sync"

	"github.com/alioygur/gores"
	"github.com/b1naryth1ef/shandi/app/db"
	"github.com/b1naryth1ef/shandi/lsb"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"google.golang.org/protobuf/encoding/protojson"
)

type HTTPServerSettings struct {
	Host *string `json:"host"`
	Port *int    `json:"port"`
}

type HTTPServer struct {
	sync.Mutex

	Port int

	app         *App
	subscribers map[chan []byte]struct{}
	router      *chi.Mux
}

func NewHTTPServer(app *App) *HTTPServer {
	h := &HTTPServer{app: app, subscribers: make(map[chan []byte]struct{})}
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Route("/api", func(r chi.Router) {
		r.Get("/events", h.routeStreamEvents)
		r.Get("/status", h.routeStatus)

		r.Get("/settings", h.routeGetSettings)
		r.Patch("/settings", h.routePatchSettings)

		r.Get("/interfaces", h.routeInterfaces)

		r.Get("/battles", h.routeBattles)
		r.Delete("/battles/{battleId}", h.routeBattleDelete)
		r.Post("/battles/{battleId}/upload", h.routeBattleUpload)
		r.Get("/battles/{battleId}", h.routeBattleGet)
		r.Get("/battles/{battleId}/data", h.routeBattleData)

		r.Post("/setup-npcap", h.routeSetupNpcap)
		r.Post("/update", h.routeUpdate)
		r.Post("/restart", h.routeRestart)

		r.Route("/developer", func(r chi.Router) {
			r.Post("/import", h.routeDevModeImport)
		})
	})
	r.Get("/*", routeServeFrontendAssets)

	h.router = r
	return h
}

func (h *HTTPServer) Run() error {
	var host = "localhost"
	var port = 42424
	if h.app.Opts.Host != nil {
		host = *h.app.Opts.Host
	}
	if h.app.Opts.Port != nil && *h.app.Opts.Port != 0 {
		port = *h.app.Opts.Port
	}

	listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		return err
	}

	h.Port = port

	go http.Serve(listener, h.router)

	return nil
}

func (h *HTTPServer) Subscribe() chan []byte {
	h.Lock()
	defer h.Unlock()
	ch := make(chan []byte)
	h.subscribers[ch] = struct{}{}
	return ch
}

func (h *HTTPServer) Unsubscribe(ch chan []byte) {
	h.Lock()
	defer h.Unlock()
	delete(h.subscribers, ch)
	close(ch)
}

func (h *HTTPServer) Push(data []byte) {
	h.Lock()
	defer h.Unlock()

	for sub := range h.subscribers {
		sub <- data
	}
}

func (h *HTTPServer) routeInterfaces(w http.ResponseWriter, r *http.Request) {
	interfaces, err := GetInterfaces()
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get interfaces: %v", err))
		return
	}
	gores.JSON(w, 200, interfaces)
}

func (h *HTTPServer) routeGetSettings(w http.ResponseWriter, r *http.Request) {
	gores.JSON(w, 200, h.app.Settings)
}

func (h *HTTPServer) routePatchSettings(w http.ResponseWriter, r *http.Request) {
	var settings Settings
	err := json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		gores.Error(w, http.StatusBadRequest, "failed to decode settings")
		return
	}

	h.app.Settings.Update(&settings)
	gores.NoContent(w)
}

type StatusResponse struct {
	LiveCapture *LiveCaptureStatus `json:"live_capture"`
}

func (h *HTTPServer) routeStatus(w http.ResponseWriter, r *http.Request) {
	gores.JSON(w, http.StatusOK, h.app.GetStatus())
}

func (h *HTTPServer) routeStreamEvents(w http.ResponseWriter, r *http.Request) {
	f, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	ch := h.Subscribe()
	defer h.Unsubscribe(ch)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	done := make(chan struct{})
	notify := w.(middleware.WrapResponseWriter).Unwrap().(http.CloseNotifier).CloseNotify()
	go func() {
		<-notify
		close(done)
		logger.Debug().Msg("connection closed")
	}()

	write := func(data []byte) {
		outgoing := []byte("data: ")
		outgoing = append(outgoing, data...)
		outgoing = append(outgoing, '\n', '\n')
		w.Write(outgoing)
		f.Flush()
	}

	func() {
		currentBattle := h.app.LiveCaptureManager.GetCurrentBattle()
		if currentBattle != nil {
			currentBattle := h.app.LiveCaptureManager.GetCurrentBattle()
			if currentBattle == nil {
				return
			}

			currentBattle.Lock()
			currentBattleJSON, err := protojson.Marshal(currentBattle.Battle)
			currentBattle.Unlock()
			if err != nil {
				logger.Error().Err(err).Msg("failed to marshal current live battle")
				return
			}

			data, err := json.Marshal(&Event{
				Event: "LIVE_BATTLE_START",
				Data:  string(currentBattleJSON),
			})
			if err != nil {
				logger.Error().Err(err).Msg("failed to send live battle start")
				return
			}

			write(data)
		}
	}()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			write(msg)
		case <-done:
			return
		}

	}
}

func (h *HTTPServer) routeBattles(w http.ResponseWriter, r *http.Request) {
	battles, err := db.GetBattles(db.GetBattlesOpts{})
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to load battles from database")
		return
	}
	gores.JSON(w, 200, battles)
}

func (h *HTTPServer) routeBattleGet(w http.ResponseWriter, r *http.Request) {
	battleId := chi.URLParam(r, "battleId")

	battle, err := db.GetBattle(battleId)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to get battle")
		return
	}

	gores.JSON(w, http.StatusOK, battle)
}

func (h *HTTPServer) routeBattleDelete(w http.ResponseWriter, r *http.Request) {
	battleId := chi.URLParam(r, "battleId")

	err := db.DeleteBattle(battleId)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to delete battle")
		return
	}

	h.app.PushEvent("BATTLE_DELETE", battleId)

	gores.NoContent(w)
}

func (h *HTTPServer) routeBattleUpload(w http.ResponseWriter, r *http.Request) {
	battleId := chi.URLParam(r, "battleId")

	battleInfo, err := db.GetBattle(battleId)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to load battle")
		logger.Error().Err(err).Msg("failed to load battle")
		return
	}

	opts := lsb.UploadBattleOptions{
		UploadKey: h.app.Settings.Land.UploadKey,
		APIURL:    h.app.Settings.Land.URLOverride,
	}

	if !h.app.Settings.Land.AlwaysReupload {
		if battleInfo.UploadId != nil {
			gores.JSON(w, http.StatusOK, lsb.UploadBattleResult{
				Id:  *battleInfo.UploadId,
				URL: opts.BattleURL(*battleInfo.UploadId),
			})
			return
		}
	}

	battleData, err := db.LoadBattleData(battleId)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to load battle data")
		logger.Error().Err(err).Msg("failed to load battle data")
		return
	}

	battle, err := lsb.DecodeBattle(battleData)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to decode battle data")
		logger.Error().Err(err).Msg("failed to decode battle")
		return
	}

	result, err := lsb.UploadBattle(opts, battle)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to upload battle")
		logger.Error().Err(err).Msg("failed to upload battle")
		return
	}

	err = db.SetBattleUploadId(battleId, result.Id)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to update battle upload id")
		logger.Error().Err(err).Msg("failed to update battle upload id")
		return
	}

	gores.JSON(w, http.StatusOK, result)
}

func (h *HTTPServer) routeBattleData(w http.ResponseWriter, r *http.Request) {
	battleId := chi.URLParam(r, "battleId")

	battle, err := db.LoadBattleData(battleId)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to load battle data")
		return
	}

	w.Write(battle)
}

type importRequest struct {
	Path string `json:"path"`
}

func (h *HTTPServer) routeDevModeImport(w http.ResponseWriter, r *http.Request) {
	contentType := r.Header.Get("Content-type")
	if contentType == "application/json" {
		var req importRequest

		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			gores.Error(w, http.StatusBadRequest, "invalid json payload")
			return
		}

		err = importPcap(h.app, req.Path)
		if err != nil {
			gores.Error(w, http.StatusBadRequest, fmt.Sprintf("failed to import: %v", err))
			return
		}
	} else {
		f, err := os.CreateTemp("", "shandi-pcap-import")
		if err != nil {
			gores.Error(w, http.StatusInternalServerError, "failed to create temporary file")
			return
		}
		defer os.Remove(f.Name()) // clean up

		_, err = io.Copy(f, r.Body)
		if err != nil {
			gores.Error(w, http.StatusInternalServerError, "failed to copy to temporary file")
			return
		}

		f.Close()

		err = importPcap(h.app, f.Name())
		if err != nil {
			gores.Error(w, http.StatusBadRequest, fmt.Sprintf("failed to import: %v", err))
			return
		}
	}

	gores.NoContent(w)
}

func (h *HTTPServer) routeSetupNpcap(w http.ResponseWriter, r *http.Request) {
	err := downloadNpcap()
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to download npcap: %v", err))
		return
	}
	gores.NoContent(w)
}

func (h *HTTPServer) routeUpdate(w http.ResponseWriter, r *http.Request) {
	if h.app.newRelease == nil {
		gores.Error(w, http.StatusBadRequest, "no update available")
		return
	}

	release, err := DownloadRelease(h.app.newRelease)
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to download release: %v", err))
		return
	}

	err = ApplyRelease(release)
	if err != nil {
		logger.Error().Err(err).Msg("failed to apply release")
		gores.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to apply release: %v", err))
		return
	}

	gores.NoContent(w)
}

func (h *HTTPServer) routeRestart(w http.ResponseWriter, r *http.Request) {
	exe, err := os.Executable()
	if err != nil {
		gores.Error(w, http.StatusInternalServerError, "failed to get exec path")
		return
	}

	args := []string{}
	copy(args, os.Args[1:])

	delayed := false
	for _, arg := range args {
		if arg == "--delay" {
			delayed = true
			break
		}
	}
	if !delayed {
		args = append(args, "--delay", "1")
	}

	if runtime.GOOS == "windows" {
		winargs := []string{
			"/C", "start", "/b", exe,
		}
		winargs = append(winargs, args...)

		cmd := exec.Command("cmd.exe", winargs...)
		if err := cmd.Run(); err != nil {
			gores.Error(w, http.StatusInternalServerError, fmt.Sprintf("Error starting new process: %v", err))
			return
		}
		gores.NoContent(w)
	} else if runtime.GOOS == "linux" {
		lnxargs := []string{
			"-ec", exe,
		}
		lnxargs = append(lnxargs, args...)

		cmd := exec.Command("bash", lnxargs...)
		if err := cmd.Run(); err != nil {
			gores.Error(w, http.StatusInternalServerError, fmt.Sprintf("Error starting new process: %v", err))
			return
		}

		gores.NoContent(w)
	} else {
		gores.Error(w, http.StatusBadRequest, fmt.Sprintf("cannot restart on platform GOOS='%s' GOARCH='%s'", runtime.GOOS, runtime.GOARCH))
	}

	h.app.Exit()
}

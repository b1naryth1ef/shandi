package app

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/b1naryth1ef/shandi/app/db"
	"github.com/b1naryth1ef/shandi/logging"
	"github.com/b1naryth1ef/shandi/lsb"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/b1naryth1ef/shandi/poodle"
	"github.com/b1naryth1ef/shandi/protocol"
	"github.com/google/go-github/v52/github"
	"github.com/rs/zerolog"
	"github.com/spacemeshos/poet/appdata"
	"google.golang.org/protobuf/encoding/protojson"
)

var logger zerolog.Logger

type Opts struct {
	Host         *string
	Port         *int
	Headless     bool
	DevWebServer bool
}

type App struct {
	Opts               Opts
	Settings           *Settings
	HTTPServer         *HTTPServer
	LiveCaptureManager *LiveCaptureManager

	newRelease *github.RepositoryRelease

	logger     *AppLogger
	window     WindowImpl
	poodlePath string

	packetStreamStats *protocol.PacketStreamStats
}

type AppLogger struct {
	app *App
}

func (a *AppLogger) Write(p []byte) (n int, err error) {
	err = a.app.PushEvent("APP_LOG", string(p))
	return len(p), err
}

func NewApp(opts Opts) (*App, error) {
	err := CleanupOldRelease()
	if err != nil {
		return nil, err
	}

	dataPath := appdata.AppDataDir("shandi", true)
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		os.Mkdir(dataPath, os.ModePerm)
	}

	appLogger := &AppLogger{}
	logPath := filepath.Join(dataPath, "latest.log")
	logger = logging.SetupLogger(logPath, appLogger)

	settings, err := NewSettings(dataPath)
	if err != nil {
		return nil, err
	}

	err = settings.Load()
	if err != nil {
		return nil, err
	}

	err = db.OpenDatabase(filepath.Join(dataPath, "data.db"))
	if err != nil {
		return nil, err
	}

	poodleName, poodleData := poodle.GetSharedLibrary()
	var poodlePath string = filepath.Join(dataPath, poodleName)
	if _, err := os.Stat(poodlePath); os.IsNotExist(err) {
		err = ioutil.WriteFile(poodlePath, poodleData, os.ModePerm)
		if err != nil {
			return nil, err
		}
	}

	app := &App{
		Opts:              opts,
		Settings:          settings,
		poodlePath:        poodlePath,
		logger:            appLogger,
		packetStreamStats: &protocol.PacketStreamStats{},
	}

	// ayyylmao
	appLogger.app = app
	batcher := newEventBatcher()

	app.LiveCaptureManager = NewLiveCaptureManager(CaptureCtx{
		PoodlePath: poodlePath,
		Stats:      app.packetStreamStats,
		OnBattleStart: func(battle *lsb.PendingBattle) {
			app.PushEvent("LIVE_BATTLE_START", nil)
		},
		OnBattleDone: func(battle *proto.Battle) {
			if app.Settings.AutoSave == nil {
				return
			}

			if !app.Settings.AutoSave.UnknownEncounters && battle.EncounterId == 0 {
				return
			}

			id, err := db.SaveBattle(battle)
			if err != nil {
				logger.Error().Err(err).Msg("failed to save battle")
				return
			}

			if app.Settings.Land.AutoUpload {
				result, err := lsb.UploadBattle(lsb.UploadBattleOptions{
					UploadKey: app.Settings.Land.UploadKey,
					APIURL:    app.Settings.Land.URLOverride,
				}, battle)
				if err != nil {
					logger.Error().Err(err).Msg("failed to upload battle")
					return
				}

				err = db.SetBattleUploadId(id, result.Id)
				if err != nil {
					logger.Error().Err(err).Msg("failed to set battle upload id")
					return
				}
			}
		},
		OnEvent: func(event *proto.Event) {
			if batcher.Push(event) {
				batch := batcher.Flush()
				batchJSON, err := protojson.Marshal(&proto.EventsBatch{
					Events: batch,
				})
				if err != nil {
					logger.Panic().Err(err).Msg("failed to marshal events batch")
					return
				}

				app.PushEvent("LIVE_BATTLE_EVENTS", string(batchJSON))
			}
		},
	})
	app.HTTPServer = NewHTTPServer(app)
	settings.OnUpdate = app.onSettingsUpdate

	go func() {
		app.checkForUpdates()
		time.Sleep(time.Hour * 4)
	}()

	return app, nil
}

func (a *App) checkForUpdates() {
	a.newRelease = GetNewRelease()
	if a.newRelease != nil {
		logger.Info().Interface("release", a.newRelease).Msg("new release is available")
	}
}

func (a *App) onSettingsUpdate() {
	err := a.LiveCaptureManager.SetInterfaceName(a.Settings.CaptureInterfaceName)
	if err != nil {
		logger.Error().Err(err).Msg("failed to set interface name for live capture")
	}

	a.PushEvent("SETTINGS_UPDATE", a.Settings)
}

type Event struct {
	Event string `json:"e"`
	Data  any    `json:"d"`
}

func (a *App) PushEvent(event string, data any) error {
	e := &Event{
		Event: event,
		Data:  data,
	}
	encoded, err := json.Marshal(e)
	if err != nil {
		return err
	}

	a.HTTPServer.Push(encoded)
	return nil
}

type Status struct {
	GameVersion       *string                    `json:"game_version"`
	LiveCapture       *LiveCaptureStatus         `json:"live_capture"`
	NewVersion        bool                       `json:"new_version"`
	LocalCharacter    json.RawMessage            `json:"local_character"`
	PacketStreamStats protocol.PacketStreamStats `json:"packet_stream_stats"`
}

func (a *App) GetStatus() *Status {
	var gameVersionPtr *string
	gameVersion := GetGameVersion()
	if gameVersion != "" {
		gameVersionPtr = &gameVersion
	}

	status := &Status{
		GameVersion:       gameVersionPtr,
		LiveCapture:       a.LiveCaptureManager.GetStatus(),
		NewVersion:        a.newRelease != nil,
		PacketStreamStats: *a.packetStreamStats,
	}

	gen := a.LiveCaptureManager.GetCurrentGenerator()
	if gen != nil {
		localCharacter := gen.GetCurrentCharacter()
		if localCharacter != nil {
			data, err := protojson.Marshal(localCharacter)
			if err != nil {
				logger.Error().Err(err).Interface("character", localCharacter).Msg("failed to marshal local character")
			} else {
				status.LocalCharacter = data
			}
		}
	}

	return status
}

func (a *App) Exit() {
	a.window.Quit()
}

func (a *App) Show() {
	a.window.Show()
}

func (a *App) Run() {
	a.onSettingsUpdate()

	err := a.HTTPServer.Run()
	if err != nil {
		// TODO: detect process already running (e.g. server port already bound) and maximize that instance?
		logger.Panic().Err(err).Msg("Error starting HTTP server")
		return
	}

	logger.Info().Msgf("Listening on localhost:%d", a.HTTPServer.Port)

	go func() {
		for {
			time.Sleep(time.Second * 6)
			a.PushEvent("STATUS_UPDATE", a.GetStatus())
		}
	}()

	if !a.Opts.Headless {
		start, end := setupSystray(a)

		url := fmt.Sprintf("http://localhost:%d/", a.HTTPServer.Port)

		if a.Opts.DevWebServer {
			url = "http://localhost:5173/"
		}
		a.window = NewWindow(url, a.Settings)
		start()
		a.window.Run()
		defer end()
	} else {
		sigs := make(chan os.Signal, 1)
		signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
		<-sigs
	}
}

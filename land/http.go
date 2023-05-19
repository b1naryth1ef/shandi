package land

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/alioygur/gores"
	"github.com/b1naryth1ef/shandi/land/db"
	"github.com/b1naryth1ef/shandi/lsb"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/rs/zerolog"
)

var logger zerolog.Logger

type HTTPServer struct {
	router *chi.Mux
}

func NewHTTPServer() *HTTPServer {
	initializeDiscordAuth()

	logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).With().Timestamp().Logger().Level(zerolog.DebugLevel)

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	http := &HTTPServer{router: r}
	r.Get("/*", routeServeFrontendAssets)

	// api routes
	r.Route("/api", func(r chi.Router) {
		r.Use(cors.Handler(cors.Options{
			AllowedOrigins:   []string{"https://*", "http://*"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
			AllowCredentials: false,
			MaxAge:           300,
		}))
		r.Use(http.authMiddleware)
		r.Post("/battles", http.routeUploadBattle)
		r.Get("/battles", http.routeListBattles)
		r.Get("/battles/{id}", http.routeGetBattle)
		r.Delete("/battles/{id}", http.routeDeleteBattle)
		r.Get("/battles/{id}/data", http.routeGetBattleData)
		r.Patch("/battles/{id}", http.routeUpdateBattle)

		r.Get("/user", http.routeGetCurrentUser)

		r.Get("/login", http.routeGetLoginDiscordRoute)
		r.Get("/login/callback", http.routeGetLoginDiscordCallbackRoute)

		r.Post("/upload-keys", http.routeCreateUploadKey)
		r.Delete("/upload-keys/{key}", http.routeDeleteUploadKey)
	})

	return http
}

func (h *HTTPServer) Run(bind string) error {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	done := make(chan bool, 1)
	go func() {
		<-sigs
		done <- true
	}()

	go func() {
		panic(http.ListenAndServe(bind, h.router))
	}()

	<-done
	return nil
}

const MAX_LSB_FILE_SIZE = 1_000_000

func (h *HTTPServer) routeUploadBattle(w http.ResponseWriter, r *http.Request) {
	data, err := ioutil.ReadAll(r.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read body for log create")
		gores.Error(w, 400, "failed to read body")
		return
	}

	if len(data) > MAX_LSB_FILE_SIZE {
		gores.Error(w, 400, "body too large")
		return
	}

	battle, err := lsb.DecodeBattle(data)
	if err != nil {
		logger.Error().Err(err).Msg("failed to decode battle for log create")
		gores.Error(w, 400, fmt.Sprintf("failed to decode: %s", err))
		return
	}

	var ownerId *string
	currentUser := h.currentUser(w, r, false, true)
	if currentUser != nil {
		ownerId = &currentUser.DiscordID
	}

	visibility := lsb.VISIBILITY_UNLISTED
	query := r.URL.Query()
	visibilityRaw := query.Get("visibility")
	if visibilityRaw != "" {
		value, err := strconv.Atoi(visibilityRaw)
		if err != nil {
			gores.Error(w, 400, "failed to process visibility")
			return
		}

		if value == lsb.VISIBILITY_PRIVATE && ownerId == nil {
			gores.Error(w, 400, "anonymous log cannot be private")
			return
		} else if value != lsb.VISIBILITY_UNLISTED && value != lsb.VISIBILITY_PUBLIC && value != lsb.VISIBILITY_PRIVATE {
			gores.Error(w, 400, "invalid visibility")
			return
		}

		visibility = value
	}

	id, err := db.CreateBattle(battle, visibility, ownerId)
	if err != nil {
		logger.Error().Err(err).Msg("failed to write to database for log create")
		gores.Error(w, 500, "failed to write to database")
		return
	}

	gores.JSON(w, 200, map[string]interface{}{
		"id": id,
	})
}

func processIntList(raw string) ([]int, error) {
	parts := strings.Split(raw, ",")
	result := []int{}
	for _, part := range parts {
		value, err := strconv.Atoi(part)
		if err != nil {
			return nil, err
		}
		result = append(result, value)
	}
	return result, nil
}

func (h *HTTPServer) routeListBattles(w http.ResponseWriter, r *http.Request) {
	currentUser := h.currentUser(w, r, false, false)

	opts := db.ListBattleOpts{
		Limit: 25,
	}
	if currentUser != nil {
		opts.UserId = &currentUser.DiscordID
	}

	query := r.URL.Query()
	encounterIdsRaw := query.Get("encounter_ids")
	if encounterIdsRaw != "" {
		encounterIds, err := processIntList(encounterIdsRaw)
		if err != nil {
			gores.Error(w, 400, "invalid encounter_ids value")
			return
		}

		opts.EncounterIds = encounterIds
	}

	onlyClears := query.Get("only_clears")
	if onlyClears != "" && onlyClears != "0" {
		opts.Results = []proto.BattleResult{
			proto.BattleResult_DUNGEON_CLEAR,
		}
	}

	pageRaw := query.Get("page")
	if pageRaw != "" {
		page, err := strconv.Atoi(pageRaw)
		if err != nil {
			gores.Error(w, 400, "invalid page value")
			return
		}
		opts.Page = page
	}

	battles, err := db.ListBattles(opts)
	if err != nil {
		logger.Error().Err(err).Msg("failed to fetch battles from database")
		gores.Error(w, 500, "failed to read from database")
		return
	}

	gores.JSON(w, 200, battles)
}

func canAccessBattle(user *db.User, battle *db.Battle, write bool) bool {
	if user != nil && user.Role == "admin" {
		return true
	}

	if !write && battle.Visibility != lsb.VISIBILITY_PRIVATE {
		return true
	}

	return user != nil && *battle.OwnerId == user.DiscordID
}

func (h *HTTPServer) routeGetBattle(w http.ResponseWriter, r *http.Request) {
	logId := chi.URLParam(r, "id")
	battle, err := db.GetBattle(logId, db.GetBattleOpts{})
	if err != nil {
		logger.Error().Str("id", logId).Err(err).Msg("failed to fetch battle from database")
		gores.Error(w, 500, "failed to read from database")
		return
	}

	currentUser := h.currentUser(w, r, false, false)
	if !canAccessBattle(currentUser, battle, false) {
		gores.Error(w, 404, "not found")
		return
	}

	gores.JSON(w, 200, battle)
}

func (h *HTTPServer) routeDeleteBattle(w http.ResponseWriter, r *http.Request) {
	logId := chi.URLParam(r, "id")
	battle, err := db.GetBattle(logId, db.GetBattleOpts{})
	if err != nil {
		logger.Error().Str("id", logId).Err(err).Msg("failed to fetch battle from database")
		gores.Error(w, 500, "failed to read from database")
		return
	}

	currentUser := h.currentUser(w, r, true, false)
	if currentUser == nil {
		return
	}

	if !canAccessBattle(currentUser, battle, true) {
		gores.Error(w, 404, "not found")
		return

	}

	err = db.DeleteBattle(logId)
	if err != nil {
		logger.Error().Str("id", logId).Err(err).Msg("failed to delete battle from database")
		gores.Error(w, 500, "failed to delete from database")
		return
	}

	gores.NoContent(w)
}

type UpdateBattleRequest struct {
	Visibility *lsb.Visibility `json:"visibility"`
}

func (h *HTTPServer) routeUpdateBattle(w http.ResponseWriter, r *http.Request) {
	logId := chi.URLParam(r, "id")
	battle, err := db.GetBattle(logId, db.GetBattleOpts{})
	if err != nil {
		logger.Error().Str("id", logId).Err(err).Msg("failed to fetch battle from database")
		gores.Error(w, 500, "failed to read from database")
		return
	}

	currentUser := h.currentUser(w, r, true, false)
	if currentUser == nil || !canAccessBattle(currentUser, battle, true) {
		gores.Error(w, 404, "not found")
		return
	}

	var request UpdateBattleRequest
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		gores.Error(w, 400, "invalid request body")
		return
	}

	update := map[string]interface{}{}
	if request.Visibility != nil {
		if *request.Visibility == lsb.VISIBILITY_PUBLIC && !battle.Anonymized {
			err = db.AnonymizeBattle(battle.Id)
			if err != nil {
				logger.Error().Str("id", logId).Err(err).Msg("failed to anonymize battle")
				gores.Error(w, 500, "failed to update battle")
				return
			}
		}

		update["visibility"] = *request.Visibility
	}

	err = db.UpdateBattle(battle.Id, update)
	if err != nil {
		logger.Error().Str("id", logId).Err(err).Msg("failed to update battle")
		gores.Error(w, 500, "failed to update database")
		return

	}

	gores.JSON(w, 200, battle)
}

func (h *HTTPServer) routeGetBattleData(w http.ResponseWriter, r *http.Request) {
	logId := chi.URLParam(r, "id")
	battle, err := db.GetBattle(logId, db.GetBattleOpts{
		IncludeData: true,
	})
	if err != nil {
		logger.Error().Str("id", logId).Err(err).Msg("failed to fetch battle from database")
		gores.Error(w, 500, "failed to read from database")
		return
	}

	currentUser := h.currentUser(w, r, false, false)
	if !canAccessBattle(currentUser, battle, false) {
		gores.Error(w, 404, "not found")
		return
	}

	scope := "public"
	if battle.Visibility == lsb.VISIBILITY_PRIVATE {
		scope = "private"
	}

	w.Header().Set("Cache-Control", fmt.Sprintf("max-age: 3600, stale-while-revalidate=300, %s", scope))
	http.ServeContent(w, r, fmt.Sprintf("%v.lsb", logId), time.Now(), bytes.NewReader(battle.Data))
}

func (h *HTTPServer) routeCreateUploadKey(w http.ResponseWriter, r *http.Request) {
	currentUser := h.currentUser(w, r, true, false)
	if currentUser == nil {
		return
	}

	key, err := db.CreateUserUploadKey(currentUser.DiscordID)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create upload key for user")
		gores.Error(w, 500, "failed to create key")
		return
	}

	gores.JSON(w, 200, key)
}

func (h *HTTPServer) routeDeleteUploadKey(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	err := db.DeleteUserUploadKey(key)
	if err != nil {
		logger.Error().Str("key", key).Err(err).Msg("failed to delete key from database")
		gores.Error(w, 500, "failed to delete key")
		return
	}

	gores.NoContent(w)
}

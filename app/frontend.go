package app

import (
	"bytes"
	"embed"
	"net/http"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
)

//go:embed dist/*
var frontendAssets embed.FS

func routeServeFrontendAssets(w http.ResponseWriter, r *http.Request) {
	param := chi.URLParam(r, "*")

	if param == "" {
		param = "index.html"
	}

	f, err := frontendAssets.ReadFile("dist/" + param)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	fileName := filepath.Base(param)
	http.ServeContent(w, r, fileName, time.Now(), bytes.NewReader(f))
}

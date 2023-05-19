package app

import (
	"encoding/json"
	"runtime"

	"github.com/b1naryth1ef/wv2"
	"github.com/b1naryth1ef/wv2/webviewloader"
	"github.com/pkg/browser"
)

func init() {
	runtime.LockOSThread()
}

type Window struct {
	window   *wv2.Window
	settings *Settings
}

func NewWindow(url string, settings *Settings) *Window {
	installedVersion, err := webviewloader.GetAvailableCoreWebView2BrowserVersionString("")
	if err != nil {
		panic(err)
	}

	logger.Info().Str("version", installedVersion).Msg("WebView2 installed version")

	return &Window{
		window: wv2.NewWindow(wv2.WindowOpts{
			InitialURL:    url,
			Frameless:     true,
			InitialWidth:  800,
			InitialHeight: 600,
			DataPath:      settings.DataPath,
		}),
		settings: settings,
	}
}

type message struct {
	Event string `json:"e"`
	Data  any    `json:"d"`
}

func (w *Window) Show() {
	w.window.Show()
}

func (w *Window) Quit() {
	w.window.Quit()
}

func (w *Window) Run() {
	settings, err := w.window.Chromium.GetSettings()
	if err != nil {
		panic(err)
	}

	w.window.Chromium.MessageCallback = func(raw string) {
		var msg message
		err := json.Unmarshal([]byte(raw), &msg)
		if err != nil {
			logger.Error().Err(err).Str("raw", raw).Msg("failed decoding webview message callback")
			return
		}
		if msg.Event == "resize" {
			w.window.StartResize(msg.Data.(string))
		} else if msg.Event == "minimize" {
			w.window.Minimize()
		} else if msg.Event == "close" {
			if w.settings.RunInBackground {
				w.window.Hide()
			} else {
				w.window.Quit()
			}
		} else if msg.Event == "quit" {
			w.window.Quit()
		} else if msg.Event == "open-in-external-browser" {
			browser.OpenURL(msg.Data.(string))
		}
	}

	settings.PutIsStatusBarEnabled(false)
	settings.PutAreBrowserAcceleratorKeysEnabled(false)
	settings.PutIsSwipeNavigationEnabled(false)

	w.window.Run()
}

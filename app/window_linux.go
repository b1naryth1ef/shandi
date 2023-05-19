package app

import (
	"runtime"

	"github.com/webview/webview"
)

func init() {
	runtime.LockOSThread()
}

type Window struct {
	view     webview.WebView
	settings *Settings
}

func NewWindow(url string, settings *Settings) *Window {
	w := webview.New(true)
	w.SetTitle("shandi")
	w.SetSize(800, 600, webview.HintNone)
	w.Navigate(url)
	return &Window{view: w, settings: settings}
}

func (w *Window) Show() {

}

func (w *Window) Quit() {

}

func (w *Window) Run() {
	w.view.Run()
}

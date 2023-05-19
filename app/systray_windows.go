package app

import (
	"github.com/b1naryth1ef/shandi/data"
	"github.com/energye/systray"
)

func setupSystray(app *App) (func(), func()) {
	return systray.RunWithExternalLoop(func() {
		systray.SetTitle("shandi")
		systray.SetIcon(data.AppIcon)
		systray.SetOnClick(func() {
			app.Show()
		})

		// settings := systray.AddMenuItem("Settings", "Open Settings")
		// settings.Enable()
		// settings.Click(func() {
		// 	// if app.settingsWindow == nil {
		// 	// 	app.settingsWindow = NewSettingsWindow(app.settings)
		// 	// }
		// })

		quit := systray.AddMenuItem("Quit", "Quit Shandeez")
		quit.Enable()
		quit.Click(func() {
			app.Exit()
		})
	}, func() {
		app.Exit()
	})

}

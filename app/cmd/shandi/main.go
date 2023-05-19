package main

import (
	"os"
	"time"

	"github.com/b1naryth1ef/shandi/app"
	"github.com/urfave/cli/v2"
)

func run(ctx *cli.Context) error {
	var hostPtr *string
	if host := ctx.String("host"); host != "" {
		hostPtr = &host
	}

	var portPtr *int
	if ctx.IsSet("port") {
		port := ctx.Int("port")
		portPtr = &port
	}

	delay := ctx.Int("delay")
	if delay > 0 {
		time.Sleep(time.Second * time.Duration(delay))
	}

	a, err := app.NewApp(app.Opts{
		Headless:     ctx.Bool("headless"),
		DevWebServer: ctx.Bool("dev-web-server"),
		Host:         hostPtr,
		Port:         portPtr,
	})
	if err != nil {
		return err
	}
	a.Run()
	return nil
}

func main() {
	err := (&cli.App{
		Name:        "shandi",
		Action:      run,
		Version:     app.GetVersion(),
		Description: "Lost Ark DPS Meter",
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:  "headless",
				Usage: "run in a headless mode without any UI",
			},
			&cli.BoolFlag{
				Name:  "dev-web-server",
				Usage: "enable developer web server",
			},
			&cli.StringFlag{
				Name:  "host",
				Usage: "set the host to bind too",
			},
			&cli.IntFlag{
				Name:  "port",
				Usage: "set the port to bind too",
			},
			&cli.IntFlag{
				Name:  "delay",
				Usage: "launch after this many seconds",
			},
		},
	}).Run(os.Args)

	if err != nil {
		panic(err)
	}
}

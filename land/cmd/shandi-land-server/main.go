package main

import (
	"log"
	"os"
	"strings"

	"github.com/b1naryth1ef/shandi/land"
	"github.com/b1naryth1ef/shandi/land/db"
	"github.com/spf13/viper"
	"github.com/urfave/cli/v2"
)

func run(ctx *cli.Context) error {
	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	viper.SetDefault("db_path", "shandi_land.db")

	replacer := strings.NewReplacer(".", "_")
	viper.SetEnvKeyReplacer(replacer)
	viper.ReadInConfig()

	err := db.OpenDatabase(viper.GetString("db_path"))
	if err != nil {
		return err
	}

	http := land.NewHTTPServer()
	log.Printf("Running server on %v", ctx.String("bind"))
	return http.Run(ctx.String("bind"))
}

func main() {
	err := (&cli.App{
		Name:        "web-server",
		Action:      run,
		Description: "Shandi Land web server",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "bind",
				Value: "localhost:9282",
			},
			&cli.PathFlag{
				Name:  "config",
				Value: "config.json",
				Usage: "path to JSON configuration file",
			},
		},
	}).Run(os.Args)

	if err != nil {
		panic(err)
	}
}

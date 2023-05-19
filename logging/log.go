package logging

import (
	"io"
	"os"

	"github.com/rs/zerolog"
)

func SetupLogger(path string, writers ...io.Writer) zerolog.Logger {
	if path != "" {
		fileLogger, err := os.Create(path)
		if err != nil {
			panic(err)
		}
		writers = append(writers, fileLogger)
	}

	writers = append(writers, zerolog.ConsoleWriter{Out: os.Stderr})

	output := zerolog.MultiLevelWriter(writers...)
	return zerolog.New(output).With().Timestamp().Logger()
}

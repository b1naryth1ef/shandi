package data

import (
	"embed"
	"encoding/json"
	"fmt"
)

//go:embed meter-data/oodle_state.bin
var OodleStateBin []byte

//go:embed meter-data/xor.bin
var XORKeyBin []byte

//go:embed meter-data/databases/*
var databases embed.FS

//go:embed appicon.ico
var AppIcon []byte

//go:embed encounters.json
var encountersJSON []byte

func OpenDatabase(name string) (map[string]interface{}, error) {
	data, err := databases.ReadFile(fmt.Sprintf("meter-data/databases/%v.json", name))
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	err = json.Unmarshal(data, &result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

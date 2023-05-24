package data

import (
	_ "embed"
)

//go:embed meter-data/oodle_state.bin
var OodleStateBin []byte

//go:embed meter-data/xor.bin
var XORKeyBin []byte

//go:embed meter-data/databases/Enums.json
var enumDatabaseRaw []byte

//go:embed appicon.ico
var AppIcon []byte

//go:embed encounters.json
var encountersJSON []byte

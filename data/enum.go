package data

import (
	"encoding/json"
	"log"
	"strconv"

	"golang.org/x/exp/constraints"
)

type Enum map[string]int

var enums map[string]Enum

func EnumValue[T constraints.Integer](name string, key string) T {
	a, ok := enums[name]
	if !ok {
		log.Panicf("Bad enum name: %v", name)
	}
	b, ok := a[key]
	if !ok {
		log.Panicf("Bad enum key for %v: %v", name, key)
	}
	return T(b)
}

func init() {
	var enumData map[string]interface{}

	err := json.Unmarshal(enumDatabaseRaw, &enumData)
	if err != nil {
		panic(err)
	}

	enums = make(map[string]Enum)
	for name, rawData := range enumData {
		enum := make(Enum)

		for k, v := range rawData.(map[string]interface{}) {
			ki, err := strconv.Atoi(k)
			if err != nil {
				panic(err)
			}
			enum[v.(string)] = ki
		}

		enums[name] = enum
	}
}

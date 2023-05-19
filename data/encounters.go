package data

import "encoding/json"

type EncounterTarget struct {
	TypeId uint32 `json:"type_id"`
	MaxHp  uint32 `json:"max_hp"`
}

type Encounter struct {
	Id         int               `json:"id"`
	Name       string            `json:"name"`
	Difficulty string            `json:"difficulty"`
	Category   EncounterCategory `json:"category"`
	Gate       int8              `json:"gate"`
	Targets    []EncounterTarget `json:"target"`
}

type EncounterCategory = string

const (
	ABYSS_RAID          EncounterCategory = "Abyss Raid"
	LEGION_RAID                           = "Legion Raid"
	GUARDIAN_RAID                         = "Guardian Raid"
	TRIAL_GUARDIAN_RAID                   = "Trial Guardian Raid"
)

var EncounterCategories = []EncounterCategory{
	ABYSS_RAID,
	LEGION_RAID,
	GUARDIAN_RAID,
	TRIAL_GUARDIAN_RAID,
}

var Encounters = map[int]*Encounter{}
var entityTypeToEncounter = map[uint32][]*Encounter{}

func init() {
	var encounters []*Encounter

	err := json.Unmarshal(encountersJSON, &encounters)
	if err != nil {
		panic(err)
	}

	for _, encounter := range encounters {
		Encounters[encounter.Id] = encounter
		for _, target := range encounter.Targets {
			if _, ok := entityTypeToEncounter[target.TypeId]; !ok {
				entityTypeToEncounter[target.TypeId] = []*Encounter{encounter}
			} else {
				entityTypeToEncounter[target.TypeId] = append(entityTypeToEncounter[target.TypeId], encounter)
			}
		}
	}

}

func GetEncountersByTypeId(typeId uint32) []*Encounter {
	return entityTypeToEncounter[typeId]
}

func FindEncounterByEntity(typeId, maxHp uint32) *Encounter {
	encounters := entityTypeToEncounter[typeId]
	if encounters == nil {
		return nil
	}

	var first *Encounter
	for _, encounter := range encounters {
		for _, target := range encounter.Targets {
			if target.TypeId != typeId {
				continue
			}

			if first == nil {
				first = encounter
			}

			if target.MaxHp == maxHp {
				return encounter
			}
		}
	}

	return first
}

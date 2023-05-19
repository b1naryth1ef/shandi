package db

import (
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
)

const BATTLE_METADATA_VERSION = 1

type BattleMetadata struct {
	TotalDamage      int        `json:"total_boss_damage"`
	ClassComposition [][]uint32 `json:"class_composition"`
}

func GenerateBattleMetadata(battle *proto.Battle) BattleMetadata {
	var result BattleMetadata

	result.ClassComposition = make([][]uint32, 2)
	for _, player := range battle.Players {
		var classId uint32 = 0
		if player.Character != nil {
			classId = player.Character.ClassId
		}
		result.ClassComposition[player.PartyId-1] = append(result.ClassComposition[player.PartyId-1], classId)
	}

	for _, event := range battle.Events {
		dmg, ok := event.Data.(*proto.Event_Damage)
		if !ok {
			continue
		}

		for _, hit := range dmg.Damage.Hits {
			result.TotalDamage += int(hit.Damage) + int(hit.Dot)
		}
	}

	return result
}

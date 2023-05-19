package lsb

import (
	"sync"
	"time"

	"github.com/b1naryth1ef/shandi/data"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/b1naryth1ef/shandi/protocol"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type PendingBattle struct {
	sync.Mutex

	Battle *proto.Battle
	Done   chan struct{}
}

type Generator struct {
	Battles chan *PendingBattle
	Events  chan *proto.Event

	current               *PendingBattle
	characters            map[uint64]*proto.Character
	characterIdToPlayerId map[uint64]uint64
	playerIdToCharacterId map[uint64]uint64
	entities              map[uint64]*proto.Entity

	currentParty     *protocol.PKTPartyInfo
	localCharacterId uint64
}

func NewGenerator() *Generator {
	return &Generator{
		Battles:               make(chan *PendingBattle, 2),
		characters:            make(map[uint64]*proto.Character),
		characterIdToPlayerId: map[uint64]uint64{},
		playerIdToCharacterId: map[uint64]uint64{},
		entities:              make(map[uint64]*proto.Entity),
	}
}

func (g *Generator) GetCurrentCharacter() *proto.Character {
	return g.characters[g.localCharacterId]
}

func (g *Generator) GetCurrentParty() *protocol.PKTPartyInfo {
	return g.currentParty
}

func (g *Generator) rotate() {
	if g.current != nil {
		if len(g.current.Battle.Events) > 0 {
			g.current.Battle.End = g.current.Battle.Events[len(g.current.Battle.Events)-1].Ts
		}

		// TODO: do we need this?
		if g.currentParty != nil {
			for _, player := range g.current.Battle.Players {
				player.PartyId = 1
			}

			for _, member := range g.currentParty.MemberDatas {
				playerId := g.characterIdToPlayerId[member.CharacterId]
				if player, ok := g.current.Battle.Players[playerId]; ok {
					player.PartyId = 2
				}
			}
		}

		close(g.current.Done)
	}

	g.current = &PendingBattle{
		Done: make(chan struct{}),
		Battle: &proto.Battle{
			Events:   make([]*proto.Event, 0),
			Players:  make(map[uint64]*proto.Player),
			Entities: make(map[uint64]*proto.Entity),
		},
	}
}

func (g *Generator) trackPlayer(ts time.Time, playerId uint64) {
	if _, ok := g.current.Battle.Players[playerId]; ok {
		return
	}

	characterId, ok := g.playerIdToCharacterId[playerId]
	if !ok {
		return
	}

	var partyId uint32 = 1
	if g.currentParty != nil {
		for _, member := range g.currentParty.MemberDatas {
			if member.CharacterId == characterId {
				partyId = 2
				break
			}
		}
	}

	g.current.Battle.Players[playerId] = &proto.Player{
		PartyId:   partyId,
		Character: g.characters[characterId],
		IsLocal:   g.localCharacterId == characterId,
	}

	g.push(ts, &proto.Event{
		Data: &proto.Event_Spawn{
			Spawn: &proto.EventSpawn{
				ObjectId: playerId,
				Object: &proto.EventSpawn_Player{
					Player: g.current.Battle.Players[playerId],
				},
			},
		},
	})
}

func (g *Generator) trackEntity(ts time.Time, entityId uint64) {
	if _, ok := g.current.Battle.Entities[entityId]; ok {
		return
	}

	entity, ok := g.entities[entityId]
	if !ok {
		return
	}

	g.current.Battle.Entities[entityId] = entity
	g.push(ts, &proto.Event{
		Data: &proto.Event_Spawn{
			Spawn: &proto.EventSpawn{
				ObjectId: entityId,
				Object: &proto.EventSpawn_Entity{
					Entity: g.current.Battle.Entities[entityId],
				},
			},
		},
	})
}

func (g *Generator) ProcessPacket(packet *protocol.DecodedPacket) {
	if packet.Decoded == nil {
		return
	}

	if g.current == nil {
		g.rotate()
	}

	if g.current.Battle.Start == nil {
		g.current.Battle.Start = timestamppb.New(packet.Timestamp)
		g.Battles <- g.current
	}

	g.current.Lock()
	defer g.current.Unlock()

	switch pkt := packet.Decoded.(type) {
	case *protocol.PKTNewNpc:
		entity := newEntityFromNPC(&pkt.NpcStruct)
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Spawn{
				Spawn: &proto.EventSpawn{
					ObjectId: pkt.NpcStruct.ObjectId,
					Object: &proto.EventSpawn_Entity{
						Entity: entity,
					},
				},
			},
		})
		g.entities[pkt.NpcStruct.ObjectId] = entity
		g.current.Battle.Entities[pkt.NpcStruct.ObjectId] = entity
		for _, effect := range pkt.NpcStruct.StatusEffectDatas {
			var value uint32
			if effect.Value != nil {
				value = uint32(effect.Value.Data)
			}
			g.push(packet.Timestamp, &proto.Event{
				Data: &proto.Event_StatusEffectAdd{
					StatusEffectAdd: &proto.EventStatusEffectAdd{
						TargetId:         pkt.NpcStruct.ObjectId,
						StatusEffectId:   effect.StatusEffectId,
						EffectInstanceId: effect.EffectInstanceId,
						SourceId:         effect.SourceId,
						EndTick:          effect.EndTick,
						Value:            value,
						TotalTime:        effect.TotalTime,
					},
				},
			})
		}
	case *protocol.PKTNewPC:
		g.characters[pkt.PCStruct.CharacterId] = newCharacterFromPCStruct(&pkt.PCStruct)
		g.characterIdToPlayerId[pkt.PCStruct.CharacterId] = pkt.PCStruct.PlayerId
		g.playerIdToCharacterId[pkt.PCStruct.PlayerId] = pkt.PCStruct.CharacterId

		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Spawn{
				Spawn: &proto.EventSpawn{
					Object: &proto.EventSpawn_Player{
						Player: &proto.Player{
							PartyId:   2,
							Character: g.characters[pkt.PCStruct.CharacterId],
							IsLocal:   true,
						},
					},
				},
			},
		})

		for _, effect := range pkt.PCStruct.StatusEffectDatas {
			var value uint32
			if effect.Value != nil {
				value = uint32(effect.Value.Data)
			}
			g.push(packet.Timestamp, &proto.Event{
				Data: &proto.Event_StatusEffectAdd{
					StatusEffectAdd: &proto.EventStatusEffectAdd{
						TargetId:         pkt.PCStruct.PlayerId,
						StatusEffectId:   effect.StatusEffectId,
						EffectInstanceId: effect.EffectInstanceId,
						SourceId:         effect.SourceId,
						EndTick:          effect.EndTick,
						Value:            value,
						TotalTime:        effect.TotalTime,
					},
				},
			})
		}
	case *protocol.PKTInitPC:
		g.characterIdToPlayerId[pkt.CharacterId] = pkt.PlayerId
		g.playerIdToCharacterId[pkt.PlayerId] = pkt.CharacterId
		g.characters[pkt.CharacterId] = newCharacterFromInitPC(pkt)
		g.localCharacterId = pkt.CharacterId

		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Spawn{
				Spawn: &proto.EventSpawn{
					Object: &proto.EventSpawn_Player{
						Player: &proto.Player{
							PartyId:   0,
							Character: g.characters[pkt.CharacterId],
							IsLocal:   g.localCharacterId == pkt.CharacterId,
						},
					},
				},
			},
		})

		for _, effect := range pkt.StatusEffectDatas {
			var value uint32
			if effect.Value != nil {
				value = uint32(effect.Value.Data)
			}
			g.push(packet.Timestamp, &proto.Event{
				Data: &proto.Event_StatusEffectAdd{
					StatusEffectAdd: &proto.EventStatusEffectAdd{
						TargetId:         pkt.PlayerId,
						StatusEffectId:   effect.StatusEffectId,
						EffectInstanceId: effect.EffectInstanceId,
						SourceId:         effect.SourceId,
						EndTick:          effect.EndTick,
						Value:            value,
						TotalTime:        effect.TotalTime,
					},
				},
			})
		}
	case *protocol.PKTInitEnv:
		g.characterIdToPlayerId[g.localCharacterId] = pkt.PlayerId
		g.playerIdToCharacterId[pkt.PlayerId] = g.localCharacterId
		g.rotate()
	case *protocol.PKTMigrationExecute:
		if pkt.Account_CharacterId1 < pkt.Account_CharacterId2 {
			g.localCharacterId = pkt.Account_CharacterId1
		} else {
			g.localCharacterId = pkt.Account_CharacterId2
		}
	case *protocol.PKTRaidResult:
		g.current.Battle.Result = proto.BattleResult_DUNGEON_CLEAR
		g.rotate()
	case *protocol.PKTTriggerBossBattleStatus:
		g.rotate()
	case *protocol.PKTTriggerStartNotify:
		if isDungeonClear(pkt.TriggerSignalType) {
			g.current.Battle.Result = proto.BattleResult_DUNGEON_CLEAR
			g.rotate()
		} else if isDungeonFail(pkt.TriggerSignalType) {
			g.current.Battle.Result = proto.BattleResult_DUNGEON_FAIL
			g.rotate()
		}

		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Trigger{
				Trigger: &proto.EventTrigger{
					SourceId:          pkt.SourceId,
					TriggerId:         pkt.TriggerId,
					TriggerSignalType: pkt.TriggerSignalType,
					Players:           pkt.InvolvedPCs,
				},
			},
		})
	case *protocol.PKTNewProjectile:
		entity := &proto.Entity{
			ObjectId: pkt.ProjectileInfo.ProjectileId,
			OwnerId:  pkt.ProjectileInfo.OwnerId,
		}
		g.current.Battle.Entities[entity.ObjectId] = entity
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Spawn{
				Spawn: &proto.EventSpawn{
					ObjectId: entity.ObjectId,
					Object: &proto.EventSpawn_Entity{
						Entity: entity,
					},
				},
			},
		})
	case *protocol.PKTNewNpcSummon:
		entity := &proto.Entity{
			ObjectId: pkt.NpcData.ObjectId,
			OwnerId:  pkt.OwnerId,
			TypeId:   pkt.NpcData.TypeId,
		}
		g.current.Battle.Entities[entity.ObjectId] = entity
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Spawn{
				Spawn: &proto.EventSpawn{
					ObjectId: entity.ObjectId,
					Object: &proto.EventSpawn_Entity{
						Entity: entity,
					},
				},
			},
		})
	case *protocol.PKTRemoveObject:
		ids := make([]uint64, len(pkt.UnpublishedObjects))
		for id, obj := range pkt.UnpublishedObjects {
			ids[id] = obj.ObjectId
		}
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Remove{
				Remove: &proto.EventRemove{
					ObjectIds: ids,
				},
			},
		})
	case *protocol.PKTZoneObjectUnpublishNotify:
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Remove{
				Remove: &proto.EventRemove{
					ObjectIds: []uint64{pkt.ObjectId},
				},
			},
		})
	case *protocol.PKTCounterAttackNotify:
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Counter{
				Counter: &proto.EventCounter{
					TargetId: pkt.TargetId,
					SourceId: pkt.SourceId,
					Type:     pkt.Type,
				},
			},
		})
	case *protocol.PKTDeathNotify:
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_Death{
				Death: &proto.EventDeath{
					TargetId: pkt.TargetId,
					SourceId: pkt.SourceId,
				},
			},
		})
	case *protocol.PKTSkillStartNotify:
		skill := &proto.SkillInfo{
			SkillId: pkt.SkillId,
			Level:   uint32(pkt.SkillLevel),
		}

		if pkt.SkillOptionData.TripodIndex != nil {
			skill.TripodIndex_1 = uint32(pkt.SkillOptionData.TripodIndex.First)
			skill.TripodIndex_2 = uint32(pkt.SkillOptionData.TripodIndex.Second)
			skill.TripodIndex_3 = uint32(pkt.SkillOptionData.TripodIndex.Third)
		}

		if pkt.SkillOptionData.TripodLevel != nil {
			skill.TripodLevel_1 = uint32(pkt.SkillOptionData.TripodLevel.First)
			skill.TripodLevel_2 = uint32(pkt.SkillOptionData.TripodLevel.Second)
			skill.TripodLevel_3 = uint32(pkt.SkillOptionData.TripodLevel.Third)
		}

		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_SkillUse{
				SkillUse: &proto.EventSkillUse{
					SourceId:  pkt.SourceId,
					SkillInfo: skill,
				},
			},
		})
	case *protocol.PKTParalyzationStateNotify:
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_StaggerState{
				StaggerState: &proto.EventStaggerState{
					ObjectId:             pkt.ObjectId,
					DecreasePoint:        pkt.DecreasePoint,
					ParalyzationPoint:    pkt.ParalyzationPoint,
					ParalyzationMaxPoint: pkt.ParalyzationMaxPoint,
				},
			},
		})
	case *protocol.PKTPartyInfo:
		g.currentParty = pkt

		// track character data in the local cache
		for _, partyMember := range pkt.MemberDatas {
			g.characters[partyMember.CharacterId] = &proto.Character{
				CharacterId: partyMember.CharacterId,
				Name:        partyMember.Name,
				Level:       uint32(partyMember.CharacterLevel),
				GearLevel:   partyMember.GearLevel,
				ClassId:     uint32(partyMember.ClassId),
			}
		}
	case *protocol.PKTPartyLeaveResult:
		g.currentParty = nil
	case *protocol.PKTSkillDamageNotify:
		g.trackPlayer(packet.Timestamp, pkt.SourceId)
		g.onSkillDamageNotify(packet.Timestamp, pkt.SourceId, pkt.SkillId, pkt.SkillEffectId, pkt.SkillDamageEvents)
	case *protocol.PKTSkillDamageAbnormalMoveNotify:
		g.trackPlayer(packet.Timestamp, pkt.SourceId)
		damageEvents := make([]protocol.SkillDamageEvent, len(pkt.SkillDamageAbnormalMoveEvents))
		for idx, event := range pkt.SkillDamageAbnormalMoveEvents {
			damageEvents[idx] = event.SkillDamageEvent
		}
		g.onSkillDamageNotify(packet.Timestamp, pkt.SourceId, pkt.SkillId, pkt.SkillEffectId, damageEvents)
	case *protocol.PKTTroopMemberUpdateMinNotify:
		playerId, ok := g.characterIdToPlayerId[pkt.CharacterId]
		if !ok {
			return
		}
		g.trackPlayer(packet.Timestamp, playerId)

		for _, effect := range pkt.StatusEffectDatas {
			var value uint32
			if effect.Value != nil {
				value = uint32(effect.Value.Data)
			}
			g.push(packet.Timestamp, &proto.Event{
				Data: &proto.Event_StatusEffectUpdate{
					StatusEffectUpdate: &proto.EventStatusEffectUpdate{
						EffectInstanceId: effect.EffectInstanceId,
						PlayerId:         playerId,
						Value:            value,
					},
				},
			})
		}
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_PlayerHealth{
				PlayerHealth: &proto.EventPlayerHealth{
					PlayerId:  playerId,
					CurrentHp: uint32(pkt.CurHp),
					MaxHp:     uint32(pkt.MaxHp),
				},
			},
		})
	case *protocol.PKTPartyStatusEffectAddNotify:
		playerId, ok := g.characterIdToPlayerId[pkt.CharacterId]
		if !ok {
			return
		}
		g.trackPlayer(packet.Timestamp, playerId)

		for _, effect := range pkt.StatusEffectDatas {
			if pkt.PlayerIdOnRefresh != 0 {
				effect.SourceId = pkt.PlayerIdOnRefresh
			}
			var value uint32
			if effect.Value != nil {
				value = uint32(effect.Value.Data)
			}
			g.push(packet.Timestamp, &proto.Event{
				Data: &proto.Event_StatusEffectAdd{
					StatusEffectAdd: &proto.EventStatusEffectAdd{
						TargetId:         playerId,
						StatusEffectId:   effect.StatusEffectId,
						EffectInstanceId: effect.EffectInstanceId,
						SourceId:         effect.SourceId,
						EndTick:          effect.EndTick,
						Value:            value,
						TotalTime:        effect.TotalTime,
					},
				},
			})
		}
	case *protocol.PKTStatusEffectAddNotify:
		var value uint32
		if pkt.StatusEffectData.Value != nil {
			value = uint32(pkt.StatusEffectData.Value.Data)
		}
		g.trackPlayer(packet.Timestamp, pkt.StatusEffectData.SourceId)
		g.trackPlayer(packet.Timestamp, pkt.ObjectId)
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_StatusEffectAdd{
				StatusEffectAdd: &proto.EventStatusEffectAdd{
					StatusEffectId:   pkt.StatusEffectData.StatusEffectId,
					EffectInstanceId: pkt.StatusEffectData.EffectInstanceId,
					SourceId:         pkt.StatusEffectData.SourceId,
					TargetId:         pkt.ObjectId,
					EndTick:          pkt.StatusEffectData.EndTick,
					Value:            value,
					TotalTime:        pkt.StatusEffectData.TotalTime,
				},
			},
		})
	case *protocol.PKTPartyStatusEffectRemoveNotify:
		playerId, ok := g.characterIdToPlayerId[pkt.CharacterId]
		if !ok {
			return
		}
		g.trackPlayer(packet.Timestamp, playerId)

		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_StatusEffectRemove{
				StatusEffectRemove: &proto.EventStatusEffectRemove{
					ObjectId:        playerId,
					StatusEffectIds: pkt.StatusEffectIds,
				},
			},
		})
	case *protocol.PKTStatusEffectRemoveNotify:
		g.trackPlayer(packet.Timestamp, pkt.ObjectId)
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_StatusEffectRemove{
				StatusEffectRemove: &proto.EventStatusEffectRemove{
					ObjectId:        pkt.ObjectId,
					StatusEffectIds: pkt.StatusEffectIds,
					Reason:          uint32(pkt.Reason),
				},
			},
		})
	case *protocol.PKTStatusEffectDurationNotify:
		g.trackPlayer(packet.Timestamp, pkt.TargetId)
		g.push(packet.Timestamp, &proto.Event{
			Data: &proto.Event_StatusEffectUpdate{
				StatusEffectUpdate: &proto.EventStatusEffectUpdate{
					EffectInstanceId: pkt.EffectInstanceId,
					PlayerId:         pkt.TargetId,
					Expiration:       pkt.ExpirationTick,
				},
			},
		})

	case *protocol.PKTStatChangeOriginNotify:
		g.trackPlayer(packet.Timestamp, pkt.ObjectId)
		player := g.current.Battle.Players[pkt.ObjectId]
		if player != nil {
			var hp, maxHp uint32
			for _, stat := range pkt.StatPairChangedList {
				if stat.StatType == data.EnumValue[uint8]("stattype", "hp") {
					hp = uint32(stat.Value)
				} else if stat.StatType == data.EnumValue[uint8]("stattype", "hp") {
					maxHp = uint32(stat.Value)
				}
			}

			g.push(packet.Timestamp, &proto.Event{
				Data: &proto.Event_PlayerHealth{
					PlayerHealth: &proto.EventPlayerHealth{
						PlayerId:  pkt.ObjectId,
						CurrentHp: hp,
						MaxHp:     maxHp,
					},
				},
			})
		}
	}
}

func (g *Generator) onSkillDamageNotify(ts time.Time, sourceId uint64, skillId uint32, skillEffectId uint32, skillDamageEvents []protocol.SkillDamageEvent) {
	if skillId == 0 && skillEffectId == 0 {
		return
	}

	dmg := proto.EventDamage{}
	dmg.SourceId = sourceId
	dmg.SkillId = skillId
	dmg.SkillEffectId = skillEffectId
	dmg.Hits = make([]*proto.EventDamage_SingleDamageHit, len(skillDamageEvents))

	for id, event := range skillDamageEvents {
		hit := &proto.EventDamage_SingleDamageHit{}
		dmg.Hits[id] = hit

		hit.TargetId = event.TargetId

		switch event.HitFlag() {
		case data.EnumValue[uint8]("hitflag", "normal"):
		case data.EnumValue[uint8]("hitflag", "critical"):
			hit.Crit = true
		case data.EnumValue[uint8]("hitflag", "dot"):
			hit.Dot = uint32(event.Damage)
		case data.EnumValue[uint8]("hitflag", "dot_critical"):
			hit.Dot = uint32(event.Damage)
		default:
			continue
		}

		switch event.HitOption() {
		// +1 is because the enum is wrong?
		case data.EnumValue[uint8]("hitoption", "back_attack") + 1:
			hit.BackAttack = true
		case data.EnumValue[uint8]("hitoption", "frontal_attack") + 1:
			hit.FrontAttack = true
		}

		hit.Damage = uint32(event.Damage)
		g.trackEntity(ts, hit.TargetId)

		if hit.Damage > 0 && g.current.Battle.EncounterId == 0 {
			target, ok := g.current.Battle.Entities[hit.TargetId]
			if ok {
				encounter := data.FindEncounterByEntity(target.TypeId, target.MaxHp)
				if encounter != nil {
					g.current.Battle.EncounterId = uint32(encounter.Id)
				}
			}
		}
	}

	g.push(ts, &proto.Event{
		Data: &proto.Event_Damage{
			Damage: &dmg,
		},
	})
}

func (g *Generator) push(ts time.Time, event *proto.Event) {
	event.Ts = timestamppb.New(ts)
	g.current.Battle.Events = append(g.current.Battle.Events, event)
	if g.Events != nil {
		g.Events <- event
	}
}

func (g *Generator) Flush() {
	g.rotate()
}

func newCharacterFromPCStruct(data *protocol.PCStruct) *proto.Character {
	return &proto.Character{
		CharacterId: data.CharacterId,
		Name:        data.Name,
		Level:       uint32(data.Level),
		GearLevel:   data.GearLevel,
		ClassId:     uint32(data.ClassId),
	}
}

func newCharacterFromInitPC(data *protocol.PKTInitPC) *proto.Character {
	return &proto.Character{
		CharacterId: data.CharacterId,
		Name:        data.Name,
		Level:       uint32(data.Level),
		GearLevel:   data.GearLevel,
		ClassId:     uint32(data.ClassId),
	}
}

func isDungeonFail(value uint32) bool {
	return (value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase1_fail") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase2_fail") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase3_fail") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase4_fail") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase5_fail") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase6_fail"))
}

func isDungeonClear(value uint32) bool {
	return (value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase1_clear") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase2_clear") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase3_clear") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase4_clear") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase5_clear") ||
		value == data.EnumValue[uint32]("triggersignaltype", "dungeon_phase6_clear"))
}

func newEntityFromNPC(npc *protocol.NpcData) *proto.Entity {
	var maxHp uint32

	for _, statPair := range npc.StatPair {
		if statPair.StatType == data.EnumValue[uint8]("stattype", "max_hp") {
			maxHp = uint32(statPair.Value)
		}
	}

	return &proto.Entity{
		ObjectId: npc.ObjectId,
		TypeId:   npc.TypeId,
		MaxHp:    maxHp,
	}
}

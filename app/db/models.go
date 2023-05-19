package db

import (
	"time"

	"github.com/b1naryth1ef/shandi/lsb"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/teris-io/shortid"
	"gorm.io/gorm/clause"
)

type Battle struct {
	Id   string `json:"id" gorm:"primaryKey"`
	Hash string `json:"hash"`

	StartedAt   time.Time           `json:"started_at"`
	EndedAt     time.Time           `json:"ended_at"`
	EncounterId *int                `json:"encounter_id"`
	Result      *proto.BattleResult `json:"result"`
	Data        []byte              `json:"data"`
	UploadId    *string             `json:"upload_id"`

	Characters []BattleCharacter `json:"characters"`
}

type Character struct {
	Id      int    `json:"id" gorm:"primaryKey"`
	Name    string `json:"name"`
	ClassId int    `json:"class_id"`
	Local   bool   `json:"local"`
}

type BattleCharacter struct {
	Id      int `json:"-" gorm:"primaryKey"`
	PartyId int `json:"party_id"`

	BattleId string  `json:"-"`
	Battle   *Battle `json:"-"`

	CharacterId int        `json:"-"`
	Character   *Character `json:"character"`
}

type GetBattlesOpts struct {
	Limit int
}

func GetBattles(opts GetBattlesOpts) ([]Battle, error) {
	var result []Battle

	if opts.Limit == 0 {
		opts.Limit = 100
	}

	err := db.Preload("Characters.Character").Select(
		"id",
		"hash",
		"started_at",
		"ended_at",
		"encounter_id",
		"result",
		"upload_id",
	).Order("ended_at DESC").Limit(opts.Limit).Find(&result).Error
	if err != nil {
		return nil, err
	}

	return result, nil
}

func SaveBattle(battle *proto.Battle) (string, error) {
	id, err := shortid.Generate()
	if err != nil {
		return "", err
	}

	data, err := lsb.EncodeBattle(battle)
	if err != nil {
		return "", err
	}

	model := &Battle{
		Id:          id,
		Hash:        "",
		StartedAt:   battle.Start.AsTime(),
		EndedAt:     battle.End.AsTime(),
		EncounterId: nil,
		Result:      &battle.Result,
		Data:        data,
	}

	if battle.EncounterId != 0 {
		var encounterId int = int(battle.EncounterId)
		model.EncounterId = &encounterId
	}

	err = db.Create(model).Error
	if err != nil {
		return "", err
	}

	for _, player := range battle.Players {
		chr := Character{
			Id:      int(player.Character.CharacterId),
			Name:    player.Character.Name,
			ClassId: int(player.Character.ClassId),
			Local:   player.IsLocal,
		}

		err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&chr).Error
		if err != nil {
			return "", err
		}

		bchr := BattleCharacter{
			BattleId:    id,
			CharacterId: chr.Id,
			PartyId:     int(player.PartyId),
		}

		err = db.Create(&bchr).Error
		if err != nil {
			return "", err
		}
	}

	return id, nil
}

func SetBattleUploadId(id, uploadId string) error {
	return db.Model(&Battle{}).Where("id = ?", id).Update("UploadId", uploadId).Error
}

func LoadBattleData(id string) ([]byte, error) {
	var result Battle
	err := db.First(&result, "id = ?", id).Error
	if err != nil {
		return nil, err
	}

	return result.Data, nil
}

func GetBattle(id string) (*Battle, error) {
	var result Battle
	err := db.Preload("Characters.Character").Select("id", "hash", "started_at", "ended_at", "encounter_id", "result", "upload_id").First(&result, "id = ?", id).Error
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func DeleteBattle(id string) error {
	return db.Where("id = ?", id).Delete(&Battle{}).Error
}

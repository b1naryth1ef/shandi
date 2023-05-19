package db

import (
	"encoding/hex"
	"time"

	"github.com/b1naryth1ef/shandi/lsb"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/teris-io/shortid"
	"gorm.io/datatypes"
)

type Battle struct {
	Id   string `json:"id" gorm:"primaryKey"`
	Hash string `json:"hash"`

	UploadedAt  time.Time           `json:"uploaded_at"`
	StartedAt   time.Time           `json:"started_at"`
	EndedAt     time.Time           `json:"ended_at"`
	EncounterId *int                `json:"encounter_id"`
	Result      *proto.BattleResult `json:"result"`
	Data        []byte              `json:"data"`

	Anonymized bool           `json:"anonymized"`
	Visibility lsb.Visibility `json:"visibility"`
	OwnerId    *string        `json:"owner_id"`
	Owner      *User          `json:"-"`

	MetadataVersion int                                `json:"-"`
	Metadata        datatypes.JSONType[BattleMetadata] `json:"metadata"`
}

func CreateBattle(battle *proto.Battle, visibility lsb.Visibility, ownerId *string) (string, error) {
	id, err := shortid.Generate()
	if err != nil {
		return "", err
	}

	hash, err := lsb.HashBattle(battle)
	if err != nil {
		return "", err
	}

	if visibility == lsb.VISIBILITY_PUBLIC {
		lsb.AnonymizeBattle(battle)
	}

	data, err := lsb.EncodeBattle(battle)
	if err != nil {
		return "", err
	}

	model := &Battle{
		Id:              id,
		Hash:            hex.EncodeToString(hash),
		UploadedAt:      time.Now(),
		StartedAt:       battle.Start.AsTime(),
		EndedAt:         battle.End.AsTime(),
		EncounterId:     nil,
		Result:          &battle.Result,
		Data:            data,
		Visibility:      visibility,
		Anonymized:      visibility == lsb.VISIBILITY_PUBLIC,
		MetadataVersion: BATTLE_METADATA_VERSION,
		Metadata:        datatypes.NewJSONType(GenerateBattleMetadata(battle)),
		OwnerId:         ownerId,
	}

	if battle.EncounterId != 0 {
		var encounterId int = int(battle.EncounterId)
		model.EncounterId = &encounterId
	}

	err = db.Create(model).Error
	if err != nil {
		return "", err
	}

	return id, nil
}

type GetBattleOpts struct {
	IncludeData bool
}

func GetBattle(id string, opts GetBattleOpts) (*Battle, error) {
	var battle Battle

	query := db.Model(&battle).Preload("Owner")
	if opts.IncludeData == false {
		query = query.Omit("data")
	}

	return &battle, query.Find(&battle, "id = ?", id).Error
}

type ListBattleOpts struct {
	Page         int
	Limit        int
	UserId       *string
	EncounterIds []int
	Results      []proto.BattleResult
}

func ListBattles(opts ListBattleOpts) ([]*Battle, error) {
	var results []*Battle

	query := db.Model(&Battle{}).Omit("data")

	if opts.UserId != nil {
		query = query.Where("visibility = ? OR owner_id = ?", lsb.VISIBILITY_PUBLIC, opts.UserId)
	} else {
		query = query.Where("visibility = ?", lsb.VISIBILITY_PUBLIC)
	}

	if opts.EncounterIds != nil {
		query = query.Where("encounter_id IN ?", opts.EncounterIds)
	}

	if opts.Results != nil {
		query = query.Where("result IN ?", opts.Results)
	}

	if opts.Limit != 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Page != 0 {
		query = query.Offset((opts.Page - 1) * opts.Limit)
	}

	query = query.Order("uploaded_at DESC")

	return results, query.Find(&results).Error
}

func DeleteBattle(id string) error {
	return db.Where("id = ?", id).Delete(&Battle{}).Error
}

func UpdateBattle(id string, delta interface{}) error {
	return db.Model(&Battle{}).Where("id = ?", id).Updates(delta).Error
}

func AnonymizeBattle(id string) error {
	var record Battle

	query := db.Find(&record, "id = ?", id)
	if query.Error != nil {
		return query.Error
	}

	battle, err := lsb.DecodeBattle(record.Data)
	if err != nil {
		return err
	}

	lsb.AnonymizeBattle(battle)

	data, err := lsb.EncodeBattle(battle)
	if err != nil {
		return err
	}

	return UpdateBattle(id, map[string]interface{}{
		"data":       data,
		"anonymized": true,
	})
}

package lsb

import (
	"bytes"
	"crypto/md5"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"github.com/Pallinder/go-randomdata"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/klauspost/compress/zstd"
	pb "google.golang.org/protobuf/proto"
)

type Visibility = int

const (
	VISIBILITY_PUBLIC   Visibility = 0
	VISIBILITY_UNLISTED            = 1
	VISIBILITY_PRIVATE             = 2
)

var encoder, _ = zstd.NewWriter(nil)
var decoder, _ = zstd.NewReader(nil, zstd.WithDecoderConcurrency(0))

func DecodeBattle(compressed []byte) (*proto.Battle, error) {
	data, err := decoder.DecodeAll(compressed, nil)
	if err != nil {
		return nil, err
	}

	var decoded proto.Battle
	err = pb.Unmarshal(data, &decoded)
	if err != nil {
		return nil, err
	}

	return &decoded, nil
}

func EncodeBattle(battle *proto.Battle) ([]byte, error) {
	data, err := pb.Marshal(battle)
	if err != nil {
		return nil, err
	}

	return encoder.EncodeAll(data, nil), nil
}

func HashBattle(battle *proto.Battle) ([]byte, error) {
	hash := md5.New()
	err := binary.Write(hash, binary.LittleEndian, battle.EncounterId)
	if err != nil {
		return nil, err
	}
	err = binary.Write(hash, binary.LittleEndian, battle.Start.AsTime().Unix())
	if err != nil {
		return nil, err
	}
	err = binary.Write(hash, binary.LittleEndian, battle.End.AsTime().Unix())
	if err != nil {
		return nil, err
	}
	for _, event := range battle.Events {
		err = binary.Write(hash, binary.LittleEndian, event.Ts.AsTime().Unix())
		if err != nil {
			return nil, err
		}
	}
	return hash.Sum(nil), nil
}

func AnonymizeBattle(battle *proto.Battle) {
	characterIdMap := map[uint64]uint64{}

	for _, player := range battle.Players {
		if player.Character == nil {
			continue
		}

		newId := uint64(len(characterIdMap) + 1)
		characterIdMap[player.Character.CharacterId] = newId
		player.Character.CharacterId = newId
		player.Character.Name = randomdata.SillyName()
	}

	for _, event := range battle.Events {
		if data, ok := event.Data.(*proto.Event_Spawn); ok {
			if charId, ok := data.Spawn.Object.(*proto.EventSpawn_CharacterId); ok {
				charId.CharacterId = characterIdMap[charId.CharacterId]
			}
		}
	}
}

const defaultAPIURL = "https://shandi.land"

type UploadBattleOptions struct {
	APIURL     *string
	Visibility *Visibility
	UploadKey  *string
}

func (u *UploadBattleOptions) URL() string {
	var baseURL string = defaultAPIURL
	if u.APIURL != nil {
		baseURL = *u.APIURL
	}

	values := url.Values{}
	if u.Visibility != nil {
		values.Set("visibility", fmt.Sprintf("%d", *u.Visibility))
	}

	return fmt.Sprintf("%s/api/battles?%s", baseURL, values.Encode())

}

func (u *UploadBattleOptions) BattleURL(id string) string {
	var baseURL string = defaultAPIURL
	if u.APIURL != nil {
		baseURL = *u.APIURL
	}
	return fmt.Sprintf("%s/battles/%s", baseURL, id)
}

type UploadBattleResult struct {
	Id  string `json:"id"`
	URL string `json:"url"`
}

func UploadBattle(opts UploadBattleOptions, battle *proto.Battle) (*UploadBattleResult, error) {
	data, err := EncodeBattle(battle)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", opts.URL(), bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}

	if opts.UploadKey != nil {
		req.Header.Set("Authorization", fmt.Sprintf("UploadKey %s", *opts.UploadKey))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("Failed to upload battle: %s", string(data))
	}

	var result struct {
		Id string `json:"id"`
	}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	return &UploadBattleResult{
		Id:  result.Id,
		URL: opts.BattleURL(result.Id),
	}, nil
}

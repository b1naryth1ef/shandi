package protocol

import (
	"bytes"
	"encoding/binary"
	"errors"
	"io"
	"math"
	"reflect"
	"time"

	"golang.org/x/exp/constraints"
)

type Angle float64

func (a *Angle) Decode(buff io.Reader) error {
	value, err := binaryRead[uint16](buff)
	if err != nil {
		return err
	}
	*a = Angle((float64(value) * (2 * math.Pi)) / 0x10000)
	return nil
}

type Vector3F struct {
	X, Y, Z float64
}

func (v *Vector3F) Decode(buff io.Reader) error {
	_, err := binaryRead[uint64](buff)
	if err != nil {
		return err
	}

	// TODO
	v.X = 0
	v.Y = 0
	v.Z = 0

	return nil
}

type TripodIndex struct {
	First  uint8
	Second uint8
	Third  uint8
}

type TripodLevel struct {
	First  uint16
	Second uint16
	Third  uint16
}

type SkillOptionData struct {
	LayerIndex      *uint8
	StartStageIndex *uint8
	TransitIndex    *uint32
	StageStartTime  *uint32
	FarmostDistance *uint32
	TripodIndex     *TripodIndex
	TripodLevel     *TripodLevel
}

func (s *SkillOptionData) Decode(buff io.Reader) error {
	flag, err := binaryRead[uint8](buff)
	if err != nil {
		return err
	}

	if flag&1 > 0 {
		s.LayerIndex, err = binaryReadPtr[uint8](buff)
		if err != nil {
			return err
		}
	}
	if flag&2 > 0 {
		s.StartStageIndex, err = binaryReadPtr[uint8](buff)
		if err != nil {
			return err
		}
	}
	if flag&4 > 0 {
		s.TransitIndex, err = binaryReadPtr[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&8 > 0 {
		s.StageStartTime, err = binaryReadPtr[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&0x10 > 0 {
		s.FarmostDistance, err = binaryReadPtr[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&0x20 > 0 {
		s.TripodIndex = &TripodIndex{}
		err := Decode(buff, s.TripodIndex)
		if err != nil {
			return err
		}
	}
	if flag&0x40 > 0 {
		s.TripodLevel = &TripodLevel{}
		err := Decode(buff, s.TripodLevel)
		if err != nil {
			return err
		}
	}

	return nil
}

type ByteArray[T constraints.Integer] []byte

func (b *ByteArray[T]) Decode(buff io.Reader) error {
	var size T
	err := binary.Read(buff, binary.LittleEndian, &size)
	if err != nil {
		return err
	}

	result := make([]byte, size)
	_, err = buff.Read(result)
	if err != nil {
		return err
	}

	*b = ByteArray[T](result)
	return nil
}

type Array[T constraints.Integer, Ti any] []Ti

func (a *Array[T, Ti]) Decode(buff io.Reader) error {
	size, err := binaryRead[T](buff)
	if err != nil {
		return err
	}

	result := make([]Ti, size)
	for i := T(0); i < size; i++ {
		err = DecodeField(buff, reflect.ValueOf(&result[i]))
		if err != nil {
			return err
		}
	}

	*a = result

	return nil
}

type NBytesInt64 int64

func (n *NBytesInt64) Decode(buff io.Reader) error {
	flag, err := binaryRead[uint8](buff)
	if err != nil {
		return err
	}

	data := make([]byte, (flag>>1)&7)
	_, err = buff.Read(data)
	if err != nil {
		return err
	}

	bi64, err := bytesToInt64(data)
	if err != nil {
		return err
	}
	result := (bi64 << 4) | int64(flag>>4)

	if flag&1 == 0 {
		*n = NBytesInt64(result)
	} else {
		*n = NBytesInt64(-result)
	}

	return nil
}

func bytesToInt64(value []byte) (int64, error) {
	if len(value) == 0 {
		return 0, nil
	}
	if len(value) > 8 {
		return 0, errors.New("value is too large")
	}

	var data [8]byte
	copy(data[0:8], value)

	var res int64
	err := binary.Read(bytes.NewBuffer(data[0:8]), binary.LittleEndian, &res)
	return res, err
}

type LostArkDateTime struct {
	Value int64
}

func (l *LostArkDateTime) ToTime() time.Time {
	return time.Unix(l.Value, 0)
}

func (t *LostArkDateTime) Decode(buff io.Reader) error {
	prefix := make([]byte, 2)
	_, err := buff.Read(prefix)
	if err != nil {
		return err
	}

	var s uint16
	err = binary.Read(bytes.NewBuffer(prefix), binary.LittleEndian, &s)
	if err != nil {
		return err
	}

	if (s & 0xfff) < 0x81f {
		suffix := make([]byte, 6)
		_, err := buff.Read(suffix)
		if err != nil {
			return err
		}

		err = binary.Read(bytes.NewBuffer(append(prefix, suffix...)), binary.LittleEndian, &t.Value)
		if err != nil {
			return err
		}
	} else {
		t.Value = (int64(s) & 0xfff) | 0x11000
	}

	return nil
}

func (s SkillDamageEvent) HitFlag() uint8 {
	return s.Modifier & 0x0F
}

func (s SkillDamageEvent) HitOption() uint8 {
	return (s.Modifier >> 4) & 0x7
}

type StatPair struct {
	Value    NBytesInt64
	StatType uint8
}

type SkillMoveOptionData struct {
	MoveTime    uint32
	StandUpTime uint32
	DownTime    uint32
	FreezeTime  uint32
	MoveHeight  uint32
	FarmostDist uint32
	Flag40      ByteArray[uint16]
}

func (s *SkillMoveOptionData) Decode(buff io.Reader) error {
	flag, err := binaryRead[uint8](buff)
	if err != nil {
		return err
	}

	if flag&1 > 0 {
		s.MoveTime, err = binaryRead[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&2 > 0 {
		s.StandUpTime, err = binaryRead[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&4 > 0 {
		s.DownTime, err = binaryRead[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&8 > 0 {
		s.FreezeTime, err = binaryRead[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&0x10 > 0 {
		s.MoveHeight, err = binaryRead[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&0x20 > 0 {
		s.FarmostDist, err = binaryRead[uint32](buff)
		if err != nil {
			return err
		}
	}
	if flag&0x40 > 0 {
		err = s.Flag40.Decode(buff)
		if err != nil {
			return err
		}
	}
	return nil
}

func binaryRead[T any](buff io.Reader) (T, error) {
	var result T
	err := binary.Read(buff, binary.LittleEndian, &result)
	return result, err
}

func binaryReadPtr[T any](buff io.Reader) (*T, error) {
	res, err := binaryRead[T](buff)
	if err != nil {
		return nil, err
	}
	return &res, err
}

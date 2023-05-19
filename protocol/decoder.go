package protocol

import (
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"reflect"
	"time"

	"github.com/b1naryth1ef/shandi/poodle"
	"github.com/golang/snappy"
	"golang.org/x/text/encoding/unicode"
)

type DecodedPacket struct {
	Timestamp time.Time
	OpCode    uint16
	Size      uint16
	Data      []byte
	Decoded   interface{}
}

type Decodable interface {
	Decode(io.Reader) error
}

var decodableType = reflect.TypeOf((*Decodable)(nil)).Elem()
var ErrUnknownOpcode = errors.New("unknown opcode")

func isBasicType(t reflect.Kind) bool {
	return (t == reflect.Uint ||
		t == reflect.Uint8 ||
		t == reflect.Uint16 ||
		t == reflect.Uint32 ||
		t == reflect.Uint64 ||
		t == reflect.Int ||
		t == reflect.Int8 ||
		t == reflect.Int16 ||
		t == reflect.Int32 ||
		t == reflect.Int64 ||
		t == reflect.Float32 ||
		t == reflect.Float64 ||
		t == reflect.Bool)
}

func Decode(buff io.Reader, container interface{}) error {
	containerType := reflect.TypeOf(container)
	containerValue := reflect.ValueOf(container)

	if containerType.Kind() != reflect.Pointer || containerType.Elem().Kind() != reflect.Struct {
		log.Printf("%v / %v", containerType, containerValue)
		panic("must decode into pointer of struct")
	}

	innerType := containerType.Elem()
	innerValue := containerValue.Elem()

	for i := 0; i < innerType.NumField(); i++ {
		field := innerType.Field(i)
		if field.Type.Kind() == reflect.Pointer {
			// TODO: optional check
			more, err := binaryRead[bool](buff)
			if err == io.ErrUnexpectedEOF || err == io.EOF {
				log.Printf("Failed to decode %v", field.Name)
			}

			if err != nil {
				return err
			}

			if more {
				value := reflect.New(field.Type.Elem())
				err := DecodeField(buff, value)

				if err == io.ErrUnexpectedEOF || err == io.EOF {
					log.Printf("Failed to decode field %v", field.Name)
				}

				if err != nil {
					return err
				}
				innerValue.Field(i).Set(value)
			}
		} else {
			err := DecodeField(buff, innerValue.Field(i).Addr())

			if err == io.ErrUnexpectedEOF || err == io.EOF {
				log.Printf("Failed to decode field %v", field.Name)
			}

			if err != nil {
				return err
			}
		}
	}

	return nil
}

func DecodeField(buff io.Reader, field reflect.Value) error {
	if field.Type().Implements(decodableType) {
		return field.Interface().(Decodable).Decode(buff)
	} else if isBasicType(field.Type().Elem().Kind()) {
		err := binary.Read(buff, binary.LittleEndian, field.Interface())
		if err != nil {
			return err
		}
	} else if field.Type().Elem().Kind() == reflect.String {
		length, err := binaryRead[uint16](buff)
		if err != nil {
			return err
		}

		raw := make([]byte, length*2)
		_, err = buff.Read(raw)
		if err != nil {
			return err
		}

		enc := unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM)
		dec := enc.NewDecoder()
		v, err := dec.Bytes(raw)
		if err != nil {
			return err
		}

		field.Elem().SetString(string(v))
	} else if field.Type().Kind() == reflect.Pointer && field.Type().Elem().Kind() == reflect.Struct {
		return Decode(buff, field.Interface())
	} else if field.Type().Elem().Kind() == reflect.Array && field.Type().Elem().Elem().Kind() == reflect.Uint8 {
		ptr := field.Elem().Slice(0, field.Elem().Len()).Bytes()
		_, err := buff.Read(ptr)
		if err != nil {
			return err
		}
	} else {
		return fmt.Errorf("unhandled type %v / %v", field.Type(), field.Type().Kind())
	}

	return nil
}

type Decoder struct {
	opcodes OpCodeTypeMap
	oodle   *poodle.Decoder
	xor     *XOR
}

func NewDecoder(oodle *poodle.Decoder, xor *XOR) *Decoder {
	return &Decoder{
		opcodes: OpCodeToPacket,
		oodle:   oodle,
		xor:     xor,
	}
}

func (d *Decoder) SetOpCodeTypeMap(opcodes OpCodeTypeMap) {
	d.opcodes = opcodes
}

var ErrUnsupportedCompression = errors.New("unsupported compression method")
var ErrBlacklistedOpCode = errors.New("blacklisted opcode")

func (d *Decoder) Decode(buff io.Reader) (*DecodedPacket, error) {
	size, err := binaryRead[uint16](buff)
	if err != nil {
		return nil, err
	}
	opcode, err := binaryRead[uint16](buff)
	if err != nil {
		return nil, err
	}
	compressionType, err := binaryRead[byte](buff)
	if err != nil {
		return nil, err
	}
	xor, err := binaryRead[bool](buff)
	if err != nil {
		return nil, err
	}

	var n int
	data := make([]byte, size-6)
	n, err = io.ReadFull(buff, data)
	if err != nil {
		return nil, err
	}
	if n != int(size)-6 {
		return nil, errors.New("short read of remaining payload")
	}

	if xor {
		d.xor.Cipher(data, int(opcode))
	}

	var innerPayload []byte

	switch compressionType {
	case 0:
		innerPayload = data[16:]
	case 1:
		// TODO: lz4
		return nil, ErrUnsupportedCompression
	case 2:
		result, err := snappy.Decode(nil, data)
		if err != nil {
			return nil, err
		}
		innerPayload = result[16:]
	case 3:
		buf := bytes.NewReader(data[0:4])

		var outSize int32

		err := binary.Read(buf, binary.LittleEndian, &outSize)
		if err != nil {
			panic(err)
		}

		result, err := d.oodle.Decode(data[4:], outSize)
		if err != nil {
			log.Printf("OODLE FAIL: %v '%s' (%v)", opcode, hex.EncodeToString(data), err)
			return nil, err
		}
		innerPayload = result[16:]
	}

	var res interface{}

	packet, ok := d.opcodes[opcode]
	if ok {
		ptr := reflect.New(packet)
		res = ptr.Interface()
		err = Decode(bytes.NewBuffer(innerPayload), ptr.Interface())

		if err == io.ErrUnexpectedEOF || err == io.EOF {
			log.Printf("EOF processing opcode %v, total size was %v (%v)", opcode, len(innerPayload), size)
			log.Printf("Payload: %v", hex.EncodeToString(innerPayload))

			// eof from decodePacket means something is broken for that opcode, we can probably continue
			return nil, nil
		}
	} else {
		err = ErrUnknownOpcode
	}

	return &DecodedPacket{
		Timestamp: time.Now(),
		OpCode:    opcode,
		Size:      size,
		Data:      innerPayload,
		Decoded:   res,
	}, err
}

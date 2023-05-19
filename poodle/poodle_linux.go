package poodle

import (
	_ "embed"
	"unsafe"

	"github.com/ebitengine/purego"
)

//go:embed libpoodle.so
var so []byte

func GetSharedLibrary() (string, []byte) {
	return "libpoodle.so", so
}

type Decoder struct {
	instance     unsafe.Pointer
	oodleNew     func(unsafe.Pointer) unsafe.Pointer
	oodleDecode  func(unsafe.Pointer, unsafe.Pointer, int64, unsafe.Pointer, int64) bool
	oodleDestroy func(unsafe.Pointer)
}

func NewDecoder(path string, data []byte) (*Decoder, error) {
	handle, err := purego.Dlopen(path, purego.RTLD_NOW|purego.RTLD_GLOBAL)
	if err != nil {
		return nil, err
	}

	decoder := &Decoder{}
	purego.RegisterLibFunc(&decoder.oodleNew, handle, "oodle_new")
	purego.RegisterLibFunc(&decoder.oodleDecode, handle, "oodle_decode")
	purego.RegisterLibFunc(&decoder.oodleDestroy, handle, "oodle_destroy")

	decoder.instance = decoder.oodleNew(unsafe.Pointer(&data[0]))

	return decoder, nil
}

func (p *Decoder) Decode(input []byte, outputSize int32) ([]byte, error) {
	safe := make([]byte, outputSize)

	ok := p.oodleDecode(p.instance, unsafe.Pointer(&input[0]), int64(len(input)), unsafe.Pointer(&safe[0]), int64(outputSize))
	if !ok {
		return nil, ErrDecodingFailed
	}

	return safe, nil
}

func (p *Decoder) Close() {
	p.oodleDestroy(p.instance)
}

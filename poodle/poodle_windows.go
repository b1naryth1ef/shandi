package poodle

import (
	_ "embed"
	"syscall"
	"unsafe"
)

//go:embed poodle.dll
var dll []byte

func GetSharedLibrary() (string, []byte) {
	return "poodle.dll", dll
}

type Decoder struct {
	ptr uintptr

	decodeProc  *syscall.LazyProc
	destroyProc *syscall.LazyProc
}

func NewDecoder(path string, data []byte) (*Decoder, error) {
	mod := syscall.NewLazyDLL(path)
	oodle_new := mod.NewProc("oodle_new")

	ret, _, err := oodle_new.Call(uintptr(unsafe.Pointer(&data[0])))
	if err != nil && err != syscall.Errno(0) {
		return nil, err
	}

	return &Decoder{
		ptr:         ret,
		decodeProc:  mod.NewProc("oodle_decode"),
		destroyProc: mod.NewProc("oodle_destroy"),
	}, nil
}

func (p *Decoder) Decode(input []byte, outputSize int32) ([]byte, error) {
	safe := make([]byte, outputSize)

	ret, _, err := p.decodeProc.Call(p.ptr, uintptr(unsafe.Pointer(&input[0])), uintptr(len(input)), uintptr(unsafe.Pointer(&safe[0])), uintptr(outputSize))
	if err != nil && err != syscall.Errno(0) {
		return nil, err
	}

	if ret == 0 {
		return nil, ErrDecodingFailed
	}

	return safe, nil

}

func (p *Decoder) Close() {
	p.destroyProc.Call(p.ptr)
}

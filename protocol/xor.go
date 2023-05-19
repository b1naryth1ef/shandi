package protocol

type XOR struct {
	key []byte
}

func NewXOR(key []byte) *XOR {
	return &XOR{key: key}
}

func (x *XOR) Cipher(data []byte, seed int) {
	for i := 0; i < len(data); i++ {
		data[i] = data[i] ^ x.key[seed%len(x.key)]
		seed += 1
	}
}

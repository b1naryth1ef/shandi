//go:generate protoc --go_out=paths=source_relative:. lsb.proto

package v1

func (b *Battle) Duration() float64 {
	return b.End.AsTime().Sub(b.Start.AsTime()).Seconds()
}

func (b *Battle) GetId(objectId uint64) uint64 {
	if object, ok := b.Entities[objectId]; ok && object.OwnerId != 0 {
		return object.OwnerId
	}

	return objectId
}


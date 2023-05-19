package protocol

import "reflect"

type OpCodeTypeMap = map[uint16]reflect.Type

var OpCodeToPacket = OpCodeTypeMap{}

package app

import (
	"github.com/b1naryth1ef/shandi/data"
	"github.com/b1naryth1ef/shandi/lsb"
	proto "github.com/b1naryth1ef/shandi/lsb/proto/v1"
	"github.com/b1naryth1ef/shandi/protocol"
	"github.com/google/gopacket/pcap"
)

type CaptureCtx struct {
	PoodlePath string

	OnPacket      func(packet *protocol.DecodedPacket)
	OnBattleStart func(battle *lsb.PendingBattle)
	OnEvent       func(event *proto.Event)
	OnBattleDone  func(battle *proto.Battle)

	Stats *protocol.PacketStreamStats
}

type LiveCaptureStatus struct {
	PacketsProcessed uint64 `json:"packets_processed"`
}

type LiveCaptureManager struct {
	ctx                  CaptureCtx
	currentInterfaceName *string
	currentCapture       *liveCapture
}

func NewLiveCaptureManager(ctx CaptureCtx) *LiveCaptureManager {
	return &LiveCaptureManager{ctx: ctx}
}

func (l *LiveCaptureManager) GetCurrentGenerator() *lsb.Generator {
	if l.currentCapture == nil {
		return nil
	}

	return l.currentCapture.generator
}

func (l *LiveCaptureManager) GetCurrentBattle() *lsb.PendingBattle {
	if l.currentCapture == nil {
		return nil
	}

	return l.currentCapture.current
}

func (l *LiveCaptureManager) GetStatus() *LiveCaptureStatus {
	if l.currentCapture == nil {
		return nil
	}

	return &LiveCaptureStatus{
		PacketsProcessed: l.currentCapture.processed,
	}
}

func (l *LiveCaptureManager) SetInterfaceName(interfaceName *string) error {
	if interfaceName == nil {
		if l.currentCapture != nil {
			l.currentCapture.Close()
			l.currentCapture = nil
		}

		l.currentInterfaceName = nil
	} else if l.currentInterfaceName == nil || *l.currentInterfaceName != *interfaceName {
		newCapture, err := newLiveCapture(*interfaceName, &l.ctx)
		if err != nil {
			return err
		}

		if l.currentCapture != nil {
			l.currentCapture.Close()
		}

		l.currentInterfaceName = interfaceName
		l.currentCapture = newCapture
	}

	return nil
}

type liveCapture struct {
	current   *lsb.PendingBattle
	generator *lsb.Generator
	processed uint64
	ctx       *CaptureCtx
	done      chan struct{}
}

func newLiveCapture(name string, ctx *CaptureCtx) (*liveCapture, error) {
	capture := &liveCapture{ctx: ctx, done: make(chan struct{}, 0)}

	handle, err := openInterface(name)
	if err != nil {
		return nil, err
	}

	logger.Info().Str("name", name).Msg("starting live capture on interface")
	go capture.run(handle)
	return capture, nil
}

func (c *liveCapture) run(handle *pcap.Handle) {
	decoder, err := protocol.NewPacketStreamDecoder(&protocol.PacketStreamDecoderOpts{
		PoodlePath:        c.ctx.PoodlePath,
		OodleState:        data.OodleStateBin,
		XORKey:            data.XORKeyBin,
		PacketStreamStats: c.ctx.Stats,
	})
	if err != nil {
		panic(err)
	}
	c.generator = lsb.NewGenerator()
	c.generator.Events = make(chan *proto.Event, 8)

	go decoder.Run(handle)
	go func() {
		defer decoder.Close()
		defer c.generator.Flush()

		for {
			select {
			case <-c.done:
				return
			case packet, ok := <-decoder.Packets():
				if !ok {
					return
				}

				c.generator.ProcessPacket(packet)
				if c.ctx.OnPacket != nil {
					c.ctx.OnPacket(packet)
				}
				c.processed += 1
			case battle, ok := <-c.generator.Battles:
				if !ok {
					return
				}

				c.current = battle
				if c.ctx.OnBattleStart != nil {
					c.ctx.OnBattleStart(battle)
				}

				if c.ctx.OnBattleDone != nil {
					go func() {
						<-battle.Done
						c.ctx.OnBattleDone(battle.Battle)
					}()
				}
			case event, ok := <-c.generator.Events:
				if !ok {
					return
				}
				c.ctx.OnEvent(event)
			}
		}
	}()
}

func (c *liveCapture) Close() {
	if c.done == nil {
		return
	}
	close(c.done)
	c.done = nil
}

func openInterface(name string) (*pcap.Handle, error) {
	raisePrivilege()

	inactiveHandle, err := pcap.NewInactiveHandle(name)
	if err != nil {
		return nil, err
	}

	inactiveHandle.SetImmediateMode(true)

	handle, err := inactiveHandle.Activate()
	if err != nil {
		return nil, err
	}
	err = handle.SetBPFFilter("tcp src port 6040")
	if err != nil {
		return nil, err
	}

	return handle, nil
}

type InterfaceInfo struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	IPs         []string `json:"ips"`
}

func GetInterfaces() ([]InterfaceInfo, error) {
	raisePrivilege()

	interfaces := make([]InterfaceInfo, 0)

	devices, err := pcap.FindAllDevs()
	if err != nil {
		return nil, err
	}
	for _, it := range devices {
		// Ignore loopback
		if it.Flags&0x00000001 > 0 {
			continue
		}

		// Ignore inactive devices
		if it.Flags&0x00000010 <= 0 {
			continue
		}

		ips := make([]string, 0)
		for _, addr := range it.Addresses {
			ips = append(ips, addr.IP.String())
		}

		interfaces = append(interfaces, InterfaceInfo{
			Name:        it.Name,
			Description: it.Description,
			IPs:         ips,
		})
	}
	return interfaces, nil
}

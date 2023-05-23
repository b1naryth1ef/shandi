package protocol

import (
	"bufio"
	"io"
	"log"
	"time"

	"github.com/b1naryth1ef/shandi/poodle"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	"github.com/google/gopacket/tcpassembly"
	"github.com/google/gopacket/tcpassembly/tcpreader"
)

type PacketStreamDecoderOpts struct {
	PoodlePath string
	OodleState []byte
	XORKey     []byte

	// You want this as false unless your decoding a previously recorded pcap
	UseStreamTimestamps bool
}

// PacketStreamDecoder decodes a stream of packets (generally a pcap handle)
type PacketStreamDecoder struct {
	decoder *Decoder
	done    chan struct{}
	packets chan *DecodedPacket
	opts    *PacketStreamDecoderOpts
}

func NewPacketStreamDecoder(opts *PacketStreamDecoderOpts) (*PacketStreamDecoder, error) {
	oodle, err := poodle.NewDecoder(opts.PoodlePath, opts.OodleState)
	if err != nil {
		return nil, err
	}

	return &PacketStreamDecoder{
		decoder: NewDecoder(oodle, NewXOR(opts.XORKey)),
		done:    make(chan struct{}),
		packets: make(chan *DecodedPacket),
		opts:    opts,
	}, nil

}

func (p *PacketStreamDecoder) Close() {
	if p.done == nil {
		return
	}
	close(p.done)
	p.done = nil
}

func (p *PacketStreamDecoder) Run(handle *pcap.Handle) {
	streamFactory := &gameStreamFactory{parent: p}
	streamPool := tcpassembly.NewStreamPool(streamFactory)
	assembler := tcpassembly.NewAssembler(streamPool)
	assembler.MaxBufferedPagesPerConnection = 8
	assembler.MaxBufferedPagesTotal = 8

	packetSource := gopacket.NewPacketSource(handle, handle.LinkType())

	defer handle.Close()
	defer close(p.packets)
	defer p.Close()

	for {
		select {
		case packet, ok := <-packetSource.Packets():
			if !ok {
				return
			}

			if packet.NetworkLayer() == nil || packet.TransportLayer() == nil || packet.TransportLayer().LayerType() != layers.LayerTypeTCP {
				continue
			}

			tcp := packet.TransportLayer().(*layers.TCP)
			assembler.AssembleWithTimestamp(packet.NetworkLayer().NetworkFlow(), tcp, packet.Metadata().Timestamp)
		case <-p.done:
			return
		}
	}
}

func (p *PacketStreamDecoder) Packets() <-chan *DecodedPacket {
	return p.packets
}

// gameStream wraps a tcpreader.ReaderStream to decode game packets with accurate timing information
type gameStream struct {
	stream      tcpreader.ReaderStream
	parent      *PacketStreamDecoder
	currentTime time.Time
}

func (g *gameStream) run() {
	defer g.stream.Close()
	reader := bufio.NewReader(&g.stream)

	for {
		ptr, err := g.parent.decoder.Decode(reader)
		if err != ErrUnknownOpcode {
			if err == io.EOF {
				return
			}

			if err != nil {
				log.Printf("ERROR: %v", err)
				continue
			}
		}

		if ptr != nil {
			if g.parent.opts.UseStreamTimestamps {
				ptr.Timestamp = g.currentTime
			}
			g.parent.packets <- ptr
		}
	}
}

func (g *gameStream) Reassembled(reassembly []tcpassembly.Reassembly) {
	if len(reassembly) > 0 {
		g.currentTime = reassembly[len(reassembly)-1].Seen
	}
	g.stream.Reassembled(reassembly)
}

func (g *gameStream) ReassemblyComplete() {
	g.stream.ReassemblyComplete()
}

type gameStreamFactory struct {
	parent *PacketStreamDecoder
}

func (f *gameStreamFactory) New(net, transport gopacket.Flow) tcpassembly.Stream {
	stream := &gameStream{
		stream: tcpreader.NewReaderStream(),
		parent: f.parent,
	}
	go stream.run()
	return stream
}

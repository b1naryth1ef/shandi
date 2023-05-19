package app

import (
	"github.com/b1naryth1ef/shandi/app/db"
	"github.com/b1naryth1ef/shandi/data"
	"github.com/b1naryth1ef/shandi/lsb"
	"github.com/b1naryth1ef/shandi/protocol"
	"github.com/google/gopacket/pcap"
)

func importPcap(app *App, path string) error {
	logger.Info().Str("path", path).Msg("importing file from path")
	handle, err := pcap.OpenOffline(path)
	if err != nil {
		return err
	}

	decoder, err := protocol.NewPacketStreamDecoder(&protocol.PacketStreamDecoderOpts{
		PoodlePath: app.poodlePath,
		OodleState: data.OodleStateBin,
		XORKey:     data.XORKeyBin,
	})
	if err != nil {
		return err
	}
	generator := lsb.NewGenerator()

	go decoder.Run(handle)
	defer decoder.Close()
	defer generator.Flush()

	for {
		select {
		case packet, ok := <-decoder.Packets():
			if !ok {
				return nil
			}

			generator.ProcessPacket(packet)
		case battle, ok := <-generator.Battles:
			if !ok {
				return nil
			}

			go func() {
				<-battle.Done
				if battle.Battle.EncounterId != 0 {
					_, err := db.SaveBattle(battle.Battle)
					if err != nil {
						logger.Error().Err(err).Msg("failed to save battle")
					}
				}
			}()
		}
	}
}

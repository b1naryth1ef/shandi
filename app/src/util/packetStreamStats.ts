import Immutable from "immutable";
import { useEffect, useState } from "react";
import { EventSourceClient } from "./events";

export type PacketStreamEvent = {
  when: Date;
  stats: PacketStreamStats;
};

export type PacketStreamStats = {
  received: number;
  processed: number;
  decoded: number;
};

export default function usePacketStreamStats(bufferSize?: number) {
  const [buffer, setBuffer] = useState(
    Immutable.List<[number, PacketStreamStats]>()
  );

  useEffect(() => {
    let idx = 0;
    const client = new EventSourceClient<PacketStreamStats>(
      "/api/stream/packet-stream-stats"
    );

    let previous: PacketStreamStats;
    client.run((event) => {
      if (!previous) {
        previous = event;
        return;
      }

      const delta = {
        received: event.received - previous.received,
        processed: event.processed - previous.processed,
        decoded: event.decoded - previous.decoded,
      };
      previous = event;

      idx = idx + 1;
      setBuffer((buffer) =>
        buffer.insert(0, [idx, delta]).setSize(bufferSize || 32)
      );
    });
    return () => client.close();
  }, []);

  return buffer;
}

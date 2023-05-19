import { BattleStats, BattleStatsOpts } from "@shandi/shared/src/util/stats";
import { Battle, EventsBatch } from "@shandi/lsb/lsb";
import { useLiveBattleStore } from "../stores/LiveBattleStore";
import { Settings, useSettingsStore } from "../stores/SettingsStore";
import { Status, useStatusStore } from "../stores/StatusStore";

export type Event =
  | {
    e: "SETTINGS_UPDATE";
    d: Settings;
  }
  | {
    e: "STATUS_UPDATE";
    d: Status;
  }
  | {
    e: "LIVE_BATTLE_START";
    d: null | string;
  }
  | {
    e: "LIVE_BATTLE_EVENTS";
    d: string;
  }
  | {
    e: "BATTLE_DELETE";
    d: string;
  }
  | {
    e: "APP_LOG";
    d: string;
  };

export class EventsClient {
  private url: string;
  private eventSource: EventSource | null;

  constructor(url: string) {
    this.url = url;
    this.eventSource = null;
  }

  close() {
    this.eventSource?.close();
  }

  run(onEvent: (event: Event) => void) {
    this.eventSource = new EventSource(this.url);
    this.eventSource.onmessage = (event) => {
      const ourEvent = JSON.parse(event.data) as Event;
      onEvent(ourEvent);
    };
    this.eventSource.onerror = () => {
      console.error(
        "[EventsClient] event source error, reopening in 5 seconds"
      );
      setTimeout(() => this.run(onEvent), 5000);
    };
  }
}

export function setupEvents() {
  if ((window as any).client) {
    (window as any).client.close();
  }

  let client = new EventsClient(`/api/events`);
  (window as any).client = client;
  client.run((event) => {
    if (event.e === "SETTINGS_UPDATE") {
      useSettingsStore.setState({
        settings: event.d,
      });
    } else if (event.e === "STATUS_UPDATE") {
      useStatusStore.setState({
        status: event.d,
      });
    } else if (event.e === "LIVE_BATTLE_START") {
      const opts: BattleStatsOpts = {};

      if (event.d !== null) {
        opts.battle = Battle.fromJSON(JSON.parse(event.d));
      }

      useLiveBattleStore.setState({ battleStats: new BattleStats(null, opts) });
    } else if (event.e === "LIVE_BATTLE_EVENTS") {
      const events = EventsBatch.fromJSON(JSON.parse(event.d));
      useLiveBattleStore.getState().processEvents(events.events);
    } else if (event.e === "BATTLE_DELETE") {
      if (window.location.href.includes(event.d)) {
        window.location.href = "/saved";
      }
    } else if (event.e === "APP_LOG") {
      console.log(`[APP]`, JSON.parse(event.d));
    } else {
      console.log("Unhandled event: ", event);
    }
  });
}

import { Event } from "@shandi/lsb/lsb";
import { produce } from "immer";
import { create } from "zustand";
import { BattleStats } from "@shandi/shared/src/util/stats";

export type LiveBattleStore = {
  battleStats: BattleStats;
  pauseQueue: Array<Event> | null;
  setPaused: (v: boolean) => void;
  rotate: () => void;
  processEvents: (events: Array<Event>, ignorePauseQueue?: boolean) => void;
};

export const useLiveBattleStore = create<LiveBattleStore>((set, get) => {
  const setPaused = (v: boolean) => {
    const { pauseQueue, processEvents } = get();
    if (pauseQueue === null && v) {
      set({ pauseQueue: [] });
    } else if (pauseQueue !== null && !v) {
      processEvents(pauseQueue, true);
      console.log(
        `[LiveBattleStore] processed ${pauseQueue.length} pending events from unpausing`
      );
      set({ pauseQueue: null });
    }
  };

  const rotate = () => {
    const existing = get().battleStats;
    const battleStats = new BattleStats();
    battleStats.battle.players = existing.battle.players;
    battleStats.battle.entities = existing.battle.entities;
    console.log(`[LiveBattleStore] rotating current battleStats`);
    set({ battleStats, pauseQueue: null });
  };

  const processEvents = (events: Array<Event>, ignorePauseQueue?: boolean) => {
    set((state) => {
      if (state.pauseQueue !== null && !ignorePauseQueue) {
        return { ...state, pauseQueue: [...state.pauseQueue, ...events] };
      }

      return {
        ...state,
        battleStats: produce(state.battleStats, (obj) => {
          obj.battle.events = [...obj.battle.events, ...events];
          for (const ev of events) {
            obj.processEvent(ev);
          }
        }),
      };
    });
  };

  return {
    battleStats: new BattleStats(),
    pauseQueue: null,
    setPaused,
    rotate,
    processEvents,
  };
});

(window as any).liveBattleStore = useLiveBattleStore;

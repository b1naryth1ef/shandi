import { getNPCInfo } from "@shandi/data/data";
import { EventStaggerState } from "@shandi/lsb/lsb";
import { useLiveBattleStore } from "app/src/stores/LiveBattleStore";
import { useSavedBattle } from "app/src/stores/SavedBattleStore";
import { BattleStats } from "@shandi/shared/src/util/stats";
import { useMemo } from "react";
import { Route, Routes, useMatch } from "react-router-dom";

function StaggerLogHeader() {
  return (
    <div className="grid grid-cols-6">
      <div className="col-span-2">Time</div>
      <div className="col-span-2">Target</div>
      <div className="col-span-2">Value</div>
    </div>
  );
}

function StaggerLogItem(
  { event, timeStr, battleStats }: {
    event: EventStaggerState;
    timeStr: string;
    battleStats: BattleStats;
  },
) {
  const target = battleStats.battle.entities[event.objectId];
  const npcInfo = target ? getNPCInfo(target.typeId) : null;
  const targetStr = npcInfo
    ? `${npcInfo.name} (${npcInfo.grade} / ${npcInfo.type})`
    : `${event.objectId}`;

  return (
    <div className="grid grid-cols-6 hover:bg-gray-200">
      <div className="col-span-2">{timeStr}</div>
      <div className="col-span-2">{targetStr}</div>
      <div className="col-span-2">
        {event.paralyzationMaxPoint - event.paralyzationPoint}
      </div>
    </div>
  );
}

function LiveStaggerLog() {
  const liveBattleStats = useLiveBattleStore((state) => state.battleStats);
  return <StaggerLogBody battleStats={liveBattleStats} />;
}

function SavedStaggerLog() {
  const match = useMatch("/developer/stagger/:id");
  const savedBattle = useSavedBattle(match?.params.id);
  if (!savedBattle) {
    return <></>;
  }

  return <StaggerLogBody battleStats={savedBattle.stats} />;
}

function StaggerLogBody({ battleStats }: { battleStats: BattleStats }) {
  const staggerEvents = useMemo(() => {
    const staggerEvents: Array<EventStaggerState & { timeStr: string }> = [];
    for (const event of battleStats.battle.events) {
      if (event.staggerState) {
        const i =
          (event.ts!!.getTime() - battleStats.battle.start!!.getTime()) / 1000;
        const timeStr = `${Math.round(i / 60)}:${("00" + (i % 60)).slice(-2)}`;
        staggerEvents.push({ ...event.staggerState, timeStr });
      }
    }
    return staggerEvents.reverse();
  }, [battleStats.battle.events]);
  return (
    <div className="bg-gray-100 border border-gray-500 rounded-sm m-2 p-2 font-mono flex flex-col">
      <StaggerLogHeader />
      {staggerEvents.map((it, idx) => (
        <StaggerLogItem
          key={idx}
          event={it}
          timeStr={it.timeStr}
          battleStats={battleStats}
        />
      ))}
    </div>
  );
}

export default function StaggerLog() {
  return (
    <Routes>
      <Route index element={<LiveStaggerLog />} />
      <Route path=":id" element={<SavedStaggerLog />} />
    </Routes>
  );
}

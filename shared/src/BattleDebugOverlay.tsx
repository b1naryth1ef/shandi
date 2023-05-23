import { encounterToString } from "@shandi/data/data";
import { useState } from "react";
import { BiSpa } from "react-icons/bi";
import { BattleStats } from "./util/stats";

function DebugItem({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2">
      <div className="text-xl">{title}</div>
      <div className="ml-auto font-gray-200 font-mono">{children}</div>
    </div>
  );
}

export default function BattleDebugOverlay({
  battleStats,
}: {
  battleStats: BattleStats;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="absolute right-2 bottom-2 text-gray-50 bg-gray-900 border-gray-950 border shadow-inner flex flex-col"
      style={{ maxWidth: "33%" }}
    >
      {
        <button onClick={() => setShow(!show)} className="p-1 ml-auto">
          <BiSpa className="w-4" />
        </button>
      }
      {show && (
        <div className="p-2">
          <DebugItem title="Duration">{battleStats.duration()}</DebugItem>
          <DebugItem title="Events">
            {battleStats.battle.events.length}
          </DebugItem>
          <DebugItem title="Players">{battleStats.playerStats.size}</DebugItem>
          <DebugItem title="Encounter">
            {battleStats.encounter
              ? encounterToString(battleStats.encounter)
              : "(null)"}
          </DebugItem>
        </div>
      )}
    </div>
  );
}

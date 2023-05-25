import PlayerDamageTable from "@shandi/shared/src/PlayerDamageTable";
import { useState } from "react";
import {
  BiBody,
  BiFilterAlt,
  BiPauseCircle,
  BiPlayCircle,
  BiReset,
} from "react-icons/bi";
import { useLiveBattleStore } from "../stores/LiveBattleStore";
import classNames from "classnames";
import { filterOnlyBossTargets } from "@shandi/shared/util/stats";

function LiveBattleControls({
  opts,
  setOpts,
}: {
  setOpts: React.Dispatch<React.SetStateAction<LiveBattleOpts>>;
  opts: LiveBattleOpts;
}) {
  const [battleStats, setPaused, rotate, copy, isPaused] = useLiveBattleStore(
    (state) => [
      state.battleStats,
      state.setPaused,
      state.rotate,
      state.copy,
      state.pauseQueue !== null,
    ]
  );

  return (
    <div className="absolute gap-1 flex flex-row items-center right-2 bottom-2 bg-gray-900 border border-gray-950 rounded-sm shadow-inner p-1">
      <button
        onClick={() => {
          setOpts({ onlyShowPlayers: !opts.onlyShowPlayers });
        }}
        title="Only Show Players"
      >
        <BiBody
          className={classNames("h-6 w-6", {
            "text-blue-500": opts.onlyShowPlayers,
            "text-gray-500": !opts.onlyShowPlayers,
          })}
        />
      </button>
      <button
        onClick={() => {
          copy({
            filterTarget: battleStats.opts.filterTarget
              ? undefined
              : filterOnlyBossTargets,
          });
        }}
        title="Filter Targets"
      >
        <BiFilterAlt
          className={classNames("h-6 w-6", {
            "text-blue-500": battleStats.opts.filterTarget !== undefined,
            "text-gray-500": battleStats.opts.filterTarget === undefined,
          })}
        />
      </button>
      <button onClick={rotate}>
        <BiReset className="h-6 w-6 text-blue-500" />
      </button>
      <button onClick={() => setPaused(!isPaused)}>
        {!isPaused && <BiPauseCircle className="h-6 w-6 text-yellow-500" />}
        {isPaused && <BiPlayCircle className="h-6 w-6 text-green-500" />}
      </button>
    </div>
  );
}

type LiveBattleOpts = {
  onlyShowPlayers: boolean;
};

export default function LiveBattlePage() {
  const stats = useLiveBattleStore((state) => state.battleStats);
  const [opts, setOpts] = useState<LiveBattleOpts>({ onlyShowPlayers: true });

  return (
    <>
      <PlayerDamageTable
        battleStats={stats}
        onlyShowPlayers={opts.onlyShowPlayers}
        emptyState={
          <div className="grid mt-10 place-items-center text-gray-900 text-2xl select-none">
            Waiting for data...
          </div>
        }
      />
      <LiveBattleControls opts={opts} setOpts={setOpts} />
    </>
  );
}

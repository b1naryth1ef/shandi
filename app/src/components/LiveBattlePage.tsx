import PlayerDamageTable from "@shandi/shared/src/PlayerDamageTable";
import { BiPauseCircle, BiPlayCircle, BiReset } from "react-icons/bi";
import { useLiveBattleStore } from "../stores/LiveBattleStore";

function LiveBattleControls() {
  const [setPaused, rotate, isPaused] = useLiveBattleStore((state) => [
    state.setPaused,
    state.rotate,
    state.pauseQueue !== null,
  ]);

  return (
    <div className="absolute gap-1 flex flex-row items-center right-2 bottom-2 bg-gray-900 border border-gray-950 rounded-sm shadow-inner p-1">
      <button onClick={rotate} className="">
        <BiReset className="h-6 w-6 text-blue-500" />
      </button>
      <button onClick={() => setPaused(!isPaused)} className="">
        {!isPaused && <BiPauseCircle className="h-6 w-6 text-yellow-500" />}
        {isPaused && <BiPlayCircle className="h-6 w-6 text-green-500" />}
      </button>
    </div>
  );
}

export default function LiveBattlePage() {
  const stats = useLiveBattleStore((state) => state.battleStats);
  return (
    <>
      <PlayerDamageTable
        battleStats={stats}
        emptyState={
          <div className="grid mt-10 place-items-center text-gray-900 text-2xl select-none">
            Waiting for data...
          </div>
        }
      />
      <LiveBattleControls />
    </>
  );
}

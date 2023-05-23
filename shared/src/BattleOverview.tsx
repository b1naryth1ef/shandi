import * as lsb from "@shandi/lsb/lsb";
import { BattleStats, PlayerStats } from "./util/stats";
import { Encounter, encounterToString, getClassName } from "@shandi/data/data";
import { formatDamage, formatPercentage } from "./util/format";
import { NavLink, Outlet, Route, Routes, useParams } from "react-router-dom";
import classNames from "classnames";
import { RAID_BANNERS } from "@shandi/data/assets";
import PlayerDamageTable from "./PlayerDamageTable";
import BattleGraphs from "./BattleGraphs";
import PlayerOverview from "./PlayerOverview";
import BattleDebugOverlay from "./BattleDebugOverlay";

function BattleBannerPlayerDetailsCard({
  player,
  playerStats,
  battleStats,
}: {
  player: lsb.Player & { character: lsb.Character };
  playerStats: PlayerStats;
  battleStats: BattleStats;
}) {
  return (
    <div
      className="bg-gray-900 border border-gray-800 h-32 flex flex-col text-gray-50 p-2 ml-auto gap-2 rounded-sm m-2"
      style={{ width: "26rem" }}
    >
      <div className="flex flex-row items-center gap-2">
        <img
          alt={getClassName(player.character.classId)}
          src={`/classes/${player.character.classId}.png`}
          className="h-6"
        />
        <div className="text-2xl">{player.character.name}</div>
        <div className="ml-auto p-1 bg-gray-800 border-gray-700 border flex flex-row items-center gap-1">
          {player.character.gearLevel.toFixed(2)}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-2xl flex flex-col items-end">
          {formatDamage(playerStats.damage / battleStats.duration())}
          <span className="text-xs text-gray-200">DPS</span>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-2xl flex flex-col items-end">
          {formatPercentage(playerStats.crits / playerStats.hits)}
          <span className="text-xs text-gray-200">CRIT</span>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-2xl flex flex-col items-end">
          {formatPercentage(playerStats.pos / playerStats.hits)}
          <span className="text-xs text-gray-200">POS</span>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-2xl flex flex-col items-end">
          {formatPercentage(playerStats.damage / battleStats.totalDamage)}
          <span className="text-xs text-gray-200">TOTAL</span>
        </div>
      </div>
    </div>
  );
}

function TabItem({ children, to }: { to: string; children?: React.ReactNode }) {
  return (
    <NavLink
      end
      to={to}
      className={({ isActive, isPending }) =>
        classNames(
          "inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300",
          {
            "text-blue-300 border-blue-600 active": isActive,
          },
          {
            "border-transparent": !isActive,
          }
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function BattleBanner({
  encounter,
  player,
  playerId,
  playerStats,
  battleStats,
  children,
}: {
  encounter?: Encounter;
  battleStats: BattleStats;
  playerId?: string;
  player?: lsb.Player;
  playerStats?: PlayerStats;
  children?: React.ReactNode;
}) {
  let backgroundImage = "";
  if (encounter && RAID_BANNERS[encounter.name]) {
    backgroundImage = RAID_BANNERS[encounter.name];
  }

  return (
    <div
      className="h-36 flex flex-row border-b border-gray-950"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% auto",
      }}
    >
      <div className="flex flex-col">
        <div className="flex flex-grow text-gray-100 p-2">
          <h1 className="text-2xl text-gray-300 font-bold">
            {encounter ? encounterToString(encounter) : "Unknown Encounter"}
          </h1>
        </div>
        <div className="flex flex-row">
          <div className="mt-auto bg-gray-900 rounded-sm border border-gray-800 m-2 flex-shrink">
            <div className="text-sm font-medium text-center text-gray-500">
              <ul className="flex flex-wrap -mb-px">
                <TabItem to={`.`}>Overview</TabItem>
                <TabItem to={`graphs`}>Graphs</TabItem>
                {playerId && (
                  <TabItem to={`players/${playerId}`}>Skills</TabItem>
                )}
                {playerId && (
                  <TabItem to={`players/${playerId}/casted-buffs`}>
                    Casted Buffs
                  </TabItem>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {player && playerStats && player.character && (
        <BattleBannerPlayerDetailsCard
          player={player as lsb.Player & { character: lsb.Character }}
          playerStats={playerStats}
          battleStats={battleStats}
        />
      )}
      <div className="flex flex-row text-gray-50 ml-auto gap-2 rounded-sm p-2 mt-auto">
        {children}
      </div>
    </div>
  );
}

function BattleContainer({
  battleStats,
  children,
  showDebugOverlay,
}: {
  battleStats: BattleStats;
  children?: React.ReactNode;
  showDebugOverlay?: boolean;
}) {
  const { playerId } = useParams();

  return (
    <div>
      {showDebugOverlay && <BattleDebugOverlay battleStats={battleStats} />}
      <BattleBanner
        encounter={battleStats.encounter}
        battleStats={battleStats}
        children={children}
        playerId={playerId}
      />
      <Outlet />
    </div>
  );
}

export type BattleOverviewOpts = {
  onlyShowPlayers: boolean;
  filterTargets: boolean;
};

export default function BattleOverview({
  battleStats,
  opts,
  children,
  showDebugOverlay,
}: {
  battleStats: BattleStats;
  opts?: BattleOverviewOpts;
  children?: React.ReactNode;
  showDebugOverlay?: boolean;
}) {
  opts = opts || { onlyShowPlayers: true, filterTargets: true };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <BattleContainer
            battleStats={battleStats}
            children={children}
            showDebugOverlay={showDebugOverlay}
          />
        }
      >
        <Route
          index
          element={
            <PlayerDamageTable
              battleStats={battleStats}
              onlyShowPlayers={opts.onlyShowPlayers}
            />
          }
        />
        <Route
          path="graphs"
          element={<BattleGraphs battleStats={battleStats} />}
        />
        <Route
          path="players/:playerId/*"
          element={<PlayerOverview battleStats={battleStats} />}
        />
      </Route>
    </Routes>
  );
}

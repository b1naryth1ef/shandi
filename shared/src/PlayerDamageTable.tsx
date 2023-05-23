import { getClassName, getNPCInfo } from "@shandi/data/data";
import { BattleStats, PlayerStats } from "./util/stats";
import { Entity, Player } from "@shandi/lsb/lsb";
import classNames from "classnames";
import { formatDamage, formatDuration, formatPercentage } from "./util/format";
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useNavigate } from "react-router-dom";

const DPS_WINDOW_SIZE = 15;

export function getPlayerDPSGraphData(
  battleStats: BattleStats,
  groupByParty?: boolean
) {
  const size = Math.round(battleStats.duration() + 1);
  const playerDamage = new Map<string, Array<number>>();
  const playerSeries = new Map();

  for (const [playerId, player] of Object.entries(battleStats.battle.players)) {
    playerDamage.set(playerId, new Array(size).fill(0));

    playerSeries.set(playerId, {
      name: `${player.character ? player.character.name : playerId} (${
        player.character ? getClassName(player.character.classId) : ""
      })`,
      type: "line",
      showSymbol: false,
      emphasis: {
        focus: "series",
      },
      data: Array(size).fill(0),
    });
  }

  for (const event of battleStats.battle.events) {
    if (event.damage) {
      const sourceId = battleStats.getId(event.damage.sourceId);
      const damage = playerDamage.get(sourceId);
      if (!damage) {
        continue;
      }

      const offset = Math.round(
        (event.ts!!.getTime() - battleStats.battle.start!!.getTime()) / 1000
      );

      for (const hit of event.damage.hits) {
        const targetEntity = battleStats.battle.entities[hit.targetId];
        if (targetEntity !== undefined) {
          if (
            battleStats.opts.filterTarget &&
            !battleStats.opts.filterTarget(targetEntity.typeId)
          ) {
            continue;
          }

          damage[offset] += hit.damage + hit.dot;
        }
      }
    }
  }

  for (const [playerId, series] of Array.from(playerSeries.entries())) {
    let window = new Array(DPS_WINDOW_SIZE).fill(0);
    const damage = playerDamage.get(playerId);
    if (!damage) continue;

    for (let i = 0; i < size; i++) {
      window.push(damage[i]);
      if (window.length > DPS_WINDOW_SIZE) {
        window = window.slice(window.length - DPS_WINDOW_SIZE);
      }
      series.data[i] = window.reduce((a, b) => a + b) / DPS_WINDOW_SIZE;
    }
  }

  if (!groupByParty) {
    return playerSeries;
  }

  const partySeries = new Map();
  for (const [playerId, player] of Object.entries(battleStats.battle.players)) {
    const ourPlayerSeries = playerSeries.get(playerId);
    if (!ourPlayerSeries) continue;

    if (!partySeries.has(player.partyId)) {
      partySeries.set(player.partyId, {
        name: `Party ${player.partyId}`,
        type: "line",
        showSymbol: false,
        emphasis: {
          focus: "series",
        },
        lineStyle: {
          color: player.partyId === 2 ? "#4ade80" : "#c084fc",
        },
        data: Array(size).fill(0),
      });
    }

    const ourPartySeries = partySeries.get(player.partyId);
    for (let i = 0; i < size; i++) {
      ourPartySeries.data[i] += ourPlayerSeries.data[i];
    }
  }

  return partySeries;
}

function EntityDamageRow({
  battleStats,
  playerStats,
  entity,
}: {
  battleStats: BattleStats;
  playerStats: PlayerStats;
  entity: Entity;
}) {
  const npcInfo = getNPCInfo(entity.typeId);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row bg-gray-600 text-blue-50 hover:bg-gray-700 items-center">
        <div className={classNames("rounded-full p-1 ml-2 bg-slate-400")}></div>
        <div className="flex-grow flex flex-row items-center gap-2 p-2">
          <div className="mx-4 h-8 text-white rounded-sm flex items-center justify-center text-2xl">
            <span>?</span>
          </div>
          <div className="flex flex-col">
            <div className="truncate" style={{ maxWidth: "16rem" }}>
              {npcInfo?.name}
            </div>
            <div className="text-sm font-light text-gray-300">
              {npcInfo?.grade}
            </div>
          </div>
        </div>
        <div className="flex flex-row divide-x divide-gray-500 items-center gap-2">
          <div className="flex flex-col items-center p-2 w-16"></div>
          <div className="flex flex-col items-center p-2 w-16"></div>
          <div className="flex flex-col items-center p-2 w-16"></div>
          <div className="flex flex-col items-center p-2 w-16"></div>
          <div className="flex flex-col items-center p-2 w-16"></div>
          <div className="flex flex-col items-center p-2 w-20">
            <div>{formatDamage(playerStats.damage)}</div>
            <div className="text-xs font-light text-gray-400">TOTAL</div>
          </div>
          <div className="flex flex-col items-center p-2 w-16">
            <div>
              {formatDamage(playerStats.damage / battleStats.duration())}
            </div>
            <div className="text-xs font-light text-gray-400">DPS</div>
          </div>
        </div>
        <div
          className="flex flex-inital p-2 border-gray-900 border-x"
          style={{ width: "33%", height: "64px" }}
        ></div>
        <div className="flex text-xl p-2 w-16 text-gray-100 justify-center">
          {formatPercentage(playerStats.damage / battleStats.totalDamage)}
        </div>
      </div>
    </div>
  );
}

function PlayerDamageRow({
  battleStats,
  playerStats,
  playerId,
  player,
}: {
  battleStats: BattleStats;
  playerStats: PlayerStats;
  playerId: string;
  player: Player;
}) {
  const navigate = useNavigate();
  const opts = useMemo(() => {
    const lines = getPlayerDPSGraphData(battleStats);
    const xAxis: Array<string> = [];
    for (let i = 0; i < battleStats.duration() + 1; i += 1) {
      xAxis.push(`${Math.round(i / 60)}:${("00" + (i % 60)).slice(-2)}`);
    }

    for (const key of Array.from(lines.keys())) {
      const line = lines.get(key);
      line.lineStyle = { color: "#9ba6b1", width: 0.5 };
      line.emphasis = undefined;
    }

    const ourLine = lines.get(playerId);
    if (!ourLine) return null;
    ourLine.lineStyle = { color: "#ff6961", width: 2 };

    const opts = {
      series: Array.from(lines.values()),
      grid: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
      xAxis: {
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        data: xAxis,
      },
      yAxis: {
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        type: "value",
      },
    };
    return opts;
  }, [battleStats, playerId]);

  return (
    <div className="flex flex-col">
      <div
        className={classNames(
          "flex flex-row bg-gray-800 text-blue-50 hover:bg-gray-700 items-center",
          { "cursor-pointer": battleStats.id }
        )}
        onClick={() => {
          if (battleStats.id) {
            navigate(`players/${playerId}`);
          }
        }}
      >
        <div
          className={classNames("rounded-full p-1 ml-2", {
            "bg-green-400": player.partyId === 2,
            "bg-purple-400": player.partyId === 1,
          })}
        ></div>
        {player.character && (
          <div className="flex-grow flex flex-row items-center gap-2 p-2">
            <img
              alt={getClassName(player.character.classId)}
              src={`/classes/${player.character.classId}.png`}
              className="h-8"
            />
            <div className="flex flex-col w-32">
              <div>{player.character.name}</div>
              <div className="text-sm font-light text-gray-300">
                {player.character.gearLevel.toFixed(2)}
              </div>
            </div>
          </div>
        )}
        {!player.character && (
          <div className="flex-grow flex flex-row items-center gap-2 p-2"></div>
        )}
        <div className="flex flex-row divide-x divide-gray-900 items-center gap-2">
          <div className="flex flex-col items-center p-2 w-16">
            <div>
              {playerStats.deathTime
                ? formatDuration(playerStats.deathTime)
                : formatDuration(battleStats.duration())}
            </div>
            <div className="text-xs font-light text-gray-400">ALIVE</div>
          </div>
          <div className="flex flex-col items-center p-2 w-16">
            <div>{playerStats.hits}</div>
            <div className="text-xs font-light text-gray-400">HIT</div>
          </div>
          <div className="flex flex-col items-center p-2 w-16">
            <div>{playerStats.counters}</div>
            <div className="text-xs font-light text-gray-400">CNTR</div>
          </div>
          <div className="flex flex-col items-center p-2 w-16">
            <div>{formatPercentage(playerStats.pos / playerStats.hits)}</div>
            <div className="text-xs font-light text-gray-400">POS</div>
          </div>
          <div className="flex flex-col items-center p-2 w-16">
            <div>{formatPercentage(playerStats.crits / playerStats.hits)}</div>
            <div className="text-xs font-light text-gray-400">CRIT</div>
          </div>
          <div className="flex flex-col items-center p-2 w-20">
            <div>{formatDamage(playerStats.damage)}</div>
            <div className="text-xs font-light text-gray-400">TOTAL</div>
          </div>
          <div className="flex flex-col items-center p-2 w-16">
            <div>
              {formatDamage(playerStats.damage / battleStats.duration())}
            </div>
            <div className="text-xs font-light text-gray-400">DPS</div>
          </div>
        </div>
        <div
          className="flex flex-inital p-2 border-gray-900 border-x"
          style={{ width: "33%", height: "64px" }}
        >
          {opts !== null && (
            <ReactECharts
              option={opts}
              style={{ height: "100%", width: "100%" }}
            />
          )}
        </div>
        <div className="flex text-xl p-2 w-16 text-gray-100 justify-center">
          {formatPercentage(playerStats.damage / battleStats.totalDamage)}
        </div>
      </div>
    </div>
  );
}

export default function PlayerDamageTable({
  battleStats,
  onlyShowPlayers,
  emptyState,
}: {
  battleStats: BattleStats;
  onlyShowPlayers?: boolean;
  emptyState?: JSX.Element;
}) {
  const players = useMemo(
    () => battleStats.getPlayerStatsList(onlyShowPlayers),
    [battleStats, onlyShowPlayers]
  );

  if (players.length === 0 && emptyState) {
    return emptyState;
  }

  return (
    <div className="flex flex-col bg-white divide-y divide-gray-900">
      {players.map(([key, playerStats]) => {
        const player = battleStats.battle.players[key];
        if (player) {
          return (
            <PlayerDamageRow
              key={key}
              battleStats={battleStats}
              playerStats={playerStats}
              playerId={key}
              player={player}
            />
          );
        }

        const entity = battleStats.battle.entities[key];
        if (entity) {
          return (
            <EntityDamageRow
              key={key}
              battleStats={battleStats}
              playerStats={playerStats}
              entity={entity}
            />
          );
        }

        return <></>;
      })}
    </div>
  );
}

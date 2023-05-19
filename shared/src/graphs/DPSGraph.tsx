import { getClassName } from "@shandi/data/data";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatDamage } from "../util/format";
import { BattleStats } from "../util/stats";

const DPS_WINDOW_SIZE = 15;

export function getPlayerDPSGraphData(
  battleStats: BattleStats,
  groupByParty?: boolean,
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
        (event.ts!!.getTime() - battleStats.battle.start!!.getTime()) / 1000,
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

export default function DPSGraph({
  battleStats,
  element,
}: {
  battleStats: BattleStats;
  element: HTMLDivElement | null;
}) {
  const [groupByParty, setGroupByParty] = useState(false);
  const playerSeries = useMemo(() => {
    return Array.from(
      getPlayerDPSGraphData(battleStats, groupByParty).values(),
    );
  }, [battleStats, groupByParty]);

  const xAxis: Array<string> = [];
  for (let i = 0; i < battleStats.duration() + 1; i += 1) {
    xAxis.push(`${Math.round(i / 60)}:${("00" + (i % 60)).slice(-2)}`);
  }

  const option = {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: any) => {
        return formatDamage(value);
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {
          iconStyle: {
            color: "#ffffff",
          },
        },
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    legend: {
      data: playerSeries.map((it) => it.name),
      top: 25,
      type: "scroll",
      textStyle: {
        color: "#ffffff",
      },
    },
    xAxis: {
      boundaryGap: false,
      data: xAxis,
      axisLabel: {
        textStyle: {
          color: "#ffffff",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        textStyle: {
          color: "#ffffff",
        },
        formatter: function (d: any) {
          return formatDamage(d);
        },
      },
    },
    series: playerSeries,
  };

  return (
    <div>
      {groupByParty && <ReactECharts option={option} style={{ height: 400 }} />}
      {!groupByParty && <ReactECharts
        option={option}
        style={{ height: 400 }}
      />}
      {element &&
        createPortal(
          <>
            <input
              id="default-checkbox"
              type="checkbox"
              checked={groupByParty}
              onChange={(e) => {
                setGroupByParty(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label className="ml-2 text-sm font-medium text-gray-300">
              Group By Party
            </label>
          </>,
          element,
        )}
    </div>
  );
}

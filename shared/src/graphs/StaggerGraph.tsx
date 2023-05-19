import { getNPCInfo } from "@shandi/data/data";
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { BattleStats } from "../util/stats";
import { formatDamage } from "../util/format";

function getStaggerGraphData(battleStats: BattleStats): any[] {
  const targetSeries = new Map();

  for (const event of battleStats.battle.events) {
    if (!event.staggerState) continue;

    let series = targetSeries.get(event.staggerState.objectId);
    if (!series) {
      const target = battleStats.battle.entities[event.staggerState.objectId];
      const npcInfo = target ? getNPCInfo(target.typeId) : null;

      series = {
        name: npcInfo
          ? `${npcInfo.name} (${npcInfo.grade} / ${npcInfo.type})`
          : `${event.staggerState.objectId}`,
        type: "line",
        showSymbol: false,
        emphasis: {
          focus: "series",
        },
        data: [],
      };
      targetSeries.set(event.staggerState.objectId, series);
    }

    const offset = Math.round(
      (event.ts!!.getTime() - battleStats.battle.start!!.getTime()) / 1000
    );
    if (
      series.data.length &&
      series.data[series.data.length - 1][0] === offset
    ) {
      series.data[series.data.length - 1][1] =
        event.staggerState.paralyzationMaxPoint -
        event.staggerState.paralyzationPoint;
    } else {
      series.data.push([
        offset,
        event.staggerState.paralyzationMaxPoint -
          event.staggerState.paralyzationPoint,
      ]);
    }
  }

  return Array.from(targetSeries.values());
}

export default function StaggerGraph({
  battleStats,
}: {
  battleStats: BattleStats;
}) {
  const series = useMemo(() => {
    return getStaggerGraphData(battleStats);
  }, [battleStats]);

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
    series,
  };

  return (
    <div>
      <ReactECharts option={option} style={{ height: 400 }} />
    </div>
  );
}

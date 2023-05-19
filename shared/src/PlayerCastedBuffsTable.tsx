import { useMemo } from "react";
import { getSkillBuffInfo } from "@shandi/data/data";
import { BattleStats, CastedBuffStats, PlayerStats } from "./util/stats";
import { formatDamage, formatDuration, formatPercentage } from "./util/format";

export function sanitizeDescription(data: string): string {
  return data.replace(new RegExp("<.*>(.*)</.*>"), "$1");
}

function CastedBuffRow({
  castedBuffStats,
  battleStats,
  playerId,
}: {
  castedBuffStats: CastedBuffStats;
  battleStats: BattleStats;
  playerId: string;
}) {
  const [partyDamage, totalBuffDamage] = useMemo(() => {
    const partyDamage = battleStats.getPartyDamage(
      battleStats.getPartyId(playerId)
    );
    const totalBuffDamage = Array.from(
      castedBuffStats.damageDoneBySourceId.values()
    ).reduce((a, b) => a + b, 0);
    return [partyDamage, totalBuffDamage];
  }, [playerId, battleStats, castedBuffStats]);

  const buffInfo = getSkillBuffInfo(castedBuffStats.effectId);
  if (!buffInfo) {
    return <></>;
  }

  return (
    <tr className="border hover:bg-gray-600 cursor-pointer bg-gray-800 border-gray-900">
      <th
        scope="row"
        className="flex items-center p-2 whitespace-nowrap text-white"
      >
        {buffInfo.icon && (
          <img
            alt=""
            className="w-8 h-8 border border-black rounded-sm"
            src={`/images/${buffInfo.icon}`}
          />
        )}
        {!buffInfo.icon && (
          <div className="w-8 h-8 border border-black rounded-sm bg-gray-600 flex items-center justify-center">
            <span>?</span>
          </div>
        )}
        <div className="pl-3">
          <div className="text-base font-semibold">
            {sanitizeDescription(buffInfo.name)}
          </div>
          <div className="text-xs font-normal text-gray-500 gap-2 flex flex-row">
            {sanitizeDescription(buffInfo.desc).substring(0, 96)}
          </div>
        </div>
      </th>
      <td className="px-1 py-1">
        {formatPercentage(totalBuffDamage / partyDamage)}
      </td>
      <td className="px-1 py-1">{formatDamage(totalBuffDamage)}</td>
      <td className="px-1 py-1">
        {formatDuration(castedBuffStats.totalUptime)}
      </td>
      <td className="px-1 py-1">
        {formatPercentage(castedBuffStats.totalUptime / battleStats.duration())}
      </td>
      <td className="px-1 py-1">
        {formatPercentage(
          castedBuffStats.totalUptime /
            castedBuffStats.uniqueTargetIds.size /
            battleStats.duration()
        )}
      </td>
      <td className="px-1 py-1">{castedBuffStats.totalCount}</td>
      <td className="px-1 py-1">{castedBuffStats.uniqueTargetIds.size}</td>
      <td className="px-1 py-1">
        {castedBuffStats.totalValue === 0
          ? ""
          : formatDamage(castedBuffStats.totalValue)}
      </td>
      <td className="px-1 py-1">
        {castedBuffStats.totalValueDelta === 0
          ? ""
          : formatDamage(castedBuffStats.totalValueDelta)}
      </td>
      <td className="px-1 py-1">{buffInfo.category}</td>
    </tr>
  );
}

export default function PlayerCastedBuffsTable({
  playerId,
  playerStats,
  battleStats,
}: {
  playerId: string;
  playerStats: PlayerStats;
  battleStats: BattleStats;
}) {
  const buffs = useMemo(() => {
    return Array.from(playerStats.castedBuffs.values()).sort((a, b) => {
      const ad = Array.from(a.damageDoneBySourceId.values()).reduce(
        (a, b) => a + b,
        0
      );
      const bd = Array.from(b.damageDoneBySourceId.values()).reduce(
        (a, b) => a + b,
        0
      );
      return bd - ad;
    });
  }, [playerStats]);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-400 bg-gray-700">
        <thead className="text-xs uppercase bg-gray-700 text-gray-400">
          <tr>
            <th scope="col" className="px-2 py-2">
              Name
            </th>
            <th scope="col" className="px-2 py-2">
              Damage Uptime
            </th>
            <th scope="col" className="px-2 py-2">
              Damage
            </th>
            <th scope="col" className="px-2 py-2">
              Uptime
            </th>
            <th scope="col" className="px-2 py-2">
              Absolute %
            </th>
            <th scope="col" className="px-2 py-2">
              Estimated %
            </th>
            <th scope="col" className="px-2 py-2">
              Count
            </th>
            <th scope="col" className="px-2 py-2">
              Targets
            </th>
            <th scope="col" className="px-2 py-2">
              Given
            </th>
            <th scope="col" className="px-2 py-2">
              Used
            </th>
            <th scope="col" className="px-2 py-2">
              Category
            </th>
          </tr>
        </thead>
        <tbody>
          {buffs.map((it) => (
            <CastedBuffRow
              key={it.effectId}
              castedBuffStats={it}
              battleStats={battleStats}
              playerId={playerId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useMemo, useState } from "react";
import { getSkillEffectInfo, getSkillInfo } from "@shandi/data/data";
import classNames from "classnames";
import SkillInfoCard from "./SkillInfoCard";
import { PlayerStats, SkillStats, mergeSkillStats } from "./util/stats";
import { formatDamage, formatPercentage } from "./util/format";

export class MergedSkillStats {
  byEffectId: Map<number, Array<SkillStats>> = new Map();
  bySkillId: Map<number, Array<SkillStats>> = new Map();
  byName: Map<string, Array<SkillStats>> = new Map();

  constructor(data: SkillStats[]) {
    for (const stats of data) {
      const byEffectId = this.byEffectId.get(stats.skillEffectId);
      if (!byEffectId) {
        this.byEffectId.set(stats.skillEffectId, [stats]);
      } else {
        byEffectId.push(stats);
      }

      const bySkillId = this.bySkillId.get(stats.skillId);
      if (!bySkillId) {
        this.bySkillId.set(stats.skillId, [stats]);
      } else {
        bySkillId.push(stats);
      }

      const skillInfo = getSkillInfo(stats.skillId);
      if (skillInfo) {
        const byName = this.byName.get(skillInfo.name);
        if (!byName) {
          this.byName.set(skillInfo.name, [stats]);
        } else {
          byName.push(stats);
        }
      }
    }
  }
}

function SkillRow({
  skillStats,
  playerStats,
  children,
}: {
  skillStats: SkillStats;
  playerStats: PlayerStats;
  children?: Array<SkillStats>;
}) {
  const [expanded, setExpanded] = useState(false);
  const skillEffectInfo = getSkillEffectInfo(skillStats.skillEffectId);
  const damagePercentage = skillStats.damage / playerStats.damage;
  const skillDetails = playerStats.skillDetails.get(skillStats.skillId);
  const [isHovered, setIsHovered] = useState(false);
  const skillInfo = getSkillInfo(skillStats.skillId);

  return (
    <>
      <tr
        className={classNames("hover:bg-gray-600 border-y cursor-pointer", {
          "bg-gray-800 border-gray-900": children !== undefined,
          "bg-gray-900 border-black": children === undefined,
        })}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <th
          scope="row"
          className="flex items-center p-2 whitespace-nowrap text-white"
        >
          {children !== undefined && (
            <>
              {skillInfo && skillInfo.icon && children !== undefined && (
                <img
                  alt=""
                  className="w-8 h-8 border border-black rounded-sm"
                  src={`/images/${skillInfo.icon}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                />
              )}
              {skillInfo && (
                <SkillInfoCard
                  skillId={skillStats.skillId}
                  show={isHovered}
                  details={skillDetails}
                />
              )}
              {(!skillInfo || !skillInfo.icon) && children !== undefined && (
                <div
                  className="w-8 h-8 border border-black rounded-sm bg-gray-600 flex items-center justify-center"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <span>?</span>
                </div>
              )}
              {children !== undefined && (
                <div className="pl-3 flex flex-col gap-1">
                  <div className="text-base font-semibold">
                    {skillInfo?.name}
                  </div>
                  <div className="w-64">
                    <div
                      className="bg-red-400 h-0.5 rounded-md"
                      style={{ width: formatPercentage(damagePercentage) }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}

          {children === undefined && (
            <div className="w-8 h-8 flex items-center justify-center"></div>
          )}
          {children === undefined && (
            <div className="pl-9">
              <div className="text-xs font-normal text-gray-400 gap-2 flex flex-row">
                <span>Skill ID: {skillStats.skillId}</span>
                {skillStats.skillEffectId !== 0 && (
                  <span>Skill Effect ID: {skillStats.skillEffectId}</span>
                )}
                {skillEffectInfo && <span>{skillEffectInfo.comment}</span>}
              </div>
            </div>
          )}
        </th>
        <td className="p-2">{formatDamage(skillStats.damage)}</td>
        <td className="p-2">{formatPercentage(damagePercentage)}</td>
        <td className="p-2">
          {formatPercentage(skillStats.crits / skillStats.hits)}
        </td>
        <td className="p-2">
          {formatPercentage(skillStats.pos / skillStats.hits)}
        </td>
        <td className="p-2">{skillStats.hits}</td>
        <td className="p-2">{skillStats.casts}</td>
        <td className="p-2">
          {formatDamage(skillStats.damage / skillStats.hits)}
        </td>
        <td className="p-2">{formatDamage(skillStats.max)}</td>
      </tr>
      {expanded &&
        children &&
        children.map((it, idx) => (
          <SkillRow key={idx} skillStats={it} playerStats={playerStats} />
        ))}
    </>
  );
}

export default function PlayerSkillsTable({
  playerStats,
}: {
  playerStats: PlayerStats;
}) {
  const sortedSkillStats = useMemo(() => {
    const mergedSkillStats = new MergedSkillStats(
      Array.from(playerStats.skills.values())
    );

    const byName = Array.from(mergedSkillStats.byName.values());
    return byName.sort((a, b) => {
      const ar = a.reduce(mergeSkillStats);
      const br = b.reduce(mergeSkillStats);
      return br.damage - ar.damage;
    });
  }, [playerStats]);

  return (
    <div className="relative bg-gray-700">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs uppercase bg-gray-700 text-gray-400">
          <tr>
            <th scope="col" className="px-2 py-2">
              Name
            </th>
            <th scope="col" className="px-2 py-2">
              Total
            </th>
            <th scope="col" className="px-2 py-2">
              Damage %
            </th>
            <th scope="col" className="px-2 py-2">
              Crit %
            </th>
            <th scope="col" className="px-2 py-2">
              Pos %
            </th>
            <th scope="col" className="px-2 py-2">
              Hits
            </th>
            <th scope="col" className="px-2 py-2">
              Casts
            </th>
            <th scope="col" className="px-2 py-2">
              Avg
            </th>
            <th scope="col" className="px-2 py-2">
              Max
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSkillStats.map((items, idx) => {
            const merged = items.reduce(mergeSkillStats);

            return (
              <SkillRow
                key={idx}
                skillStats={merged}
                children={items}
                playerStats={playerStats}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

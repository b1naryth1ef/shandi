import { RAID_ICONS } from "@shandi/data/assets";
import {
  BiBlock,
  BiCheck,
  BiLockAlt,
  BiLowVision,
  BiQuestionMark,
  BiShow,
} from "react-icons/bi";
import {
  encounterToString,
  getClassName,
  getEncounter,
} from "@shandi/data/data";
import { BattleResult, Character } from "@shandi/lsb/lsb";
import { useMemo } from "react";
import Label from "./Label";
import { timeSince } from "./util/time";
import { formatDamage, formatDuration } from "./util/format";
import classNames from "classnames";

export enum LandBattleVisibility {
  PUBLIC = 0,
  UNLISTED = 1,
  PRIVATE = 2,
}

export interface GenericBattle {
  id: string;
  started_at: string;
  ended_at: string;
  encounter_id: number | null;
  result: BattleResult | null;
  composition?: Array<Array<Partial<Character & { isLocal: boolean }>>>;
  visibility?: LandBattleVisibility;
  total_damage?: number;
}

function groupBy<T>(items: Array<T>, key: string): Record<any, Array<T>> {
  return items.reduce(
    (result: any, item: any) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {},
  );
}

function BattleResultLabel({ result }: { result: BattleResult }) {
  return (
    <>
      {result === BattleResult.DUNGEON_CLEAR && (
        <Label
          className="border-green-800 bg-green-300 text-black"
          icon={<BiCheck />}
        >
          clear
        </Label>
      )}
      {result === BattleResult.DUNGEON_FAIL && (
        <Label
          className="border-red-800 bg-red-300 text-black"
          icon={<BiBlock />}
        >
          wipe
        </Label>
      )}
      {(result === BattleResult.UNKNOWN ||
        result === BattleResult.UNRECOGNIZED) && (
        <Label icon={<BiQuestionMark />}>unknown</Label>
      )}
    </>
  );
}

function BattleRow({
  battle,
  onClick,
  hasVisibility,
  hasTotalDamage,
}: {
  battle: GenericBattle;
  onClick?: () => void;
  hasVisibility?: boolean;
  hasTotalDamage?: boolean;
}) {
  const encounter = battle.encounter_id
    ? getEncounter(battle.encounter_id)
    : null;

  const duration = (new Date(battle.ended_at).getTime() -
    new Date(battle.started_at).getTime()) /
    1000;

  return (
    <tr
      className="bg-gray-800 border-b border-gray-900 hover:bg-gray-900 text-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <th
        scope="row"
        className="flex items-center px-2 py-2 text-white whitespace-nowrap"
      >
        {encounter && (
          <img
            className="w-8 h-8 rounded-sm border-gray-900 border shadow-inner"
            alt="encounter icon"
            src={RAID_ICONS[encounter?.name]}
          />
        )}
        {encounter && (
          <div className="pl-3">
            <div className="text-base font-semibold">
              {encounterToString(encounter, false)}
            </div>
            <div className="text-xs font-normal text-gray-400 divide-x gap-2 flex flex-row">
              {encounter.difficulty !== "" && encounter.difficulty}
            </div>
          </div>
        )}
      </th>
      <td className="hidden lg:table-cell">
        {battle.composition && (
          <div className="flex flex-row gap-6">
            {battle.composition.map((members, idx) => (
              <PartyComposition key={idx} party={members} />
            ))}
          </div>
        )}
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-row items-center">
          {battle.result && <BattleResultLabel result={battle.result} />}
        </div>
      </td>
      <td className="hidden lg:table-cell">
        {timeSince(new Date(battle.started_at).getTime(), new Date().getTime())}
        {" "}
        ago
      </td>
      <td>{formatDuration(duration)}</td>
      {hasTotalDamage && (
        <td className="font-medium">
          {battle.total_damage && formatDamage(battle.total_damage / duration)}
        </td>
      )}
      {hasVisibility && (
        <td className="flex flex-col items-center">
          {battle.visibility === LandBattleVisibility.UNLISTED && (
            <BiLowVision className="w-6 h-6" />
          )}
          {battle.visibility === LandBattleVisibility.PRIVATE && (
            <BiLockAlt className="w-6 h-6" />
          )}
          {battle.visibility === LandBattleVisibility.PUBLIC && (
            <BiShow className="w-6 h-6" />
          )}
        </td>
      )}
    </tr>
  );
}

export default function BattleTable({
  battles,
  onClick,
  hasVisibility,
  hasTotalDamage,
}: {
  battles: Array<GenericBattle>;
  onClick?: (battle: GenericBattle) => void;
  hasVisibility?: boolean;
  hasTotalDamage?: boolean;
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-400 whitespace-nowrap bg-gray-700 relative">
        <thead className="text-xs uppercase text-gray-400 border-gray-900 border-b hidden">
          <tr>
            <th scope="col" className="py-3 px-2">
              Encounter
            </th>
            <th scope="col" className="py-3 px-2 hidden lg:table-cell">
              Composition
            </th>
            <th scope="col" className="py-3 px-2 hidden lg:table-cell">
              Result
            </th>
            <th scope="col" className="py-3 px-2 hidden lg:table-cell">
              Captured
            </th>
            <th scope="col" className="py-3 px-2 table-cell">
              Duration
            </th>
            {hasTotalDamage && (
              <th scope="col" className="py-3 px-2 table-cell">
                DPS
              </th>
            )}
            {hasVisibility && (
              <th scope="col" className="py-3 px-2 table-cell">
                Visibility
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {battles.map((it) => (
            <BattleRow
              key={it.id}
              battle={it}
              hasVisibility={hasVisibility}
              hasTotalDamage={hasTotalDamage}
              onClick={() => {
                if (onClick) onClick(it);
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PartyComposition({ party }: { party: Array<Partial<Character>> }) {
  // TODO: sorting in here?

  return (
    <div
      className={classNames(
        `flex flex-row p-1 border bg-gray-950 shadow-inner rounded-sm border-gray-700`,
      )}
    >
      {party.map((it, idx) => (
        <img
          key={idx}
          alt={getClassName(it.classId || 0)}
          src={`/classes/${it.classId}.png`}
          className="h-6"
        />
      ))}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import fetcher from "../util";
import * as lsb from "@shandi/lsb/lsb";
import BattleTable, {
  GenericBattle,
  LandBattleVisibility,
} from "@shandi/shared/src/BattleTable";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { BiDownArrow, BiSearch } from "react-icons/bi";
import { getEncounters, encounterToString } from "@shandi/data/data";

export type LandBattleMetadata = {
  total_boss_damage: number;
  class_composition: Array<Array<number>>;
};

export type LandBattle = {
  id: string;
  hash: string;
  started_at: string;
  ended_at: string;
  encounter_id: number;
  result: lsb.BattleResult;
  data: string | null;
  visibility: LandBattleVisibility;
  owner_id: string | null;
  metadata: LandBattleMetadata;
};

type ListBattleArgs = {
  page: number;
  encounter_ids?: Array<number>;
  only_clears?: string;
};

function toGenericBattle(battle: LandBattle): GenericBattle {
  const parties = battle.metadata.class_composition
    .filter((it) => it !== null)
    .map((it) => {
      return it.map((classId) => ({ classId }));
    });

  return {
    ...battle,
    composition: parties,
    total_damage: battle.metadata.total_boss_damage,
  };
}

function EncounterDropdown({
  show,
  setShow,
  encounterIds,
  setEncounterIds,
}: {
  show?: boolean;
  setShow: (value: boolean) => void;
  encounterIds: Array<number>;
  setEncounterIds: (encounterIds: Array<number>) => void;
}) {
  const [filter, setFilter] = useState("");
  const encounters = useMemo(() => {
    return getEncounters()
      .filter((it) =>
        encounterToString(it, true)
          .toLocaleLowerCase()
          .includes(filter.toLocaleLowerCase())
      )
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          encounterToString(a, true).localeCompare(encounterToString(b, true))
      );
  }, [filter]);

  const ref: any = useRef(null);
  const buttonRef: any = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        ref.current &&
        !ref.current.contains(event.target) &&
        (!buttonRef.current || !buttonRef.current.contains(event.target))
      ) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, buttonRef, setShow]);

  return (
    <>
      <button
        className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-sm text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
        ref={buttonRef}
        onClick={() => setShow(!show)}
      >
        Filter Encounter
        <BiDownArrow className="h-4 w-4 text-white ml-2" />
      </button>
      <div
        ref={ref}
        className={classNames(
          "z-10 bg-white rounded-sm shadow w-60 dark:bg-gray-700 absolute left-0 top-24 mt-2 ml-2",
          { hidden: !show }
        )}
      >
        <div className="p-3">
          <label className="sr-only">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <BiSearch className="h-4 w-4 text-white" />
            </div>
            <input
              type="text"
              id="input-group-search"
              className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search Encounters"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <ul
          className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
          aria-labelledby="dropdownSearchButton"
        >
          {encounters.map((encounter) => (
            <li>
              <div className="flex items-center pl-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                <input
                  id="checkbox-item-11"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                  checked={encounterIds.includes(encounter.id)}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setEncounterIds(
                        encounterIds.filter((it) => it !== encounter.id)
                      );
                    } else {
                      setEncounterIds([...encounterIds, encounter.id]);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (encounterIds.includes(encounter.id)) {
                      setEncounterIds(
                        encounterIds.filter((it) => it !== encounter.id)
                      );
                    } else {
                      setEncounterIds([...encounterIds, encounter.id]);
                    }
                  }}
                  className="py-2 ml-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                >
                  {encounterToString(encounter, true)}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function BattleFilterPanel({
  setArgs,
  isLoading,
}: {
  setArgs: React.Dispatch<React.SetStateAction<ListBattleArgs>>;
  isLoading: boolean;
}) {
  const [encounterOpen, setEncounterOpen] = useState(false);
  const [encounterIds, setEncounterIds] = useState<Array<number>>([]);
  const [onlyClears, setOnlyClears] = useState<boolean>(false);

  return (
    <div className="p-2 bg-gray-900 border-gray-950 border-b shadow-inner flex flex-row gap-6 items-center">
      <EncounterDropdown
        show={encounterOpen}
        setShow={setEncounterOpen}
        setEncounterIds={setEncounterIds}
        encounterIds={encounterIds}
      />
      <div className="flex items-center">
        <input
          id="default-checkbox"
          type="checkbox"
          checked={onlyClears}
          onChange={(e) => setOnlyClears(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          onClick={() => setOnlyClears(!onlyClears)}
          className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          Only Clears
        </button>
      </div>
      <div className="ml-auto"></div>
      <button
        onClick={() =>
          setArgs((state) => ({
            ...state,
            encounter_ids: encounterIds.length === 0 ? undefined : encounterIds,
            only_clears: onlyClears === false ? undefined : "1",
          }))
        }
        disabled={isLoading}
        className="px-2 py-1 flex flex-row items-center text-blue-100 bg-blue-600 disabled:bg-blue-300 hover:bg-blue-500 rounded-sm border-green-500"
      >
        Search
      </button>
    </div>
  );
}

export default function BattleList() {
  const [args, setArgs] = useState<ListBattleArgs>({ page: 1 });
  const { data: battles, isLoading } = useSWR(
    ["/api/battles", args],
    ([url, args]) => {
      const queryItems = Object.entries(args)
        .map(([key, value]) => {
          if (value === undefined) {
            return null;
          }
          return [key.toString(), value];
        })
        .filter((it) => it != null) as string[][];
      return fetcher<Array<LandBattle>>(
        `${url}?${new URLSearchParams(queryItems).toString()}`
      );
    }
  );
  const navigate = useNavigate();

  const battlesWithComposition = useMemo(() => {
    if (!battles) return;

    return battles.map((it) => toGenericBattle(it));
  }, [battles]);

  return (
    <>
      <BattleFilterPanel isLoading={isLoading} setArgs={setArgs} />
      {battlesWithComposition && (
        <BattleTable
          battles={battlesWithComposition}
          hasVisibility
          hasTotalDamage
          onClick={(battle) => navigate(`/battles/${battle.id}`)}
        />
      )}
    </>
  );
}

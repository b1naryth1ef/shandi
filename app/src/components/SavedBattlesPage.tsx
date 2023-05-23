import BattleOverview from "@shandi/shared/src/BattleOverview";
import BattleTable from "@shandi/shared/src/BattleTable";
import { BattleResult } from "@shandi/lsb/lsb";
import { useMemo } from "react";
import { BiShareAlt, BiTrash } from "react-icons/bi";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { useSavedBattle } from "../stores/SavedBattleStore";
import { openInExternalBrowser } from "../util/webview";
import { useSettingsStore } from "../stores/SettingsStore";

function groupBy<T>(items: Array<T>, key: string): Record<any, Array<T>> {
  return items.reduce(
    (result: any, item: any) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    }),
    {}
  );
}

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  return res.json();
}

export type SavedBattle = {
  id: string;
  hash: string;
  started_at: string;
  ended_at: string;
  encounter_id: number | null;
  result: BattleResult | null;
  characters: Array<{
    character: SavedBattleCharacter;
    party_id: number;
  }> | null;
  upload_id: string | null;
};

export type SavedBattleCharacter = {
  id: number;
  name: string;
  class_id: number;
};

export function SavedBattlesList() {
  const navigate = useNavigate();
  const { data } = useSWR<Array<SavedBattle>>(`/api/battles`, fetcher);

  const battles = useMemo(() => {
    if (!data) return;

    return data.map((battle) => {
      const composition = (
        battle.characters
          ? Object.values(groupBy(battle.characters, "party_id"))
          : []
      ).map((party) => {
        return party.map((it) => ({
          classId: it.character.class_id,
        }));
      });
      return { ...battle, composition };
    });
  }, [data]);

  if (!data || !battles) return <></>;
  return (
    <BattleTable
      battles={battles}
      onClick={(battle) => navigate(`/saved/${battle.id}`)}
    />
  );
}

export function SavedBattleView() {
  const { id } = useParams();
  const savedBattle = useSavedBattle(id);
  const settings = useSettingsStore((state) => state.settings);

  if (!savedBattle || !settings) return <></>;
  return (
    <BattleOverview
      battleStats={savedBattle.stats}
      showDebugOverlay={settings.developer}
    >
      <div className="flex flex-row text-gray-50 ml-auto gap-2 rounded-sm p-2 mt-auto">
        <button
          onClick={async () => {
            const res = await fetch(`/api/battles/${id}/upload`, {
              method: "POST",
            });
            if (!res.ok) {
              console.error("failed to upload log: ", await res.text());
              return;
            }

            const { url }: { url: string } = await res.json();
            openInExternalBrowser(url);
          }}
          className="px-3 py-2 text-black bg-green-400 rounded-md hover:bg-green-200 flex flex-row items-center gap-2"
        >
          Share
          <BiShareAlt className="text-black h-4 w-4" />
        </button>
        <button
          onClick={async () => {
            if (confirm("Delete Battle?")) {
              const res = await fetch(`/api/battles/${id}`, {
                method: "DELETE",
              });
              if (!res.ok) {
                console.error("Failed to delete battle: ", await res.text());
              }
            }
          }}
          className="px-3 py-2 text-black bg-red-400 rounded-md hover:bg-red-200 flex flex-row items-center gap-2"
        >
          Delete
          <BiTrash className="text-black h-4 w-4" />
        </button>
      </div>
    </BattleOverview>
  );
}

export default function SavedBattlesPage() {
  return (
    <Routes>
      <Route path="/" element={<SavedBattlesList />} />
      <Route path="/:id/*" element={<SavedBattleView />} />
    </Routes>
  );
}

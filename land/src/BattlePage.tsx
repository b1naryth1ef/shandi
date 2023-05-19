import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import * as lsb from "@shandi/lsb/lsb";
import { getAuthHeaders, useUserStore } from "./stores/UserStore";
import { loadBattleFromResponse } from "@shandi/shared/src/util/battle";
import { downloadFile } from "@shandi/shared/src/util/download";
import { BattleStats } from "@shandi/shared/src/util/stats";
import BattleOverview, {
  BattleOverviewOpts,
} from "@shandi/shared/src/BattleOverview";
import { BiCog, BiDownload, BiTrash, BiX } from "react-icons/bi";
import { LandBattle } from "./components/BattleList";
import Modal from "@shandi/shared/src/Modal";
import { LandBattleVisibility } from "@shandi/shared/src/BattleTable";

function VisibilitySelect({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (visibility: number) => void;
}) {
  return (
    <select
      className="text-black bg-gray-200 border-gray-700 border px-2 py-1"
      onChange={(e) => {
        onSelect(parseInt(e.target.value));
      }}
      value={selected}
    >
      <option value={LandBattleVisibility.PUBLIC}>Public</option>
      <option value={LandBattleVisibility.PRIVATE}>Private</option>
      <option value={LandBattleVisibility.UNLISTED}>Unlisted</option>
    </select>
  );
}

function BattleOverviewOptsModal({
  battle,
  battleStats,
  show,
  close,
  opts,
  setOpts,
}: {
  battle: LandBattle;
  battleStats: BattleStats;
  show: boolean;
  close: () => void;
  opts: BattleOverviewOpts;
  setOpts: React.Dispatch<React.SetStateAction<BattleOverviewOpts>>;
}) {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const download = async () => {
    const res = await fetch(`/api/battles/${battleStats.id}/data`, {
      headers: getAuthHeaders(),
    });
    await downloadFile(res, `${battleStats.id}.lsb`);
  };

  return (
    <Modal show={show} className="text-gray-800">
      <div className="flex justify-between border-b rounded-t p-5 text-black">
        <h3 className="text-xl font-medium text-gray-900">Settings</h3>
        <button
          type="button"
          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          onClick={close}
        >
          <BiX className="h-4 w-4 text-black" />
          <span className="sr-only">Close modal</span>
        </button>
      </div>
      <div className="p-4 flex flex-row items-center">
        <div className="flex flex-col">
          <div>Only Show Players</div>
          <div className="text-sm text-gray-500 max-w-lg">
            When enabled this option filters the list of damage dealers to known
            players. Disabling this will allow you to see damage done by
            sidereals and bugged players.
          </div>
        </div>
        <div className="ml-auto px-6">
          <input
            type="checkbox"
            value=""
            id="checkboxDefault"
            checked={opts.onlyShowPlayers}
            onChange={(e) => {
              setOpts((state) => ({
                ...state,
                onlyShowPlayers: e.target.checked,
              }));
            }}
          />
        </div>
      </div>
      <div className="p-4 flex flex-row items-center">
        <div className="flex flex-col">
          <div>Filter Targets</div>
          <div className="text-sm text-gray-500 max-w-lg">
            Filters all data to only consider damage dealt against boss-grade
            NPCs. Disabling this will allow you to see damage against all
            targets in the raid.
          </div>
        </div>
        <div className="ml-auto px-6">
          <input
            type="checkbox"
            value=""
            id="checkboxDefault"
            checked={opts.filterTargets}
            onChange={(e) => {
              setOpts((state) => ({
                ...state,
                filterTargets: e.target.checked,
              }));
            }}
          />
        </div>
      </div>
      <div className="p-4 flex flex-row items-center">
        <div className="flex flex-col">
          <div>Download</div>
          <div className="text-sm text-gray-500 max-w-lg">
            Download the raw LSB file for use with a third-party application.
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={download}
            className="items-center text-green-900 px-2 py-1 bg-green-300 hover:bg-green-200 border border-green-600 rounded-sm"
          >
            Download
          </button>
        </div>
      </div>
      {user && battle.owner_id === user.discord_id && (
        <>
          <div className="p-4 flex flex-row items-center border-t">
            <div className="flex flex-col">
              <div>Update Visibility</div>
              <div className="text-sm text-gray-500 max-w-lg">
                Change the visibility of this log.
              </div>
            </div>
            <div className="ml-auto">
              <VisibilitySelect
                selected={battle.visibility}
                onSelect={(v) => {
                  if (window.confirm("Change Visibility?")) {
                    fetch(`/api/battles/${battleStats.id}`, {
                      headers: getAuthHeaders(),
                      method: "PATCH",
                      body: JSON.stringify({
                        visibility: v,
                      }),
                    }).then(async (res) => {
                      if (!res.ok) {
                        console.error(
                          "Failed to update visibility: ",
                          await res.text()
                        );
                        return;
                      }

                      navigate(0);
                    });
                  }
                }}
              />
            </div>
          </div>
          <div className="p-4 flex flex-row items-center">
            <div className="flex flex-col">
              <div>Delete</div>
              <div className="text-sm text-gray-500 max-w-lg">
                Delete this log forever.
              </div>
            </div>
            <div className="ml-auto">
              <div
                onClick={() => {
                  if (window.confirm("Delete log?")) {
                    fetch(`/api/battles/${battleStats.id}`, {
                      headers: getAuthHeaders(),
                      method: "DELETE",
                    }).then(async (res) => {
                      if (!res.ok) {
                        console.error("Failed to delete: ", await res.text());
                        return;
                      }

                      navigate("/");
                    });
                  }
                }}
                className="items-center text-red-900 px-2 py-1 bg-red-300 hover:bg-red-200 border border-red-600 rounded-sm ml-auto cursor-pointer"
              >
                Delete
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
async function loadBattleData(id: string): Promise<[lsb.Battle, LandBattle]> {
  const loadData = async () => {
    const res = await fetch(`/api/battles/${id}/data`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to load battle data for ${id}: ${await res.text()}`
      );
    }
    return loadBattleFromResponse(res);
  };

  const loadLand = async () => {
    const res = await fetch(`/api/battles/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load battle for ${id}: ${await res.text()}`);
    }
    return (await res.json()) as LandBattle;
  };

  return await Promise.all([loadData(), loadLand()]);
}

type BattlePageState = {
  loading: boolean;
  landBattle?: LandBattle;
  battleStats?: BattleStats;
};

export default function BattlePage() {
  const user = useUserStore((state) => state.user);
  const [opts, setOpts] = useState<BattleOverviewOpts>({
    onlyShowPlayers: true,
    filterTargets: true,
  });
  const { battleId } = useParams();
  const [battleData, setPageState] = useState<BattlePageState>({
    loading: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!battleId) return;
    if (battleData.loading) return;

    setPageState({ loading: true });
    loadBattleData(battleId).then(([battle, landBattle]) =>
      setPageState({
        landBattle,
        loading: false,
        battleStats: new BattleStats(battleId, {
          battle,
        }),
      })
    );
  }, [battleId]);

  if (battleId === undefined) return <Navigate to="/" replace />;
  if (
    battleData.battleStats === undefined ||
    battleData.landBattle === undefined
  ) {
    return <></>;
  }
  return (
    <BattleOverview battleStats={battleData.battleStats}>
      <BattleOverviewOptsModal
        battle={battleData.landBattle}
        battleStats={battleData.battleStats}
        show={settingsOpen}
        close={() => setSettingsOpen(false)}
        opts={opts}
        setOpts={setOpts}
      />
      {/* {user && battleData.landBattle?.owner && (
        <button
          onClick={async () => {
            if (confirm("Delete Battle?")) {
              const res = await fetch(`/api/battles/${battleId}`, {
                method: "DELETE",
              });
              if (!res.ok) {
                console.error("Failed to delete battle: ", await res.text());
              }
            }
          }}
          className="px-1 py-2"
        >
          <BiTrash className="text-red-400 h-6 w-6" />
        </button>
      )}
      <button className="px-1 py-2" onClick={() => download()}>
        <BiDownload className="text-green-400 h-6 w-6" />
      </button> */}
      <div className="flex flex-row bg-gray-800 border border-gray-900 rounded-sm shadow-inner">
        <button className="px-1 py-2" onClick={() => setSettingsOpen(true)}>
          <BiCog className="text-blue-400 h-6 w-6" />
        </button>
      </div>
    </BattleOverview>
  );
}

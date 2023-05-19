import { Character } from "@shandi/lsb/lsb";
import { create } from "zustand";

export const SUPPORTED_LOST_ARK_VERSIONS = ["2.16.1.1"];

export type Status = {
  game_version: string | null;
  live_capture: {
    packets_processed: number;
  } | null;
  new_version: boolean;
  local_character: Character | null;
};

export const isStatusOk = (status: Status | null): boolean => {
  if (status === null) return false;
  if (status.game_version === null) return false;
  if (!SUPPORTED_LOST_ARK_VERSIONS.includes(status?.game_version || ""))
    return false;
  if (status.live_capture === null) return false;
  if (status.live_capture.packets_processed === 0) return false;
  if (status.new_version) return false;
  if (status.local_character === null) return false;
  return true;
};

export const useStatusStore = create<{
  status: Status | null;
  refresh: () => void;
}>((set, get) => {
  const refresh = async () => {
    const res = await fetch(`/api/status`);
    if (!res.ok) {
      console.error("[StatusStore] failed to fetch status: ", await res.text());
      return;
    }

    set({ status: await res.json() });
  };
  refresh();

  return {
    status: null,
    refresh,
  };
});

(window as any).statusStore = useStatusStore;

import { create } from "zustand";

export type Settings = {
  developer: boolean;
  run_in_background: boolean;
  first_time_setup: boolean;
  capture_interface_name: string | null;
  auto_save: {
    unknown_encounters: boolean;
  } | null;
  land: {
    url_override: string | null;
    upload_key: string | null;
    auto_upload: boolean;
    always_reupload: boolean;
  };
};

export const useSettingsStore = create<{
  settings: Settings | null;
  update: (settings: Settings) => void;
}>((set, get) => {
  (async () => {
    const res = await fetch(`/api/settings`);
    if (!res.ok) {
      console.error(
        "[SettingsStore] failed to load settings: ",
        await res.text()
      );
      return;
    }

    const data = await res.json();
    set({ settings: data });
  })();

  const update = async (settings: Settings) => {
    const res = await fetch(`/api/settings`, {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      throw new Error(`Failed to save settings: ${await res.text()}`);
    }
  };

  return {
    settings: null,
    update,
  };
});

(window as any).settingsStore = useSettingsStore;

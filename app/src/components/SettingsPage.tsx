import { Settings, useSettingsStore } from "../stores/SettingsStore";
import { useInterfaceStore } from "../stores/InterfaceStore";

function Land({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (v: Partial<Settings>) => void;
}) {
  return (
    <div className="flex flex-col bg-gray-800 p-2 border border-gray-900 gap-4 rounded-sm">
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl text-gray-200">Shandi Land</h1>
        </div>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="text-gray-300 text-lg">Upload Key</div>
          <div className="text-gray-400 text-sm">
            When set any uploaded logs will be associated with your account,
            allowing you to modify or delete them in the future.
          </div>
        </div>
        <div className="ml-auto">
          <input
            value={settings.land.upload_key || ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setSettings({ land: { ...settings.land, upload_key: null } });
              } else {
                setSettings({
                  land: { ...settings.land, upload_key: e.target.value },
                });
              }
              setSettings;
            }}
          />
        </div>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="text-gray-300 text-lg">Auto Upload</div>
          <div className="text-gray-400 text-sm">
            When enabled any logs that match the auto-save rules will be
            automatically uploaded.
          </div>
        </div>
        <div className="ml-auto">
          <label className="relative inline-flex items-center mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.land.auto_upload}
              onChange={(e) => {
                setSettings({
                  land: { ...settings.land, auto_upload: e.target.checked },
                });
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      {(settings.developer || settings.land.url_override) && (
        <div className="flex flex-row">
          <div className="flex flex-col">
            <div className="text-gray-300 text-lg">API URL Override</div>
            <div className="text-gray-400 text-sm">
              Configure an API URL override for development purposes.
            </div>
          </div>
          <div className="ml-auto">
            <input
              value={settings.land.url_override || ""}
              onChange={(e) => {
                if (e.target.value === "") {
                  setSettings({
                    land: { ...settings.land, url_override: null },
                  });
                } else {
                  setSettings({
                    land: { ...settings.land, url_override: e.target.value },
                  });
                }
              }}
            />
          </div>
        </div>
      )}
      {(settings.developer || settings.land.always_reupload) && (
        <div className="flex flex-row">
          <div className="flex flex-col">
            <div className="text-gray-300 text-lg">Always Reupload</div>
            <div className="text-gray-400 text-sm">
              When enabled this will ignore previously uploaded battles and
              always attempt to create a new upload (for development purposes).
            </div>
          </div>
          <div className="ml-auto">
            <label className="relative inline-flex items-center mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.land.always_reupload}
                onChange={(e) => {
                  setSettings({
                    land: {
                      ...settings.land,
                      always_reupload: e.target.checked,
                    },
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function AppSettings({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (v: Partial<Settings>) => void;
}) {
  return (
    <div className="flex flex-col bg-gray-800 p-2 gap-4 border border-gray-900 rounded-sm">
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl text-gray-200">App Settings</h1>
        </div>
      </div>
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <div className="text-gray-300 text-lg">Auto Save</div>
          <div className="text-gray-400 text-sm">
            Automatically save valid battles locally.
          </div>
        </div>
        <div className="ml-auto">
          <label className="relative inline-flex items-center mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_save !== null}
              onChange={(e) => {
                if (settings.auto_save === null) {
                  setSettings({ auto_save: { unknown_encounters: false } });
                } else {
                  setSettings({ auto_save: null });
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <div className="text-gray-300 text-lg">Run In Background</div>
          <div className="text-gray-400 text-sm">
            When enabled shandi will remain running in the background when
            closed. To quit or access the app right click the icon in the
            taskbar.
          </div>
        </div>
        <div className="ml-auto">
          <label className="relative inline-flex items-center mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.run_in_background}
              onChange={(e) => {
                if (e.target.checked) {
                  setSettings({ run_in_background: true });
                } else {
                  setSettings({ run_in_background: false });
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function InterfaceSelect({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (v: Partial<Settings>) => void;
}) {
  const interfaces = useInterfaceStore((state) => state.interfaces);
  const isWindows = navigator.userAgent.includes("Windows");

  if (interfaces === null) {
    return <></>;
  }

  return (
    <div className="bg-gray-800 border border-gray-900 p-2 flex flex-col rounded-sm">
      <div className="flex flex-row">
        <div className="flex flex-col">
          <h2 className="text-xl text-gray-200">Network Interface</h2>
          <div className="text-gray-400 text-sm">
            Select the network interface which handles the internet connection
            for your Lost Ark game instance.
          </div>
        </div>
        <div className="ml-auto">
          <select
            className="p-0.5 border-gray-500 border"
            value={settings.capture_interface_name || ""}
            onChange={(e) => {
              setSettings({
                capture_interface_name:
                  e.target.value === "" ? null : e.target.value,
              });
            }}
          >
            <option value="">Disabled</option>
            {interfaces.map((it) => (
              <option key={it.name} value={it.name}>
                {it.description} {!isWindows && `(${it.name})`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function DeveloperMode({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (v: Partial<Settings>) => void;
}) {
  return (
    <div className="flex flex-col bg-gray-800 p-2 border border-gray-900 rounded-sm">
      <div className="flex flex-row items-center">
        <div className="flex flex-col">
          <h2 className="text-xl text-gray-200">Developer Mode</h2>
          <div className="text-gray-400 text-sm">
            Enables various developer-specific features.
          </div>
        </div>
        <div className="ml-auto p-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.developer}
              onChange={(e) => {
                if (e.target.checked) {
                  setSettings({ developer: true });
                } else {
                  setSettings({ developer: false });
                }
              }}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, updateSettings] = useSettingsStore((state) => [
    state.settings,
    state.update,
  ]);

  const setSettings = (v: Partial<Settings>) => {
    if (!settings) return;
    updateSettings({ ...settings, ...v });
  };
  if (!settings) return <></>;

  return (
    <div className="flex flex-col gap-2 bg-gray-700 p-2 h-full">
      <AppSettings settings={settings} setSettings={setSettings} />
      <Land settings={settings} setSettings={setSettings} />
      <InterfaceSelect settings={settings} setSettings={setSettings} />
      <DeveloperMode settings={settings} setSettings={setSettings} />
    </div>
  );
}

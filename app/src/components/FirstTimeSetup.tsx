import classNames from "classnames";
import { useEffect, useState } from "react";
import { BiCheckCircle } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useInterfaceStore } from "../stores/InterfaceStore";
import { Settings, useSettingsStore } from "../stores/SettingsStore";
import { postWebViewMessage } from "../util/webview";

function DependencySetup() {
  const [setupDisabled, setSetupDisabled] = useState(false);
  const [interfaces, refresh] = useInterfaceStore((state) => [
    state.interfaces,
    state.refresh,
  ]);

  useEffect(() => {
    const id = setInterval(() => refresh(), 2000);
    return () => clearInterval(id);
  });

  return (
    <div className="bg-gray-300 border border-gray-500 p-2 flex flex-col">
      <div className="flex flex-col">
        <h2 className="text-xl text-gray-800">Npcap Required</h2>
        <div className="text-gray-600">
          Npcap is required for the program to function. Press the following
          button to download and begin installing npcap.
        </div>
      </div>
      <div className="ml-auto">
        {interfaces !== null && (
          <BiCheckCircle className="h-8 w-8 text-green-500" />
        )}
        {interfaces === null && (
          <button
            className={classNames("border border-green-500 p-2", {
              "text-green-400 bg-green-100": setupDisabled,
              "bg-green-200": "bg-green-200",
            })}
            disabled={setupDisabled}
            onClick={async () => {
              setSetupDisabled(true);
              await fetch(`/api/setup-npcap`, { method: "POST" });
              setSetupDisabled(false);
            }}
          >
            Install Npcap
          </button>
        )}
      </div>
    </div>
  );
}

function InterfaceSelect({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (v: Settings) => void;
}) {
  const interfaces = useInterfaceStore((state) => state.interfaces);

  useEffect(() => {
    if (interfaces === null || interfaces.length === 0) return;
    if (settings.capture_interface_name !== null) return;

    setSettings({ ...settings, capture_interface_name: interfaces[0].name });
  }, [interfaces, settings]);

  if (interfaces === null) {
    return <></>;
  }

  return (
    <div className="bg-gray-300 border border-gray-500 p-2 flex flex-col gap-2">
      <div className="flex flex-row">
        <h2 className="text-xl text-gray-800">Network Interface</h2>
      </div>
      <div className="ml-auto">
        <select
          className="p-0.5 border-gray-500 border"
          onChange={(e) => {
            setSettings({
              ...settings,
              capture_interface_name: e.target.value,
            });
          }}
        >
          {interfaces.map((it) => (
            <option
              selected={it.name === settings.capture_interface_name}
              value={it.name}
            >
              {it.description} ({it.name})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function FirstTimeSetup() {
  const [settings, setSettings] = useState<Settings>({
    developer: false,
    run_in_background: true,
    first_time_setup: true,
    capture_interface_name: null,
    auto_save: { unknown_encounters: false },
    land: {
      url_override: null,
      upload_key: null,
      auto_upload: false,
      always_reupload: false,
    },
  });
  const navigate = useNavigate();
  const update = useSettingsStore((state) => state.update);

  return (
    <div className="m-4 bg-gray-100 border border-gray-600 p-2 gap-2 flex flex-col">
      <div>
        <h1 className="text-gray-900 text-2xl">First Time Setup</h1>
      </div>
      <DependencySetup />
      <InterfaceSelect settings={settings} setSettings={setSettings} />
      <div className="mt-auto ml-auto flex flex-row gap-2">
        <button
          onClick={() => {
            postWebViewMessage({
              e: "close",
            });
          }}
          className="bg-red-200 border-red-400 border text-red-800 p-2"
        >
          Quit
        </button>
        <button
          onClick={() => {
            update(settings);
            navigate("/");
          }}
          className="bg-green-200 border-green-400 border text-green-800 p-2"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}

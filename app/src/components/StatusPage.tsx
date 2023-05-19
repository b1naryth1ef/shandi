import { useState } from "react";
import { BiError, BiInfoCircle } from "react-icons/bi";
import {
  SUPPORTED_LOST_ARK_VERSIONS,
  useStatusStore,
} from "../stores/StatusStore";
import { openInExternalBrowser } from "../util/webview";

function ErrorPanel({
  title,
  children,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-2 text-red-800 border border-red-300 rounded-lg bg-red-50">
      <div className="flex items-center">
        <BiError className="w-5 h-5 mr-2" />
        <h3 className="text-2xl font-medium">{title}</h3>
      </div>
      <div className="text-md">{children}</div>
    </div>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-2 text-blue-800 border border-blue-300 rounded-lg bg-blue-50">
      <div className="flex items-center">
        <BiInfoCircle className="w-5 h-5 mr-2" />
        <h3 className="text-2xl font-medium">{title}</h3>
      </div>
      <div className="text-md">{children}</div>
    </div>
  );
}

function UpdateButton() {
  const [status, setStatus] = useState<
    null | "pending" | "pending-restart" | { error: any }
  >(null);

  return (
    <>
      {status !== null && typeof status !== "string" && (
        <div className="text-red-500 font-mono p-0.5 bg-red-100 border border-red-500">
          {status.error}
        </div>
      )}
      <button
        disabled={status === "pending"}
        onClick={async () => {
          if (status === "pending-restart") {
            await fetch(`/api/restart`, { method: "POST" });
            return;
          }

          setStatus("pending");
          const res = await fetch(`/api/update`, {
            method: "POST",
          });
          if (!res.ok) {
            const errText = await res.text();
            setStatus({ error: errText });
            return;
          }

          setStatus("pending-restart");
        }}
        className="px-1 py-0.5 font-mono border border-green-500 bg-green-50 rounded-sm hover:bg-green-100 text-green-900"
      >
        {status !== "pending-restart" && "Download Update"}
        {status === "pending-restart" && "Restart & Apply Update"}
      </button>
    </>
  );
}

export default function StatusPage() {
  const status = useStatusStore((state) => state.status);
  if (!status) return <></>;

  return (
    <div className="flex flex-col p-2 bg-gray-300 gap-2">
      {status.new_version && (
        <InfoPanel title={"Update Available"}>
          <div className="flex flex-row">
            <div>A new update is available.</div>
            <div className="ml-auto">
              <UpdateButton />
            </div>
          </div>
        </InfoPanel>
      )}
      <InfoPanel title={"HTTP Server"}>
        <div className="flex flex-row">
          <div>
            Running at{" "}
            <button
              onClick={() => {
                openInExternalBrowser(`http://${window.location.host}/`);
              }}
              className="p-0.5 font-mono"
            >
              http://{window.location.host}/
            </button>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => {
                openInExternalBrowser(`http://${window.location.host}/`);
              }}
              className="px-1 py-0.5 border border-blue-500 bg-blue-50 hover:bg-blue-100 rounded-sm"
            >
              Open In Browser
            </button>
          </div>
        </div>
      </InfoPanel>
      {status.game_version === null && (
        <ErrorPanel title={"No running Lost Ark Process"}>
          Shandi failed to detect a running Lost Ark process.
        </ErrorPanel>
      )}
      {status.game_version &&
        !SUPPORTED_LOST_ARK_VERSIONS.includes(status.game_version) && (
        <ErrorPanel title={"Unsupported Game Version"}>
          Game version '{status.game_version}' was detected, but is not
          supported.
        </ErrorPanel>
      )}
      {!status.live_capture && (
        <ErrorPanel title={"No Network Capture"}>
          No network capture is running. Make sure the network interface you
          selected is correct.
        </ErrorPanel>
      )}
      {status.live_capture && status.live_capture.packets_processed === 0 && (
        <ErrorPanel title={"No Packets Processed"}>
          No packets have been processed yet. Double check the network interface
          you selected.
        </ErrorPanel>
      )}
      {status.local_character === null && (
        <ErrorPanel title={"No Local Character"}>
          If you started the program before entering a raid in Lost Ark data
          will not be accurate until the next raid/instance you enter.
        </ErrorPanel>
      )}
    </div>
  );
}

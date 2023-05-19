import Modal from "@shandi/shared/src/Modal";
import { BiTrash } from "react-icons/bi";
import { getAuthHeaders, useUserStore } from "./stores/UserStore";
import { useEffect, useState } from "react";
import classNames from "classnames";

function UploadKeyItem({
  uploadKey,
  highlighted,
}: {
  uploadKey: string;
  highlighted?: boolean;
}) {
  const refresh = useUserStore((state) => state.refresh);

  return (
    <div className="flex flex-row">
      <pre
        className={classNames("p-1 border-l border-y select-all", {
          "border-gray-500 bg-green-100": highlighted,
          "border-gray-500 bg-gray-200": !highlighted,
        })}
      >
        {uploadKey}
      </pre>
      <div
        onClick={async () => {
          if (!window.confirm("Delete upload key?")) {
            return;
          }

          const res = await fetch(`/api/upload-keys/${uploadKey}`, {
            headers: getAuthHeaders(),
            method: "DELETE",
          });
          if (!res.ok) {
            console.error("failed to delete upload key", await res.text());
            return;
          }

          await refresh();
        }}
        className="items-center p-2 bg-red-300 hover:bg-red-200 border border-red-600 rounded-sm-r ml-auto cursor-pointer"
      >
        <BiTrash className="text-gray-900" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [createState, setCreateState] = useState<
    null | "loading" | { error: any } | { key: string }
  >(null);

  const [user, refresh] = useUserStore((state) => [state.user, state.refresh]);

  useEffect(() => {
    if (
      createState &&
      typeof createState === "object" &&
      "key" in createState
    ) {
      return;
    }

    refresh();
  }, [createState]);

  const createUploadKey = async () => {
    setCreateState("loading");
    const res = await fetch(`/api/upload-keys`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      setCreateState({ error: text });
      throw new Error(`Failed to create new upload key: ${text}`);
    }
    setCreateState({ key: await res.json() });
  };

  if (user === null) return <></>;

  return (
    <div className="bg-gray-50 p-2 border-gray-600 border flex flex-row">
      <div className="flex flex-col mb-2">
        <h1 className="font-bold">Upload Keys</h1>
        <div className="text-xs text-gray-600">
          Upload keys are used by the shandi app (or other third-party apps) to
          securely automatically upload logs.
        </div>
        <div className="mt-4 gap-2">
          <button
            onClick={createUploadKey}
            disabled={createState === "loading"}
            className="px-2 py-1 text-green-700 hover:bg-green-100 bg-green-200 border-green-700 hover:border-green-800 border rounded-sm"
          >
            Create New Key
          </button>
        </div>
      </div>
      <div className="flex flex-row ml-auto gap-2 mt-2">
        <div className="flex flex-col gap-2">
          {user &&
            user.upload_keys.map((it) => (
              <UploadKeyItem
                key={it.key}
                uploadKey={it.key}
                highlighted={(createState &&
                  typeof createState === "object" &&
                  "key" in createState &&
                  createState.key === it.key) ||
                  false}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

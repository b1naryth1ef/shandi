import FileUpload from "@shandi/shared/src/FileUpload";
import { useEffect } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useSettingsStore } from "../stores/SettingsStore";
import AppTopBar from "./AppTopBar";
import StaggerLog from "./developer/StaggerLog";
import FirstTimeSetup from "./FirstTimeSetup";
import LiveBattlePage from "./LiveBattlePage";
import SavedBattlesPage from "./SavedBattlesPage";
import SettingsPage from "./SettingsPage";
import StatusPage from "./StatusPage";

function Developer() {
  return (
    <Routes>
      <Route
        path="upload"
        element={
          <FileUpload
            onUploadFile={async (file) => {
              const res = await fetch(`/api/developer/import`, {
                method: "POST",
                body: file,
              });
              if (!res.ok) {
                console.error("Failed to import file: ", await res.text());
                return;
              }
            }}
          />
        }
      />
      <Route path="stagger/*" element={<StaggerLog />} />
    </Routes>
  );
}

function Content() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    if (!settings) return;
    if (settings && !settings.first_time_setup) navigate("/first-time-setup");
  }, [settings]);

  return (
    <>
      <AppTopBar />
      <div className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </div>
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Content />}>
      <Route index element={<LiveBattlePage />} />
      <Route path="saved/*" element={<SavedBattlesPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="status" element={<StatusPage />} />
      <Route path="developer/*" element={<Developer />} />
      <Route path="first-time-setup" element={<FirstTimeSetup />} />
    </Route>
  )
);

function MainRouter() {
  return <RouterProvider router={router} />;
}

export default function Window() {
  return (
    <div className="h-screen flex flex-col dark bg-gray-600">
      <MainRouter />
    </div>
  );
}

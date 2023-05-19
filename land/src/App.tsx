import { TabItem, Tabs, TopBar } from "@shandi/shared/src/TopBar";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Link,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom";
import { BiCog, BiLogIn, BiLogOut } from "react-icons/bi";
import { useUserStore } from "./stores/UserStore";
import UploadPage from "./UploadPage";
import BattleList from "./components/BattleList";
import BattlePage from "./BattlePage";
import SettingsPage from "./SettingsPage";

function Content() {
  const [token, user, logout] = useUserStore((state) => [
    state.token,
    state.user,
    state.logout,
  ]);

  return (
    <div className="h-screen dark bg-gray-600">
      <TopBar>
        <Tabs>
          <TabItem to="/">Home</TabItem>
          <TabItem to="/upload">Upload</TabItem>
        </Tabs>
        <div className="ml-auto"></div>
        <div className="flex flex-row gap-2">
          {token === null && (
            <a
              href="/api/login"
              className="px-2 py-1 flex flex-row items-center text-blue-100 bg-blue-600 hover:bg-blue-500 rounded-sm border-blue-500"
            >
              Login
              <BiLogIn className="ml-2 h-5 w-5 text-blue-100" />
            </a>
          )}
          {user !== null && (
            <>
              <Link
                to="/settings"
                className="px-2 py-1 flex flex-row items-center text-blue-100 bg-blue-600 hover:bg-blue-500 rounded-sm border-blue-500"
              >
                Settings
                <BiCog className="ml-2 h-5 w-5 text-blue-100" />
              </Link>

              <button
                onClick={logout}
                className="px-2 py-1 flex flex-row items-center text-red-100 bg-red-600 hover:bg-red-500 rounded-sm border-red-500"
              >
                Logout
                <BiLogOut className="ml-2 h-5 w-5 text-red-100" />
              </button>
            </>
          )}
        </div>
      </TopBar>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Content />}>
      <Route index element={<BattleList />} />
      <Route path="battles/:battleId/*" element={<BattlePage />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}

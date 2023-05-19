import {
  BiBible,
  BiChart,
  BiErrorCircle,
  BiMinus,
  BiPauseCircle,
  BiPlayCircle,
  BiReset,
  BiX,
} from "react-icons/bi";
import classNames from "classnames";
import { isStatusOk, useStatusStore } from "../stores/StatusStore";
import { Link, NavLink, useLocation, useMatch } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveBattleStore } from "../stores/LiveBattleStore";
import { isWebView, postWebViewMessage } from "../util/webview";
import { useSettingsStore } from "../stores/SettingsStore";

import { TabItem, Tabs, TopBar } from "@shandi/shared/src/TopBar";

function AppTabs() {
  return (
    <Tabs>
      <TabItem to="/">Live</TabItem>
      <TabItem to="/saved">Saved</TabItem>
      <TabItem to="/settings">Settings</TabItem>
    </Tabs>
  );
}

function BibleDropdown({
  show,
  setShow,
}: {
  show?: boolean;
  setShow: (v: boolean) => void;
}) {
  const location = useLocation();
  const match = useMatch("/saved/:id/*");

  useEffect(() => {
    setShow(false);
  }, [location]);

  const ref: any = useRef(null);
  const buttonRef: any = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        ref.current &&
        !ref.current.contains(event.target) &&
        (!buttonRef.current || !buttonRef.current.contains(event.target))
      ) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, buttonRef, setShow]);

  return (
    <>
      <button
        onClick={(e) => {
          setShow(!show);
        }}
        ref={buttonRef}
      >
        <BiBible className="h-6 w-6 text-purple-500" />
      </button>
      <div
        ref={ref}
        className={classNames(
          "absolute z-10 divide-y divide-gray-100 rounded-sm border border-gray-950 w-44 bg-gray-800 mt-10 mr-2 right-0 top-0",
          {
            hidden: !show,
          }
        )}
      >
        <ul className="text-sm text-gray-700 dark:text-gray-200">
          <li>
            <Link
              to="/developer/upload"
              className="block px-4 py-2 hover:bg-gray-700 hover:text-white"
            >
              Upload
            </Link>
          </li>
          <li>
            <Link
              to={
                match
                  ? `/developer/stagger/${match.params.id}`
                  : `/developer/stagger`
              }
              className="block px-4 py-2 hover:bg-gray-700 hover:text-white"
            >
              Stagger
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}

export default function AppTopBar() {
  const status = useStatusStore((state) => state.status);
  const isOk = useMemo(() => isStatusOk(status), [status]);
  const [setPaused, rotate, isPaused] = useLiveBattleStore((state) => [
    state.setPaused,
    state.rotate,
    state.pauseQueue !== null,
  ]);
  const settings = useSettingsStore((state) => state.settings);
  const [showBible, setShowBible] = useState(false);

  return (
    <TopBar>
      {settings?.first_time_setup && <AppTabs />}
      <div className="ml-auto"></div>
      <div className="flex flex-row p-1 bg-gray-950 border border-gray-800 rounded-sm no-drag">
        {settings?.first_time_setup && (
          <>
            {settings?.developer && (
              <BibleDropdown show={showBible} setShow={setShowBible} />
            )}
            <button onClick={rotate} className="px-0.5">
              <BiReset className="h-6 w-6 text-blue-500" />
            </button>
            <button onClick={() => setPaused(!isPaused)} className="px-0.5">
              {!isPaused && (
                <BiPauseCircle className="h-6 w-6 text-yellow-500" />
              )}
              {isPaused && <BiPlayCircle className="h-6 w-6 text-green-500" />}
            </button>
            <NavLink to="/status" className="pl-0.5">
              {!isOk && <BiErrorCircle className="h-6 w-6 text-red-500" />}
              {isOk && <BiChart className="h-6 w-6 text-green-500" />}
            </NavLink>
          </>
        )}
        {isWebView() && (
          <>
            <button
              className={classNames("border-gray-800", {
                "pl-2 border-l": settings?.first_time_setup,
              })}
              onClick={() =>
                postWebViewMessage({
                  e: "minimize",
                })
              }
            >
              <BiMinus className="h-6 w-6 text-blue-500 hover:text-blue-300" />
            </button>
            <button
              onClick={() =>
                postWebViewMessage({
                  e: "close",
                })
              }
            >
              <BiX className="h-6 w-6 text-red-500 hover:text-red-300" />
            </button>
          </>
        )}
      </div>
    </TopBar>
  );
}

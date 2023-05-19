import classNames from "classnames";
import { NavLink } from "react-router-dom";
import { getAppIcon } from "@shandi/data/assets";

export function TabItem(
  { children, to }: { to: string; children?: React.ReactNode },
) {
  return (
    <li className="mr-2">
      <NavLink
        to={to}
        className={({ isActive }) =>
          classNames(
            "inline-flex px-4 py-2 text-xl rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group",
            {
              "text-blue-300 border-blue-600 active border-b-2": isActive,
            },
            {
              "border-transparent": !isActive,
            },
          )}
      >
        {children}
      </NavLink>
    </li>
  );
}

export function Tabs({ children }: { children?: React.ReactNode }) {
  return (
    <div className="no-drag">
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
        {children}
      </ul>
    </div>
  );
}

export function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-gray-900 flex flex-row items-center border-b border-gray-950 px-2 drag">
      <img
        src={getAppIcon()}
        className="h-8 w-8 border border-gray-800 rounded-full ml-1 mr-2 my-2"
      />
      {children}
    </div>
  );
}

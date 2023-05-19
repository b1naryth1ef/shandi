import classNames from "classnames";
import { useState } from "react";
import { BiDownArrow } from "react-icons/bi";

function DownArrowIcon() {
  return <BiDownArrow className="ml-auto w-4 h-4 ml-2" />;
}

export function DropdownItem({
  children,
  onClick,
  className,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <li
      onClick={onClick}
      className={classNames(
        "cursor-pointer block px-4 py-2 hover:bg-gray-600",
        className,
      )}
    >
      {children}
    </li>
  );
}

export type DropdownChild = {
  name: string;
  onClick: () => void;
};

export default function Dropdown({
  value,
  children,
}: {
  value?: React.ReactNode;
  children?: Array<DropdownChild>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        id="dropdownDefaultButton"
        className="text-white w-40 bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-sm text-sm px-4 py-2.5 text-center inline-flex items-center"
        type="button"
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        {value} <DownArrowIcon />
      </button>
      <div
        id="dropdown"
        className={classNames(
          "divide-y divide-gray-100 rounded-sm shadow w-44 bg-gray-700 absolute top-11 left-0 inline-block z-50 border-gray-800 border",
          {
            invisible: !expanded,
          },
        )}
      >
        <ul className="py-2 text-sm text-gray-200">
          {children?.map((it, idx) => (
            <DropdownItem
              key={idx}
              onClick={() => {
                setExpanded(false);
                it.onClick();
              }}
            >
              {it.name}
            </DropdownItem>
          ))}
        </ul>
      </div>
    </div>
  );
}

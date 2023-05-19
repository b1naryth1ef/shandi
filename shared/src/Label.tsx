import classNames from "classnames";

export default function Label({
  children,
  icon,
  className,
}: {
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        "px-1 py-0.5 border font-mono text-xs text-center flex flex-row items-center gap-1 border-gray-800 bg-gray-300 text-black",
        className
      )}
    >
      {icon}
      <span className="border-l border-black pl-1">{children}</span>
    </span>
  );
}

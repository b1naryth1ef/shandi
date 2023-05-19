import classNames from "classnames";

export default function Modal({
  show,
  children,
  className,
}: {
  show?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      id="defaultModal"
      className={classNames(
        "fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] md:h-full",
        className,
        { hidden: !show }
      )}
    >
      <div className="relative w-full h-full max-w-2xl md:h-auto mx-auto">
        <div className="relative bg-white rounded-sm shadow">{children}</div>
      </div>
    </div>
  );
}

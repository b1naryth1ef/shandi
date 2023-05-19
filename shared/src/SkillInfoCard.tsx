import { getSkillFeature, getSkillInfo } from "@shandi/data/data";
import { SkillInfo } from "@shandi/lsb/lsb";
import classNames from "classnames";
import { sanitizeDescription } from "./util/format";

function TripodIndexPanel({ details }: { details: SkillInfo }) {
  return (
    <div className="flex flex-row gap-2 font-mono">
      {details.tripodIndex1 > 0 && (
        <div className="border p-1 w-6 h-6 text-black rounded-full shadow-inner flex justify-center items-center bg-blue-300 border-blue-500">
          {details.tripodIndex1}
        </div>
      )}
      {details.tripodIndex2 > 0 && (
        <div className="border p-1 w-6 h-6 text-black rounded-full shadow-inner flex justify-center items-center bg-green-300 border-green-500">
          {details.tripodIndex2}
        </div>
      )}
      {details.tripodIndex3 > 0 && (
        <div className="border p-1 w-6 h-6 text-black rounded-full shadow-inner flex justify-center items-center bg-orange-300 border-orange-500">
          {details.tripodIndex3}
        </div>
      )}
    </div>
  );
}

export default function SkillInfoCard({
  show,
  skillId,
  details,
}: {
  show?: boolean;
  skillId: number;
  details?: SkillInfo;
}) {
  const skillInfo = getSkillInfo(skillId);
  if (!skillInfo) return <></>;

  const skillFeature = getSkillFeature(skillId);

  return (
    <div
      data-popover
      role="tooltip"
      className={classNames(
        "p-2 ml-10 absolute z-10 max-w-sm break-all text-sm text-gray-200 transition-opacity duration-300 bg-gray-500 border border-gray-700 rounded-sm shadow-sm font-normal flex flex-col gap-2 whitespace-normal",
        { "invisible opacity-0": !show }
      )}
    >
      <div className="flex flex-row items-center gap-6">
        <div className="text-xl font-medium">{skillInfo.name}</div>
        <div className="ml-auto">
          {details && <TripodIndexPanel details={details} />}
        </div>
      </div>
      <p className="relative max-w-sm break-normal">
        {sanitizeDescription(skillInfo.desc)}
      </p>
      {details && skillFeature && (
        <div className="flex flex-col gap-2">
          {details.tripodIndex1 > 0 && (
            <div className="flex flex-row gap-2 items-center text-center text-sm text-gray-800 border border-blue-700 bg-blue-100 p-2">
              <div>
                {skillFeature.tripods[details.tripodIndex1.toString()].name}
              </div>
              {details.tripodLevel1 > 0 && (
                <div className="ml-auto">Level {details.tripodLevel1}</div>
              )}
            </div>
          )}
          {details.tripodIndex2 > 0 && (
            <div className="flex flex-row gap-2 items-center text-sm text-gray-800 border border-green-700 bg-green-100 p-2">
              <div>
                {
                  skillFeature.tripods[(3 + details.tripodIndex2).toString()]
                    .name
                }
              </div>
              {details.tripodLevel2 > 0 && (
                <div className="ml-auto">Level {details.tripodLevel2}</div>
              )}
            </div>
          )}
          {details.tripodIndex3 > 0 && (
            <div className="flex flex-row gap-2 items-center text-sm text-gray-800 border border-orange-700 bg-orange-100 p-2">
              <div>
                {
                  skillFeature.tripods[(6 + details.tripodIndex3).toString()]
                    .name
                }
              </div>
              {details.tripodLevel3 > 0 && (
                <div className="ml-auto">Level {details.tripodLevel3}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

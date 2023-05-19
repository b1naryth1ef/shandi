import { useEffect, useRef, useState } from "react";
import { BattleStats } from "./util/stats";
import DamageGraph from "./graphs/DamageGraph";
import DPSGraph from "./graphs/DPSGraph";
import StaggerGraph from "./graphs/StaggerGraph";
import Dropdown from "./Dropdown";

export default function BattleGraphs({
  battleStats,
}: {
  battleStats: BattleStats;
}) {
  const [graph, setGraph] = useState<"damage" | "dps" | "stagger">("dps");
  const optionsRef = useRef<HTMLDivElement | null>(null);

  // react is so well made :)
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    setElement(optionsRef.current);
  }, []);

  return (
    <div className="flex flex-col bg-gray-700 h-full">
      <div className="flex flex-row bg-gray-800 p-2 rounded-t-sm border-b border-gray-950 gap-6 items-center">
        <Dropdown
          value={
            {
              damage: "Total Damage",
              dps: "DPS",
              stagger: "Stagger",
            }[graph]
          }
          children={[
            { name: "DPS", onClick: () => setGraph("dps") },
            { name: "Total Damage", onClick: () => setGraph("damage") },
            { name: "Stagger", onClick: () => setGraph("stagger") },
          ]}
        />
        <div className="flex items-center">
          <div ref={optionsRef} />
        </div>
      </div>
      {graph === "damage" && (
        <DamageGraph element={element} battleStats={battleStats} />
      )}
      {graph === "dps" && (
        <DPSGraph element={element} battleStats={battleStats} />
      )}
      {graph === "stagger" && <StaggerGraph battleStats={battleStats} />}
    </div>
  );
}

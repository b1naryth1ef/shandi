import { Route, Routes, useParams } from "react-router-dom";
import { BattleStats } from "./util/stats";
import PlayerSkillsTable from "./PlayerSkillsTable";
import PlayerCastedBuffsTable from "./PlayerCastedBuffsTable";

export default function PlayerOverview({
  battleStats,
}: {
  battleStats: BattleStats;
}) {
  const { playerId } = useParams();
  if (!playerId) return <></>;

  const playerStats = battleStats.playerStats.get(playerId);
  const player = battleStats.battle.players[playerId];
  if (!playerStats || !player) return <></>;

  return (
    <Routes>
      <Route index element={<PlayerSkillsTable playerStats={playerStats} />} />
      <Route
        path="/casted-buffs"
        element={
          <PlayerCastedBuffsTable
            playerId={playerId}
            playerStats={playerStats}
            battleStats={battleStats}
          />
        }
      />
    </Routes>
  );
}

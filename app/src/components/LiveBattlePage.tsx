import PlayerDamageTable from "@shandi/shared/src/PlayerDamageTable";
import { useLiveBattleStore } from "../stores/LiveBattleStore";

export default function LiveBattlePage() {
  const stats = useLiveBattleStore((state) => state.battleStats);
  return <PlayerDamageTable battleStats={stats} />;
}

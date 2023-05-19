import { loadBattleFromResponse } from "@shandi/shared/src/util/battle";
import { BattleStats } from "@shandi/shared/src/util/stats";
import Immutable from "immutable";
import { useEffect } from "react";
import { create } from "zustand";
import { SavedBattle } from "../components/SavedBattlesPage";


export type SavedBattleWithStats = SavedBattle & {
	stats: BattleStats;
}

export type SavedBattleStore = {
	battles: Immutable.Map<string, SavedBattleWithStats | null>;
	loadBattle: (id: string) => void;
}

export const useSavedBattle = (id?: string) => {
	const [savedBattle, loadBattle] = useSavedBattleStore((state) => [
		id ? state.battles.get(id) : null,
		state.loadBattle,
	]);

	useEffect(() => {
		if (!id) return;

		const { battles } = useSavedBattleStore.getState();
		if (!battles.has(id)) {
			loadBattle(id);
		}
	}, [id])

	return savedBattle || null;
}

export const useSavedBattleStore = create<SavedBattleStore>((set, get) => {
	const loadSavedBattle = async (id: string) => {
		const res = await fetch(`/api/battles/${id}`);
		if (!res.ok) {
			throw new Error(`Failed to load saved battle (${id}): ${await res.text()}`)
		}

		return await res.json();
	}

	const loadSavedBattleStats = async (id: string) => {
		const res = await fetch(`/api/battles/${id}/data`);
		if (!res.ok) {
			throw new Error(`Failed to load saved battle data (${id}): ${await res.text()}`)
		}

		return new BattleStats(id, {
			battle: await loadBattleFromResponse(res),
		});

	}

	const loadBattle = async (id: string) => {
		set((state) => ({
			...state,
			battles: state.battles.set(id, null),
		}));

		const [savedBattle, battleStats] = await Promise.all([
			loadSavedBattle(id),
			loadSavedBattleStats(id),
		]);

		set((state) => ({
			...state,
			battles: state.battles.set(id, { ...savedBattle, stats: battleStats })
		}));
	}

	return { battles: Immutable.Map(), loadBattle };
})
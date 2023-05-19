import { create } from "zustand";

export type Interface = {
	name: string;
	description: string;
	ips: Array<string>;
}

export const useInterfaceStore = create<{ interfaces: Array<Interface> | null; refresh: () => void }>((set, get) => {
	const refresh = (async () => {
		const res = await fetch(`/api/interfaces`);
		if (!res.ok) {
			console.error("[InterfaceStore] failed to fetch list of interfaces: ", await res.text());
			return;
		}

		return set({ interfaces: await res.json() });
	});
	refresh();
	return { interfaces: null, refresh }
})
import { create } from "zustand";

export type User = {
  discord_id: string;
  username: string;
  discriminator: number;
  avatar: string;
  role: number;
  upload_keys: Array<{ key: string }>;
};

export const useUserStore = create<{
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  refresh: () => Promise<void>;
  logout: () => void;
}>((set, get) => ({
  token: localStorage.getItem("_t"),
  user: null,
  logout: () => {
    set({ user: null, token: null });
  },
  setToken: async (token: string | null) => {
    if (token === null) {
      set({ user: null });
      localStorage.removeItem("_t");
    } else {
      const res = await fetch(`/api/user`, {
        headers: { Authorization: `User ${token}` },
      });

      if (res.status !== 200) {
        console.error(
          `Failed to fetch userinfo despite having saved token: ${await res.text()}`
        );
        localStorage.removeItem("_t");
        set({ user: null, token: null });
        return;
      }

      set({ user: await res.json(), token: token });
      localStorage.setItem("_t", token);
    }
  },
  refresh: async () => {
    const { token } = get();
    if (token !== null) {
      const res = await fetch(`/api/user`, {
        headers: { Authorization: `User ${token}` },
      });

      if (res.status !== 200) {
        console.error(
          `Failed to refresh user info, assuming token is invalid: ${await res.text()}`
        );
        localStorage.removeItem("_t");
        set({ user: null, token: null });
        return;
      }

      set({ user: await res.json() });
    }
  },
}));

export function initialize() {
  useUserStore.getState().refresh();
}

export function getAuthHeaders(): Record<string, string> {
  const token = useUserStore.getState().token;
  if (token !== null) {
    return {
      Authorization: `User ${token}`,
    };
  }
  return {};
}

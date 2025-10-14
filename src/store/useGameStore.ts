import { create } from "zustand";
import { getLevels, getLevel, createLevel } from "@/apis";

import type { Level, LevelData } from "@/types";

type GameState = {
    levels: Level[];
    loading: boolean;
    error: string | null;
};

type GameActions = {
    fetchLevels: () => Promise<void>;
    fetchLevel: (levelId: string) => Promise<Level>;
    addLevel: (payload: LevelData) => Promise<Level>;
    clearError: () => void;
    reset: () => void;
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
    levels: [],
    loading: false,
    error: null,

    clearError: () => set({ error: null }),

    reset: () => set({ levels: [], loading: false, error: null }),

    fetchLevels: async () => {
        set({ loading: true, error: null });
        try {
            const levels = await getLevels();
            set({ levels, loading: false });
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to fetch levels" });
            throw err;
        }
    },

    fetchLevel: async (levelId: string) => {
        set({ loading: true, error: null });
        try {
            const level = await getLevel(levelId);
            return level;
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to fetch level" });
            throw err;
        }
    },
    
    addLevel: async (payload: LevelData) => {
        set({ loading: true, error: null });
        try {
            const level = await createLevel(payload);
            // prepend newest
            set({ levels: [level, ...get().levels], loading: false });
            return level;
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to create level" });
            throw err;
        }
    },

}));

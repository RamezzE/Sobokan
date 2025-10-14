import { create } from "zustand";
import {
    getLevels,
    createLevel,
    getLevel,
    completeLevel,      // <-- add
    getUsers,           // <-- add
} from "@/apis";

import type { Level, LevelData, User, CompleteLevelResponse } from "@/types";

type GameState = {
    levels: Level[];
    users: User[];           // <-- add
    loading: boolean;
    error: string | null;
};

type GameActions = {
    fetchLevels: () => Promise<void>;
    addLevel: (payload: LevelData) => Promise<Level>;
    fetchLevel: (levelId: string) => Promise<Level>;
    fetchUsers: () => Promise<void>;                      // <-- add
    completeLevel: (levelId: string) => Promise<CompleteLevelResponse>; // <-- add
    clearError: () => void;
    reset: () => void;
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
    levels: [],
    users: [],                 // <-- add
    loading: false,
    error: null,

    clearError: () => set({ error: null }),

    reset: () => set({ levels: [], users: [], loading: false, error: null }), // <-- add users

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

    addLevel: async (payload: LevelData) => {
        set({ loading: true, error: null });
        try {
            const level = await createLevel(payload);
            set({ levels: [level, ...get().levels], loading: false });
            return level;
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to create level" });
            throw err;
        }
    },

    fetchLevel: async (levelId: string) => {
        set({ loading: true, error: null });
        try {
            const lvl = await getLevel(levelId);
            const others = get().levels.filter((l) => l.id !== lvl.id);
            set({ levels: [lvl, ...others], loading: false });
            return lvl;
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to fetch level" });
            throw err;
        }
    },

    // NEW: get all users
    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const users = await getUsers();
            set({ users, loading: false });
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to fetch users" });
            throw err;
        }
    },

    // NEW: complete a level (adds its score to the authenticated user server-side)
    completeLevel: async (levelId: string) => {
        set({ loading: true, error: null });
        try {
            const res = await completeLevel(levelId);
            // If the completed user is in our users list, update their score locally
            set((state) => ({
                users: state.users.map((u) => (u.id === res.user.id ? res.user : u)),
                loading: false,
            }));
            return res;
        } catch (err: any) {
            set({ loading: false, error: err?.message ?? "Failed to complete level" });
            throw err;
        }
    },
}));

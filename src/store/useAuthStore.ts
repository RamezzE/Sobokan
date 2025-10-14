import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
    loginApi,
    signupApi,
    logoutApi,
    setAuthToken,
} from "@/apis";

import type { AuthUser, AuthResponse } from "@/types";

type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;

    loading: boolean;
    error: string | null;
};

type AuthActions = {
    login: (input: { username: string; password: string }) => Promise<void>;
    signup: (input: { username: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;

    clearError: () => void;
    setUser: (user: AuthUser | null) => void;
    setToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            // ----- state -----
            user: null,
            accessToken: null,
            isAuthenticated: false,

            loading: false,
            error: null,

            // ----- helpers -----
            clearError: () => set({ error: null }),
            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user && !!get().accessToken,
                }),
            setToken: (token) => {
                setAuthToken(token); // keep axios in sync
                set({
                    accessToken: token,
                    isAuthenticated: !!token && !!get().user,
                });
            },

            // ----- actions -----
            login: async ({ username, password }) => {
                set({ loading: true, error: null });
                try {
                    const data: AuthResponse = await loginApi({ username, password });
                    setAuthToken(data.accessToken);
                    set({
                        user: data.user,
                        accessToken: data.accessToken,
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                    });

                    console.log("login success", data);
                } catch (err: any) {
                    set({
                        loading: false,
                        error: err?.message ?? "Login error",
                        user: null,
                        accessToken: null,
                        isAuthenticated: false,
                    });
                    throw err;
                }
            },

            signup: async ({ username, password }) => {
                set({ loading: true, error: null });
                try {
                    const data: AuthResponse = await signupApi({ username, password });
                    setAuthToken(data.accessToken);
                    set({
                        user: data.user,
                        accessToken: data.accessToken,
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                    });
                } catch (err: any) {
                    set({
                        loading: false,
                        error: err?.message ?? "Signup error",
                        user: null,
                        accessToken: null,
                        isAuthenticated: false,
                    });
                    throw err;
                }
            },

            logout: async () => {
                // optional: await to keep UI consistent
                await logoutApi();
                setAuthToken(null);
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null,
                });
            },
        }),
        {
            name: "auth",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                user: s.user,
                accessToken: s.accessToken,
                isAuthenticated: s.isAuthenticated,
            }),
            version: 1,
            // Re-attach token to axios after rehydrate
            onRehydrateStorage: () => (state) => {
                const token = state?.accessToken ?? null;
                setAuthToken(token);
            },
        }
    )
);

export const useAuth = () =>
    useAuthStore((s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        loading: s.loading,
        error: s.error,
    }));

export const useAuthActions = () =>
    useAuthStore((s) => ({
        login: s.login,
        signup: s.signup,
        logout: s.logout,
        clearError: s.clearError,
        setUser: s.setUser,
        setToken: s.setToken,
    }));

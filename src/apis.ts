import axios, { AxiosError } from "axios";
import type { User, CompleteLevelResponse, Level, LevelData, AuthResponse, LoginRequest, SignupRequest } from "@/types";

// ---- Axios instance ----
export const api = axios.create({
    baseURL:
        (import.meta as any).env?.VITE_API_BASE_URL ??
        "/api",
    withCredentials: true, // turn off if you don't use cookies
});

// Attach/remove Authorization header
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

// ---- Helpers ----
const toError = (e: unknown, fallback: string) => {
    const err = e as AxiosError<any>;
    const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        fallback;
    return new Error(msg);
};

// ---- API calls ----
export async function loginApi(input: LoginRequest): Promise<AuthResponse> {
    try {
        const { data } = await api.post<AuthResponse>("/auth/login", input);
        return data;
    } catch (e) {
        throw toError(e, "Login failed");
    }
}

export async function signupApi(input: SignupRequest): Promise<AuthResponse> {
    try {
        const { data } = await api.post<AuthResponse>("/auth/signup", input);
        return data;
    } catch (e) {
        throw toError(e, "Signup failed");
    }
}

export async function logoutApi(): Promise<void> {
    try {
        await api.post("/auth/logout");
    } catch {
        // usually safe to ignore logout errors client-side
    }
}

// --- Endpoints ---
export async function getLevels(): Promise<Level[]> {
    try {
        const { data } = await api.get<{ levels: Level[] }>("/levels");
        return data.levels;
    } catch (e) {
        throw toError(e, "Failed to fetch levels");
    }
}

export async function createLevel(input: LevelData): Promise<Level> {
    try {
        const { data } = await api.post<{ level: Level }>("/levels", input);
        return data.level;
    } catch (e) {
        throw toError(e, "Failed to create level");
    }
}

export async function getLevel(levelId: string): Promise<Level> {
    try {
        const { data } = await api.get<{ level: Level }>(`/levels/${levelId}`);
        return data.level;
    } catch (e) {
        throw toError(e, "Failed to fetch level");
    }
}

// --- Endpoints ---
export async function getUsers(): Promise<User[]> {
    try {
        const { data } = await api.get<{ users: User[] }>("/users");
        return data.users;
    } catch (e) {
        throw toError(e, "Failed to fetch users");
    }
}

export async function completeLevel(levelId: string): Promise<CompleteLevelResponse> {
    try {
        const { data } = await api.post<CompleteLevelResponse>(`/levels/${levelId}/complete`);
        return data;
    } catch (e) {
        throw toError(e, "Failed to complete level");
    }
}

export type Coord = { row: number; col: number } | [number, number];

// ---- Types shared with store ----
export type AuthUser = {
    id: string;
    username: string;
    user_type: "player" | "admin" | "guest";
};

export type LoginRequest = { username: string; password: string };
export type SignupRequest = { username: string; password: string };

export type AuthResponse = {
    user: AuthUser;
    accessToken: string;
};

export type LevelData = {
    rows: number;
    cols: number;
    cell: number;
    stones: Coord[];
    boxes: Coord[];
    finishPoints: Coord[];
    initial: Coord;          // note: null not allowed for POST (must be provided)
    name: string;
    score: number;
};

export type Level = LevelData & {
    id: string;
    created_by: string;
    created_at: number; // epoch seconds
};

import type { Coord } from "@/types";

export const stoneCoordinates: Coord[] = [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 3, col: 4 }, { row: 3, col: 5 },
    { row: 6, col: 8 }, { row: 7, col: 8 },
    { row: 8, col: 8 }
];

export const boxCoordinates: Coord[] = [
    { row: 2, col: 2 }, { row: 2, col: 3 },
    { row: 5, col: 7 }
];

export const finishCoordinates: Coord[] = [
    { row: 1, col: 10 }, { row: 2, col: 10 },
    { row: 3, col: 10 },
];
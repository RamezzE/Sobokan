import { useEffect, useRef, useState } from "react";
import PlayerSprite from "./PlayerSprite";
import stone from "@/assets/stone.svg";
import box from "@/assets/box.svg";
import sand from "@/assets/sand.svg";

type Coord = { row: number; col: number } | [number, number];

type GridBoardProps = {
    rows?: number;
    cols?: number;
    cell?: number; // px per cell
    initial?: { row: number; col: number };
    showCoords?: boolean;
    stones?: Coord[]; // cells with stone.png
    boxes?: Coord[];  // cells with box.svg
};

const GridBoard = ({
    rows = 10,
    cols = 10,
    cell = 48,
    initial = { row: 0, col: 0 },
    showCoords = true,
    stones = [],
    boxes = [],
}: GridBoardProps) => {
    const [pos, setPos] = useState(initial);
    const boardRef = useRef<HTMLDivElement>(null);

    const clamp = (v: number, min: number, max: number) =>
        Math.max(min, Math.min(max, v));

    const moveBy = (dr: number, dc: number) => {
        // if there's a stone in the way, don't move
        const nextRow = clamp(pos.row + dr, 0, rows - 1);
        const nextCol = clamp(pos.col + dc, 0, cols - 1);

        const hasStone = stones.some(
            (s) =>
                (Array.isArray(s) ? s[0] : s.row) === nextRow &&
                (Array.isArray(s) ? s[1] : s.col) === nextCol
        );
        if (hasStone) return;
        
        setPos((p) => ({
            row: clamp(p.row + dr, 0, rows - 1),
            col: clamp(p.col + dc, 0, cols - 1),
        }));
    };

    useEffect(() => {
        boardRef.current?.focus();
    }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        let handled = true;
        switch (e.key) {
            case "ArrowUp":
            case "w":
            case "W":
                moveBy(-1, 0);
                break;
            case "ArrowDown":
            case "s":
            case "S":
                moveBy(1, 0);
                break;
            case "ArrowLeft":
            case "a":
            case "A":
                moveBy(0, -1);
                break;
            case "ArrowRight":
            case "d":
            case "D":
                moveBy(0, 1);
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // CSS vars (read by Tailwind arbitrary values)
    const vars = {
        ["--cell" as any]: `${cell}px`,
        ["--w" as any]: `${cols * cell}px`,
        ["--h" as any]: `${rows * cell}px`,
        ["--r" as any]: `${pos.row}`,
        ["--c" as any]: `${pos.col}`,
    };

    const norm = (arr: Coord[]) =>
        arr.map((s) => (Array.isArray(s) ? { row: s[0], col: s[1] } : s));

    const stoneCells = norm(stones);
    const boxCells = norm(boxes);

    return (
        <div className="space-y-2">
            <div
                ref={boardRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onClick={() => boardRef.current?.focus()}
                className={[
                    "relative outline-none rounded-lg border border-black/20 overflow-hidden",
                    "bg-[image:linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.1)_1px,transparent_1px)]",
                    "bg-[length:var(--cell)_var(--cell)]",
                    "select-none",
                ].join(" ")}
                style={vars}
            >
                {/* Board size box */}
                <div className="w-[var(--w)] h-[var(--h)]" />

                {/* Sand base layer */}
                <div className="z-0 absolute inset-0">
                    {Array.from({ length: rows }).map((_, r) =>
                        Array.from({ length: cols }).map((_, c) => {
                            const hasStone = stones.some(
                                (s) =>
                                    (Array.isArray(s) ? s[0] : s.row) === r &&
                                    (Array.isArray(s) ? s[1] : s.col) === c
                            );
                            const hasBox = boxes.some(
                                (b) =>
                                    (Array.isArray(b) ? b[0] : b.row) === r &&
                                    (Array.isArray(b) ? b[1] : b.col) === c
                            );
                            if (hasStone || hasBox) return null; // skip if stone/box here
                            return (
                                <div
                                    key={`sand-${r}-${c}`}
                                    style={
                                        {
                                            ["--r" as any]: r,
                                            ["--c" as any]: c,
                                        } as React.CSSProperties
                                    }
                                    className={[
                                        "absolute top-0 left-0",
                                        "w-[var(--cell)] h-[var(--cell)]",
                                        "translate-x-[calc(var(--c)*var(--cell))] translate-y-[calc(var(--r)*var(--cell))]",
                                        "grid place-items-center",
                                    ].join(" ")}
                                >
                                    <img
                                        src={sand as unknown as string}
                                        alt="Sand"
                                        draggable={false}
                                        className="w-full h-full object-cover pointer-events-none"
                                    />
                                </div>
                            );
                        })
                    )}
                </div>


                {/* Stones layer */}
                <div className="absolute inset-0">

                    {stoneCells.map(({ row, col }, idx) => (
                        <div
                            key={`stone-${row}-${col}-${idx}`}
                            style={
                                {
                                    ["--sr" as any]: row,
                                    ["--sc" as any]: col,
                                } as React.CSSProperties
                            }
                            className={[
                                "absolute top-0 left-0",
                                "w-[var(--cell)] h-[var(--cell)]",
                                "translate-x-[calc(var(--sc)*var(--cell))] translate-y-[calc(var(--sr)*var(--cell))]",
                                "grid place-items-center",
                            ].join(" ")}
                        >
                            <img
                                src={stone as unknown as string}
                                alt="Stone"
                                draggable={false}
                                className="w-full h-full object-cover pointer-events-none"
                            />
                        </div>
                    ))}
                </div>

                {/* Boxes layer (above stones, below player) */}
                <div className="z-10 absolute inset-0">
                    {boxCells.map(({ row, col }, idx) => (
                        <div
                            key={`box-${row}-${col}-${idx}`}
                            style={
                                {
                                    ["--br" as any]: row,
                                    ["--bc" as any]: col,
                                } as React.CSSProperties
                            }
                            className={[
                                "absolute top-0 left-0",
                                "w-[var(--cell)] h-[var(--cell)]",
                                "translate-x-[calc(var(--bc)*var(--cell))] translate-y-[calc(var(--br)*var(--cell))]",
                                "grid place-items-center",
                            ].join(" ")}
                        >
                            <img
                                src={box as unknown as string}
                                alt="Box"
                                draggable={false}
                                className="w-full h-full object-contain pointer-events-none"
                            />
                        </div>
                    ))}
                </div>

                {/* Player sprite (top layer) */}
                <div
                    className={[
                        "absolute top-0 left-0 z-20",
                        "w-[var(--cell)] h-[var(--cell)]",
                        "translate-x-[calc(var(--c)*var(--cell))] translate-y-[calc(var(--r)*var(--cell))]",
                        "grid place-items-center",
                        "pointer-events-none",
                        "image-render-pixelated",
                    ].join(" ")}
                >
                    <PlayerSprite fps={12} className="w-3/4 h-3/4" />
                </div>
            </div>

            {showCoords && (
                <p className="font-mono text-sm">row: {pos.row} &nbsp; col: {pos.col}</p>
            )}
        </div>
    );
};

export default GridBoard;

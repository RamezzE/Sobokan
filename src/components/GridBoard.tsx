import { useEffect, useMemo, useRef, useState } from "react";
import type { Coord } from "@/types";
import PlayerSprite from "./PlayerSprite";
import stone from "@/assets/stone.svg";
import box from "@/assets/box.svg";
import sand from "@/assets/sand.svg";

import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";

type GridBoardProps = {
    id: string;
    rows?: number;
    cols?: number;
    cell?: number; // px per cell
    initial?: { row: number; col: number };
    stones?: Coord[]; // cells with stone.png
    boxes?: Coord[];   // initial layout only
    restart?: boolean; // when toggled, resets player and boxes to initial
    onRestarted?: () => void; // called after restart is processed
    finishPoints?: Coord[];  // must have same count as initial boxes
};

const GridBoard = ({
    id,
    rows = 10,
    cols = 10,
    cell = 48,
    initial = { row: 0, col: 0 },
    stones = [],
    boxes = [],
    restart = false,
    onRestarted = () => { },
    finishPoints = [],

}: GridBoardProps) => {
    const { user } = useAuthStore();
    const { completeLevel } = useGameStore();
    // Track win state
    const [won, setWon] = useState(false);

    useEffect(() => {
        if (won && user && (user.user_type === "player" || user.user_type === "admin")) {
            completeLevel(id).catch(() => {
                // Handle error
            });
        }
    }, [won]);

    useEffect(() => {
        if (restart) {
            setPos(initial);
            setBoxCells(() => norm(boxes));
            setWon(false);
            onRestarted();
        }
    }, [restart, initial, boxes, onRestarted]);

    const [pos, setPos] = useState(initial);
    const boardRef = useRef<HTMLDivElement>(null);

    // Normalize helper
    const norm = (arr: Coord[] = []) =>
        arr.map((s) => (Array.isArray(s) ? { row: s[0], col: s[1] } : s));

    // Treat boxes prop as initial layout only
    const [boxCells, setBoxCells] = useState<{ row: number; col: number }[]>(
        () => norm(boxes)
    );

    // Remember the initial number of boxes to validate finishPoints count
    const initialBoxCountRef = useRef<number>(norm(boxes).length);

    const finishCells = useMemo(() => norm(finishPoints), [finishPoints]);

    const stoneSet = useMemo(() => {
        const s = new Set<string>();
        norm(stones).forEach(({ row, col }) => s.add(`${row},${col}`));
        return s;
    }, [stones]);

    const boxSet = useMemo(() => {
        const s = new Set<string>();
        boxCells.forEach(({ row, col }) => s.add(`${row},${col}`));
        return s;
    }, [boxCells]);

    const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;
    const isStone = (r: number, c: number) => stoneSet.has(`${r},${c}`);
    const isBox = (r: number, c: number) => boxSet.has(`${r},${c}`);

    // Validate finish count equals initial box count (one-time rule)
    const finishCountValid = finishCells.length === initialBoxCountRef.current;

    // Given a candidate box array, decide if all finish points are covered
    const allFinished = (candidate: { row: number; col: number }[]) => {
        if (!finishCountValid || candidate.length === 0 || finishCells.length === 0) return false;
        const s = new Set(candidate.map(b => `${b.row},${b.col}`));
        for (const { row, col } of finishCells) {
            if (!s.has(`${row},${col}`)) return false;
        }
        return true;
    };


    const moveBy = (dr: number, dc: number) => {
        if (won) return; // no moves after winning
        setPos((p) => {
            const nr = p.row + dr;
            const nc = p.col + dc;
            if (!inBounds(nr, nc)) return p;          // out of bounds
            if (isStone(nr, nc)) return p;            // stone blocks

            // Try pushing a box
            if (isBox(nr, nc)) {
                const br = nr + dr;
                const bc = nc + dc;
                if (!inBounds(br, bc) || isStone(br, bc) || isBox(br, bc)) return p; // blocked

                // Push the box forward by one cell
                setBoxCells(prev => {
                    const next = prev.map(b =>
                        b.row === nr && b.col === nc ? { row: br, col: bc } : b
                    );
                    // After boxes change, check win
                    setWon(allFinished(next));
                    return next;
                });

                // Player steps into the box's former tile
                return { row: nr, col: nc };
            }

            // Normal move into empty tile
            const moved = { row: nr, col: nc };
            // Check win even on normal move (rule: "whenever the player moves")
            setWon(allFinished(boxCells));
            return moved;
        });
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
                {won && (
                    <div className={[
                        "absolute inset-0 z-30",
                        "bg-black/50 flex items-center justify-center",
                    ].join(" ")}>
                        <span className="font-semibold text-white text-3xl">You Won!</span>
                    </div>
                )}

                {/* Sand base layer */}
                <div className="z-0 absolute inset-0">
                    {Array.from({ length: rows }).map((_, r) =>
                        Array.from({ length: cols }).map((_, c) => {
                            if (stoneSet.has(`${r},${c}`) || boxSet.has(`${r},${c}`)) return null;
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
                    {useMemo(() => norm(stones), [stones]).map(({ row, col }, idx) => (
                        <div
                            key={`stone-${row}-${col}-${idx}`}
                            style={{ ["--sr" as any]: row, ["--sc" as any]: col } as React.CSSProperties}
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

                {/* Finish points layer (above sand, below boxes) */}
                <div className="z-[5] absolute inset-0">
                    {finishCells.map(({ row, col }, idx) => (
                        <div
                            key={`finish-${row}-${col}-${idx}`}
                            style={
                                {
                                    ["--fr" as any]: row,
                                    ["--fc" as any]: col,
                                } as React.CSSProperties
                            }
                            className={[
                                "absolute top-0 left-0",
                                "w-[var(--cell)] h-[var(--cell)]",
                                "translate-x-[calc(var(--fc)*var(--cell))] translate-y-[calc(var(--fr)*var(--cell))]",
                            ].join(" ")}
                        >
                            {/* red dot centered within the cell */}
                            <div className="top-1/2 left-1/2 absolute bg-red-500 shadow rounded-full w-2 h-2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                    ))}
                </div>

                {/* Boxes layer (above stones, below player) */}
                <div className="z-10 absolute inset-0">
                    {boxCells.map(({ row, col }, idx) => (
                        <div
                            key={`box-${row}-${col}-${idx}`}
                            style={{ ["--br" as any]: row, ["--bc" as any]: col } as React.CSSProperties}
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
        </div>
    );
};

export default GridBoard;

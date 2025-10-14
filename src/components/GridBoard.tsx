import { useEffect, useMemo, useRef, useState } from "react";
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
    stones?: Coord[]; // cells with stone.png
    boxes?: Coord[];   // initial layout only
    restart?: boolean; // when toggled, resets player and boxes to initial
    onRestarted?: () => void; // called after restart is processed
};

const GridBoard = ({
    rows = 10,
    cols = 10,
    cell = 48,
    initial = { row: 0, col: 0 },
    stones = [],
    boxes = [],
    restart = false,
    onRestarted = () => { },
}: GridBoardProps) => {

    useEffect(() => {
        if (restart) {
            setPos(initial);
            setBoxCells(() => norm(boxes));
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

    // Precompute stone set (never changes)
    const stoneSet = useMemo(() => {
        const s = new Set<string>();
        norm(stones).forEach(({ row, col }) => s.add(`${row},${col}`));
        return s;
    }, [stones]);

    // Box set recomputed from state
    const boxSet = useMemo(() => {
        const s = new Set<string>();
        boxCells.forEach(({ row, col }) => s.add(`${row},${col}`));
        return s;
    }, [boxCells]);

    const inBounds = (r: number, c: number) =>
        r >= 0 && r < rows && c >= 0 && c < cols;

    const isStone = (r: number, c: number) => stoneSet.has(`${r},${c}`);
    const isBox = (r: number, c: number) => boxSet.has(`${r},${c}`);

    const moveBy = (dr: number, dc: number) => {
        setPos((p) => {
            const nr = p.row + dr;
            const nc = p.col + dc;

            // Block moving outside grid
            if (!inBounds(nr, nc)) return p;

            // Block stepping into stones
            if (isStone(nr, nc)) return p;

            // If next cell is a box, try to push it
            if (isBox(nr, nc)) {
                const br = nr + dr;
                const bc = nc + dc;

                // Can't push out of bounds, into another box, or into a stone
                if (!inBounds(br, bc) || isStone(br, bc) || isBox(br, bc)) {
                    return p;
                }

                // Perform the push: move that box from (nr,nc) -> (br,bc)
                setBoxCells((prev) => {
                    // Move the single box that matches (nr,nc)
                    return prev.map((b) =>
                        b.row === nr && b.col === nc ? { row: br, col: bc } : b
                    );
                });

                // Player moves into the box's former cell
                return { row: nr, col: nc };
            }

            // Normal move into empty cell
            return { row: nr, col: nc };
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

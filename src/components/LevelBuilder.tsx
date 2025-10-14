import { useEffect, useMemo, useRef, useState } from "react";
import PlayerSprite from "./PlayerSprite";
import stone from "@/assets/stone.svg";
import box from "@/assets/box.svg";
import sand from "@/assets/sand.svg";

type Tool = "stone" | "box" | "finish" | "player" | "erase";

type LevelData = {
    rows: number;
    cols: number;
    cell: number;
    stones: { row: number; col: number }[];
    boxes: { row: number; col: number }[];
    finishPoints: { row: number; col: number }[];
    initial: { row: number; col: number } | null;
    name: string;           // <-- add
    score: number;          // <-- add
};


export default function LevelBuilder({
    defaultRows = 10,
    defaultCols = 12,
    cell = 48,
    onSave,
}: {
    defaultRows?: number;
    defaultCols?: number;
    cell?: number;
    onSave?: (data: LevelData) => void;
}) {
    // --- Grid size controls ---
    const [rows, setRows] = useState<number>(defaultRows);
    const [cols, setCols] = useState<number>(defaultCols);

    // --- Board state ---
    const [player, setPlayer] = useState<{ row: number; col: number } | null>(null);
    const [stones, setStones] = useState<{ row: number; col: number }[]>([]);
    const [boxes, setBoxes] = useState<{ row: number; col: number }[]>([]);
    const [finishPoints, setFinishPoints] = useState<{ row: number; col: number }[]>([]);

    // --- UI state ---
    const [tool, setTool] = useState<Tool>("stone");
    const boardRef = useRef<HTMLDivElement>(null);

    const [levelName, setLevelName] = useState<string>("");
    const [levelScore, setLevelScore] = useState<number | "">("");

    // Focus for key interactions if needed later
    useEffect(() => {
        boardRef.current?.focus();
    }, []);

    // Helpers
    const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;
    const key = (r: number, c: number) => `${r},${c}`;

    const stoneSet = useMemo(() => new Set(stones.map(s => key(s.row, s.col))), [stones]);
    const boxSet = useMemo(() => new Set(boxes.map(b => key(b.row, b.col))), [boxes]);
    const finishSet = useMemo(() => new Set(finishPoints.map(f => key(f.row, f.col))), [finishPoints]);
    const playerKey = player ? key(player.row, player.col) : null;

    // Keep items in bounds if rows/cols change
    useEffect(() => {
        const clamp = (arr: { row: number; col: number }[]) =>
            arr.filter(({ row, col }) => inBounds(row, col));
        setStones(prev => clamp(prev));
        setBoxes(prev => clamp(prev));
        setFinishPoints(prev => clamp(prev));
        setPlayer(prev => (prev && inBounds(prev.row, prev.col) ? prev : null));
    }, [rows, cols]);

    // Place / toggle functions
    const toggleAt = (
        arr: { row: number; col: number }[],
        setArr: React.Dispatch<React.SetStateAction<{ row: number; col: number }[]>>,
        r: number,
        c: number
    ) => {
        const k = key(r, c);
        if ((arr === stones && stoneSet.has(k)) ||
            (arr === boxes && boxSet.has(k)) ||
            (arr === finishPoints && finishSet.has(k))) {
            setArr(prev => prev.filter(x => !(x.row === r && x.col === c)));
        } else {
            setArr(prev => [...prev, { row: r, col: c }]);
        }
    };

    // Click handler
    const onCellClick = (r: number, c: number) => {
        if (!inBounds(r, c)) return;

        if (tool === "erase") {
            // remove anything in this cell (stone/box/finish/player)
            setStones(prev => prev.filter(s => !(s.row === r && s.col === c)));
            setBoxes(prev => prev.filter(b => !(b.row === r && b.col === c)));
            setFinishPoints(prev => prev.filter(f => !(f.row === r && f.col === c)));
            if (player && player.row === r && player.col === c) setPlayer(null);
            return;
        }

        if (tool === "player") {
            // cannot place player where something exists
            const k = key(r, c);
            if (stoneSet.has(k) || boxSet.has(k) || finishSet.has(k)) return;
            setPlayer({ row: r, col: c });
            return;
        }

        // prevent placing on player cell
        if (playerKey === key(r, c)) return;

        if (tool === "stone") {
            // can't place where a box/finish already is
            if (boxSet.has(key(r, c)) || finishSet.has(key(r, c))) return;
            toggleAt(stones, setStones, r, c);
            return;
        }
        if (tool === "box") {
            // can't place where stone/finish already is
            if (stoneSet.has(key(r, c)) || finishSet.has(key(r, c))) return;
            toggleAt(boxes, setBoxes, r, c);
            return;
        }
        if (tool === "finish") {
            // can't place where stone/box already is
            if (stoneSet.has(key(r, c)) || boxSet.has(key(r, c))) return;
            toggleAt(finishPoints, setFinishPoints, r, c);
            return;
        }
    };

    // Validation: finish points must equal boxes
    const countsMatch = boxes.length === finishPoints.length;

    const nameValid = levelName.trim().length > 0;
    const scoreValid = typeof levelScore === "number" && !Number.isNaN(levelScore);
    const canSave = countsMatch && player !== null && nameValid && scoreValid; // <-- updated


    // CSS vars (Tailwind arbitrary values)
    const vars = {
        ["--cell" as any]: `${cell}px`,
        ["--w" as any]: `${cols * cell}px`,
        ["--h" as any]: `${rows * cell}px`,
    };

    const handleSave = () => {
        if (!canSave) return;
        onSave?.({
            rows,
            cols,
            cell,
            stones,
            boxes,
            finishPoints,
            initial: player,
            name: levelName.trim(),
            score: levelScore as number,
        });
    };

    return (
        <div className="flex justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 min-h-screen">
            <div className="w-full max-w-5xl">
                <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 border-white/10 border-b">
                        <div>
                            <h1 className="font-semibold text-white text-2xl sm:text-3xl">Level Builder</h1>
                            <p className="mt-1 text-slate-300 text-sm">
                                Click to place tiles. Finish points must equal boxes. Player start can’t be overlapped.
                            </p>
                        </div>

                        {/* Controls: size + save */}
                        <div className="flex flex-col gap-y-4">
                            <div className="flex flex-row items-center gap-x-2">

                                <label className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-slate-300 text-sm">
                                    <span>Name</span>
                                    <input
                                        type="text"
                                        value={levelName}
                                        onChange={(e) => setLevelName(e.target.value)}
                                        placeholder="Level name"
                                        className="bg-transparent outline-none w-40 text-white placeholder-slate-400"
                                    />
                                </label>

                                <label className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-slate-300 text-sm">
                                    <span>Score</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={levelScore}
                                        onChange={(e) => {
                                            const n = e.target.value === "" ? "" : Number(e.target.value);
                                            setLevelScore(n);
                                        }}
                                        placeholder="e.g. 100"
                                        className="bg-transparent outline-none w-24 text-white placeholder-slate-400"
                                    />
                                </label>
                            </div>
                            <div className="flex flex-row items-center gap-x-2">
                                <label className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-slate-300 text-sm">
                                    <span>Rows</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={rows}
                                        onChange={(e) => setRows(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                                        className="bg-transparent outline-none w-16 text-white"
                                    />
                                </label>
                                <label className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-slate-300 text-sm">
                                    <span>Cols</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={cols}
                                        onChange={(e) => setCols(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                                        className="bg-transparent outline-none w-16 text-white"
                                    />
                                </label>
                                {/* <div className="hidden sm:block bg-white/10 ml-auto w-px h-6" /> */}
                                <button
                                    onClick={handleSave}
                                    disabled={!canSave}
                                    className={[
                                        "rounded-xl bg-indigo-500 hover:bg-indigo-400 ml-auto",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "text-white font-semibold px-4 py-2 shadow-lg shadow-indigo-500/20 transition",
                                    ].join(" ")}
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Toolbar */}
                    <div className="px-6 sm:px-8 py-3 border-white/10 border-b">
                        <div className="flex flex-wrap items-center gap-2">
                            <ToolButton
                                active={tool === "stone"}
                                label="Stone"
                                onClick={() => setTool("stone")}
                            >
                                <img src={stone as unknown as string} alt="stone" className="w-6 h-6" />
                            </ToolButton>

                            <ToolButton
                                active={tool === "box"}
                                label="Box"
                                onClick={() => setTool("box")}
                            >
                                <img src={box as unknown as string} alt="box" className="w-6 h-6" />
                            </ToolButton>

                            <ToolButton
                                active={tool === "finish"}
                                label="Finish"
                                onClick={() => setTool("finish")}
                            >
                                <span className="inline-block bg-red-500 rounded-full w-3 h-3" />
                            </ToolButton>

                            <ToolButton
                                active={tool === "player"}
                                label="Player"
                                onClick={() => setTool("player")}
                            >
                                <div className="place-items-center grid w-6 h-6">
                                    <PlayerSprite fps={12} className="w-5 h-5" />
                                </div>
                            </ToolButton>

                            <ToolButton
                                active={tool === "erase"}
                                label="Erase"
                                onClick={() => setTool("erase")}
                            >
                                {/* Trash/eraser icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                            </ToolButton>

                            <div className="flex items-center gap-3 ml-auto text-sm">
                                {!nameValid && <span className="ml-2 text-rose-300 text-xs">Name required</span>}
                                {!scoreValid && <span className="ml-2 text-rose-300 text-xs">Score required</span>}

                                <span className="text-slate-300">
                                    Boxes: <span className="font-semibold text-white">{boxes.length}</span>
                                </span>
                                <span className="text-slate-300">
                                    Finish: <span className="font-semibold text-white">{finishPoints.length}</span>
                                </span>
                                <span className={countsMatch ? "text-emerald-400" : "text-rose-300"}>
                                    {countsMatch ? "✓ Matching" : "Finish ≠ Boxes"}
                                </span>
                                <span className="text-slate-300">
                                    Player:{" "}
                                    <span className="font-semibold text-white">
                                        {player ? `(${player.row}, ${player.col})` : "—"}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Board */}
                    <div className="place-items-center grid bg-white/5 p-4 sm:p-6">
                        <div
                            ref={boardRef}
                            tabIndex={0}
                            className={[
                                "relative outline-none rounded-lg border border-black/20 overflow-hidden",
                                "bg-[image:linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.1)_1px,transparent_1px)]",
                                "bg-[length:var(--cell)_var(--cell)]",
                                "select-none",
                            ].join(" ")}
                            style={vars}
                        >
                            {/* Board size box */}
                            <div className="w-[calc(var(--w))] h-[calc(var(--h))]" />

                            {/* Sand base layer */}
                            <div className="z-0 absolute inset-0">
                                {Array.from({ length: rows }).map((_, r) =>
                                    Array.from({ length: cols }).map((_, c) => {
                                        return (
                                            <div
                                                key={`sand-${r}-${c}`}
                                                onClick={() => onCellClick(r, c)}
                                                style={
                                                    {
                                                        ["--r" as any]: r,
                                                        ["--c" as any]: c,
                                                    } as React.CSSProperties
                                                }
                                                className={[
                                                    "absolute top-0 left-0 cursor-pointer",
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

                            {/* Stones */}
                            <div className="z-10 absolute inset-0 pointer-events-none">
                                {stones.map(({ row, col }, idx) => (
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

                            {/* Finish points */}
                            <div className="z-[15] absolute inset-0 pointer-events-none">
                                {finishPoints.map(({ row, col }, idx) => (
                                    <div
                                        key={`finish-${row}-${col}-${idx}`}
                                        style={{ ["--fr" as any]: row, ["--fc" as any]: col } as React.CSSProperties}
                                        className={[
                                            "absolute top-0 left-0",
                                            "w-[var(--cell)] h-[var(--cell)]",
                                            "translate-x-[calc(var(--fc)*var(--cell))] translate-y-[calc(var(--fr)*var(--cell))]",
                                        ].join(" ")}
                                    >
                                        <div className="top-1/2 left-1/2 absolute bg-red-500 shadow rounded-full w-2 h-2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                ))}
                            </div>

                            {/* Boxes */}
                            <div className="z-20 absolute inset-0 pointer-events-none">
                                {boxes.map(({ row, col }, idx) => (
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

                            {/* Player */}
                            {player && (
                                <div
                                    className={[
                                        "absolute top-0 left-0 z-30 pointer-events-none",
                                        "w-[var(--cell)] h-[var(--cell)]",
                                    ].join(" ")}
                                    style={
                                        {
                                            ["--pr" as any]: player.row,
                                            ["--pc" as any]: player.col,
                                        } as React.CSSProperties
                                    }
                                >
                                    <div
                                        className="top-0 left-0 absolute place-items-center grid w-[var(--cell)] h-[var(--cell)] translate-x-[calc(var(--pc)*var(--cell))] translate-y-[calc(var(--pr)*var(--cell))]"
                                    >
                                        <PlayerSprite fps={12} className="w-3/4 h-3/4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white/5 px-6 sm:px-8 py-4">
                        <p className="text-slate-300 text-sm text-center">
                            Tool:{" "}
                            <span className="font-semibold text-white">
                                {tool.charAt(0).toUpperCase() + tool.slice(1)}
                            </span>{" "}
                            • Cell: <span className="text-white">{cell}px</span>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-slate-400 text-xs text-center">
                    © {new Date().getFullYear()} Your Company. All rights reserved.
                </p>
            </div>
        </div>
    );
}

/* ---------- Small helper button component ---------- */
function ToolButton({
    active,
    onClick,
    label,
    children,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition",
                active
                    ? "bg-white/20 border-white/20 text-white"
                    : "bg-white/10 border-white/10 text-slate-200 hover:bg-white/15",
            ].join(" ")}
            title={label}
            aria-pressed={active}
        >
            {children}
            <span className="text-sm">{label}</span>
        </button>
    );
}

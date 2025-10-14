import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GridBoard from "@/components/GridBoard";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import type { Level } from "@/types";

const GameScreen = () => {
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();
    const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
    const [restart, setRestart] = useState(false);
    const { user } = useAuthStore();
    const { fetchLevel, error } = useGameStore();

    // auth gate (player/guest/admin allowed)
    useEffect(() => {
        if (!user || (user.user_type !== "player" && user.user_type !== "guest" && user.user_type !== "admin")) {
            navigate("/signin");
        }
    }, [user, navigate]);

    // load level by id
    useEffect(() => {
        if (!levelId) return;
        const fetchLevelData = async () => {
            const response = await fetchLevel(levelId).catch(() => { });
            setCurrentLevel(response || null);
        };
        fetchLevelData();
    }, [levelId, fetchLevel]);

    if (!user) return null;

    return (
        <div className="w-full max-w-3xl">
            <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-8 py-4 border-white/10 border-b">
                    <div className="flex flex-row justify-between items-center gap-x-2 w-full">
                        <div>
                            <h1 className="font-semibold text-white text-2xl sm:text-3xl">
                                {currentLevel?.name ?? "Loading level…"}
                            </h1>
                            <p className="mt-1 text-slate-300 text-sm">
                                {currentLevel ? `Score: ${currentLevel.score}` : "Fetching level details…"}
                            </p>
                        </div>

                        <button
                            onClick={() => setRestart(true)}
                            disabled={!currentLevel}
                            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 mr-2 p-2 border border-white/10 rounded-xl text-slate-200 transition"
                            aria-label="Restart"
                            title="Restart"
                        >
                            {/* Restart icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="21 3 21 9 15 9" />
                                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="px-8 py-3 border-white/10 border-b">
                        <div className="bg-rose-500/10 px-4 py-2 border border-rose-400/40 rounded-xl text-rose-200 text-sm">
                            {error}
                        </div>
                    </div>
                )}

                {/* Board area */}
                <div className="place-items-center grid bg-white/5 pt-4">
                    {(!currentLevel) ? (
                        <div className="py-10 text-slate-300 text-sm">Loading…</div>
                    ) : (
                        <GridBoard
                            rows={currentLevel.rows}
                            cols={currentLevel.cols}
                            cell={currentLevel.cell}
                            // @ts-ignore
                            initial={currentLevel.initial}
                            stones={currentLevel.stones}
                            boxes={currentLevel.boxes}
                            restart={restart}
                            onRestarted={() => setRestart(false)}
                            finishPoints={currentLevel.finishPoints}
                        />
                    )}
                </div>

                {/* Footer / tips */}
                <div className="bg-white/5 py-4">
                    <p className="text-slate-300 text-sm text-center">
                        Use <span className="font-semibold text-white">WASD</span> or{" "}
                        <span className="font-semibold text-white">arrow keys</span> to move.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GameScreen;

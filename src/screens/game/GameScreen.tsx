import { useState, useEffect } from "react";
import GridBoard from "@/components/GridBoard";
import {
    stoneCoordinates,
    boxCoordinates,
    finishCoordinates,
} from "@/constants/coordinates";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

const GameScreen = () => {
    const navigate = useNavigate();

    const [restart, setRestart] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user || user.user_type !== "player" && user.user_type !== "guest" && user.user_type !== "admin")
            navigate("/signin");

    }, [user]);

    if (!user) return null;

    return (
        <div className="w-full max-w-3xl">
            <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-8 py-4 border-white/10 border-b">

                    <div className="flex flex-row justify-between items-center gap-x-2 w-full">
                        <div>
                            <h1 className="font-semibold text-white text-2xl sm:text-3xl">Sobokan</h1>
                            <p className="mt-1 text-slate-300 text-sm">
                                Push all boxes onto the red dots to win.
                            </p>
                        </div>
                        <button
                            onClick={() => setRestart(true)}
                            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 mr-2 p-2 border border-white/10 rounded-xl text-slate-200 transition"
                            aria-label="Restart"
                            title="Restart"
                        >
                            {/* inline Restart icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="21 3 21 9 15 9" />
                                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            </svg>
                        </button>

                    </div>
                </div>

                {/* Board area */}
                <div className="place-items-center grid bg-white/5 pt-4">
                    <GridBoard
                        rows={10}
                        cols={12}
                        cell={48}
                        initial={{ row: 1, col: 1 }}
                        stones={stoneCoordinates}
                        boxes={boxCoordinates}
                        restart={restart}
                        onRestarted={() => setRestart(false)}
                        finishPoints={finishCoordinates}
                    />
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

import { useState } from "react";
import GridBoard from "@/components/GridBoard";
import {
    stoneCoordinates,
    boxCoordinates,
    finishCoordinates,
} from "@/constants/coordinates";

const GameScreen = () => {
    const [restart, setRestart] = useState(false);

    return (
        <div className="w-full max-w-3xl">
            <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-8 py-4 border-white/10 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="font-semibold text-white text-2xl sm:text-3xl">Sobokan</h1>
                            <p className="mt-1 text-slate-300 text-sm">
                                Push all boxes onto the red dots to win.
                            </p>
                        </div>
                        <button
                            onClick={() => setRestart(true)}
                            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 shadow-indigo-500/20 shadow-lg px-4 py-2 rounded-xl font-semibold text-white transition disabled:cursor-not-allowed"
                        >
                            Restart
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

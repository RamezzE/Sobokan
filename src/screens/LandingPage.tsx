// src/screens/LandingPage.tsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/useGameStore";

const LandingPage = () => {
    const navigate = useNavigate();
    const { users, loading, error, fetchUsers, clearError } = useGameStore();

    useEffect(() => {
        fetchUsers().catch(() => { });
    }, [fetchUsers]);

    const sorted = useMemo(() => {
        return [...users].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 20);
    }, [users]);

    return (
        <div className="w-full max-w-4xl">
            <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 px-6 sm:px-8 py-6 sm:py-8 border-white/10 border-b">
                    <div>
                        <h1 className="font-semibold text-white text-3xl sm:text-4xl">Sokoban</h1>
                        <p className="mt-2 text-slate-300 text-sm">
                            Push the boxes onto the targets. Climb the leaderboard.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchUsers().catch(() => { })}
                            className="bg-white/10 hover:bg-white/20 px-4 py-2 border border-white/10 rounded-xl text-slate-200 transition"
                            disabled={loading}
                            title="Refresh leaderboard"
                        >
                            {loading ? "Refreshing…" : "Refresh"}
                        </button>
                        <button
                            onClick={() => navigate("/game/view-levels")}
                            className="bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20 shadow-lg px-4 py-2 rounded-xl font-semibold text-white transition"
                        >
                            Play now
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="px-6 sm:px-8 py-3 border-white/10 border-b">
                        <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2 border border-rose-400/40 rounded-xl text-rose-200 text-sm">
                            <span>{error}</span>
                            <button
                                onClick={clearError}
                                className="text-rose-200/80 hover:text-rose-100 underline underline-offset-4"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="p-4 sm:p-6">
                    <h2 className="mb-4 font-semibold text-white text-xl">Leaderboard</h2>
                    {loading && users.length === 0 ? (
                        <div className="py-10 text-slate-300 text-sm text-center">Loading leaderboard…</div>
                    ) : sorted.length === 0 ? (
                        <div className="py-10 text-slate-300 text-sm text-center">No players yet.</div>
                    ) : (
                        <ol className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                            {sorted.map((u, i) => (
                                <li key={u.id} className="flex justify-between items-center px-4 sm:px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 font-semibold text-slate-300 text-center">
                                            {i + 1}
                                        </span>
                                        <span className="font-medium text-white">@{u.username}</span>
                                    </div>
                                    <span className="text-slate-300">
                                        Score: <span className="font-semibold text-white">{u.score ?? 0}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandingPage;

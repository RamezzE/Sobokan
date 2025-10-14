import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import LevelCard from "@/components/LevelCard";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

const ViewLevelsPage = () => {
    const { levels, loading, error, fetchLevels, clearError } = useGameStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user)
            navigate("/signin");
    }, [user]);

    useEffect(() => {
        fetchLevels().catch(() => { });
    }, [fetchLevels]);

    return (
        <div className="w-full max-w-5xl">
            <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 sm:px-8 py-5 sm:py-6 border-white/10 border-b">
                    <div>
                        <h1 className="font-semibold text-white text-2xl sm:text-3xl">Levels</h1>
                        <p className="mt-1 text-slate-300 text-sm">Browse available levels.</p>
                    </div>

                    <div className="flex flex-row gap-x-4">
                        {
                            user && user.user_type === "admin" && (
                                <button
                                    onClick={() => navigate("/admin/create-level")}
                                    className="bg-green-500 hover:bg-green-400 disabled:opacity-50 shadow-green-500/20 shadow-lg px-4 py-2 rounded-xl font-semibold text-white transition disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    {/* inline Add icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="Add" role="img">
                                        <circle cx="12" cy="12" r="9" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>

                                </button>
                            )
                        }


                        <button
                            onClick={() => fetchLevels().catch(() => { })}
                            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 shadow-indigo-500/20 shadow-lg px-4 py-2 rounded-xl font-semibold text-white transition disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {/* inline Restart icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="21 3 21 9 15 9" />
                                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            </svg>
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

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {loading && levels.length === 0 ? (
                        <div className="py-10 text-slate-300 text-sm text-center">Loading levels…</div>
                    ) : levels.length === 0 ? (
                        <div className="py-10 text-slate-300 text-sm text-center">No levels available yet.</div>
                    ) : (
                        <div className="gap-4 sm:gap-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {levels.map((lvl) => (
                                <LevelCard key={lvl.id} level={{ name: lvl.name, score: lvl.score }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewLevelsPage;

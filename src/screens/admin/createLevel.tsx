import { useEffect, useState } from "react";
import LevelBuilder from "@/components/LevelBuilder";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { useNavigate } from "react-router-dom";

const CreateLevelPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { addLevel } = useGameStore();

    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user || user.user_type !== "admin") navigate("/signin");
    }, [user, navigate]);

    return (
        <div className="flex justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 min-h-screen">
            <div className="w-full max-w-5xl">
                {/* alerts */}
                {err && (
                    <div className="bg-rose-500/10 mb-4 px-4 py-2 border border-rose-400/40 rounded-xl text-rose-200 text-sm">
                        {err}
                    </div>
                )}
                {msg && (
                    <div className="bg-emerald-500/10 mb-4 px-4 py-2 border border-emerald-400/40 rounded-xl text-emerald-200 text-sm">
                        {msg}
                    </div>
                )}
                <button
                    onClick={async () => {
                        await logout();
                        navigate("/signin");
                    }}
                    className="bg-white/10 hover:bg-white/20 mr-2 p-2 border border-white/10 rounded-xl text-slate-200 transition"
                    aria-label="Logout"
                    title="Logout"
                >
                    {/* inline logout icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>

                <span className="hidden sm:inline mr-3 text-slate-300 text-sm">
                    @{user && user.username || "unknown user"}
                </span>
                <LevelBuilder
                    onSave={async (data) => {
                        setErr(null);
                        setMsg(null);
                        setSubmitting(true);
                        try {
                            // Backend requires initial to be provided (not null)
                            if (!data.initial) {
                                throw new Error("Player starting point (initial) is required.");
                            }
                            await addLevel({
                                name: data.name,
                                score: data.score,
                                rows: data.rows,
                                cols: data.cols,
                                cell: data.cell,
                                stones: data.stones,
                                boxes: data.boxes,
                                finishPoints: data.finishPoints,
                                initial: data.initial,
                            });
                            setMsg("Level created successfully.");
                        } catch (e: any) {
                            setErr(e?.message || "Failed to create level.");
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                />

                {/* optional disable overlay while submitting */}
                {submitting && (
                    <div className="fixed inset-0 pointer-events-none" aria-hidden="true" />
                )}
            </div>
        </div>
    );
};

export default CreateLevelPage;

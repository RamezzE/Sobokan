import { useEffect, useState } from "react";
import LevelBuilder from "@/components/LevelBuilder";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { useNavigate } from "react-router-dom";

const CreateLevelPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
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

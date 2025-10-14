import type { Level } from "@/types";

const LevelCard = ({ level }: { level: Pick<Level, "name" | "score"> }) => {
    return (
        <div className="bg-white/10 hover:bg-white/15 shadow-md p-4 sm:p-5 border border-white/10 rounded-2xl transition">
            <h3 className="font-semibold text-white text-lg truncate">{level.name}</h3>
            <p className="mt-1 text-slate-300 text-sm">
                Score: <span className="font-medium text-white">{level.score}</span>
            </p>
        </div>
    );
}

export default LevelCard;

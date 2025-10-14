import { useAuthStore } from "@/store/useAuthStore"
import { useNavigate } from "react-router"

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    if (!user) return null;
    return (
        <div className="flex flex-row items-center gap-x-2 p-4 w-full">
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
                @{user.username}
            </span>
        </div>

    )
}

export default Header
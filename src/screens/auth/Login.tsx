import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "@/store/useAuthStore";

type LoginValues = { username: string; password: string };

const LoginPage = () => {
    const navigate = useNavigate();
    const { user, login: onSubmit } = useAuthStore();

    useEffect(() => {
        if (user && (user.user_type === "player" || user.user_type === "guest" || user.user_type === "admin")) navigate("/game/view-levels");
        
    }, [user, navigate]);

    const [values, setValues] = useState<LoginValues>({ username: "", password: "" });
    const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
        username: false,
        password: false,
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // NEW: local error state
    const [error, setError] = useState<string | null>(null);

    const errors = {
        username: !values.username.trim() ? "Username is required" : "",
        password: !values.password ? "Password is required" : "",
    };
    const isValid = !errors.username && !errors.password;

    const handleChange =
        (field: keyof LoginValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setValues((v) => ({ ...v, [field]: e.target.value }));
            if (error) setError(null); // clear error as user edits
        };

    const handleBlur = (field: keyof LoginValues) => () =>
        setTouched((t) => ({ ...t, [field]: true }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ username: true, password: true });
        if (!isValid) return;

        try {
            setLoading(true);
            setError(null); // clear any old error
            const response = await onSubmit?.(values);
            console.log("login response", response);
            // navigation is handled by the useEffect after user is set
        } catch (err: any) {
            // axios/Zustand throws with message from server (response.message)
            setError(err?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 sm:p-8">
                    <div className="mb-6 text-center">
                        <div className="place-items-center grid bg-white/10 mx-auto rounded-xl w-12 h-12">
                            <span className="font-bold text-white text-2xl">🔒</span>
                        </div>
                        <h1 className="mt-4 font-semibold text-white text-2xl sm:text-3xl">Sign in</h1>
                        <p className="mt-1 text-slate-300 text-sm">
                            Welcome back! Please enter your details.
                        </p>
                    </div>

                    {/* NEW: error banner */}
                    {error && (
                        <div
                            role="alert"
                            className="bg-rose-500/10 mb-4 px-4 py-2 border border-rose-400/40 rounded-xl text-rose-200 text-sm"
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Username */}
                        <label htmlFor="username" className="block font-medium text-slate-200 text-sm">
                            Username
                        </label>
                        <div className="mt-1">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={values.username}
                                onChange={handleChange("username")}
                                onBlur={handleBlur("username")}
                                required
                                aria-invalid={!!(touched.username && errors.username)}
                                aria-describedby="username-error"
                                className="bg-white/5 px-4 py-2.5 border border-white/10 focus:border-indigo-400 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300/40 w-full text-white transition placeholder-slate-400"
                                placeholder="Enter your username"
                                autoComplete="username"
                            />
                            {touched.username && errors.username && (
                                <p id="username-error" role="alert" className="mt-1 text-rose-300 text-xs">
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <label htmlFor="password" className="block mt-4 font-medium text-slate-200 text-sm">
                            Password
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="password"
                                name="password"
                                type={showPw ? "text" : "password"}
                                value={values.password}
                                onChange={handleChange("password")}
                                onBlur={handleBlur("password")}
                                required
                                aria-invalid={!!(touched.password && errors.password)}
                                aria-describedby="password-error"
                                className="bg-white/5 px-4 py-2.5 pr-12 border border-white/10 focus:border-indigo-400 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300/40 w-full text-white transition placeholder-slate-400"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((s) => !s)}
                                className="top-1/2 right-2 absolute hover:bg-white/10 px-2 py-1 rounded-lg text-slate-300 hover:text-white text-sm transition -translate-y-1/2"
                                aria-label={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? "Hide" : "Show"}
                            </button>
                            {touched.password && errors.password && (
                                <p id="password-error" role="alert" className="mt-1 text-rose-300 text-xs">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center mt-6">
                            <label className="inline-flex items-center gap-2 text-slate-300 text-sm">
                                <input
                                    type="checkbox"
                                    className="bg-white/5 border-white/20 rounded focus:ring-indigo-300/40 w-4 h-4 text-indigo-400"
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                className="text-indigo-300 hover:text-white text-sm underline underline-offset-4"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!isValid || loading}
                            className={[
                                "mt-6 w-full inline-flex items-center justify-center",
                                "rounded-xl bg-indigo-500 hover:bg-indigo-400",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "text-white font-semibold px-4 py-2.5",
                                "shadow-lg shadow-indigo-500/20 transition",
                            ].join(" ")}
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>
                </div>

                <div className="bg-white/5 px-6 sm:px-8 py-4">
                    <p className="text-slate-300 text-sm text-center">
                        Don’t have an account?{" "}
                        <Link className="font-medium text-white hover:underline underline-offset-4" to="/signup">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

import { useState } from "react";
import { Link } from "react-router";

type SignUpValues = {
    username: string;
    password: string;
    confirm: string;
    agree: boolean;
};

const SignUpPage = () => {

    const onSubmit = async (values: Omit<SignUpValues, "confirm">) => {
        // Simulate an async operation like an API call
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log("User signed up:", values);
                resolve();
            }, 1000);
        });
    };

    const [values, setValues] = useState<SignUpValues>({
        username: "",
        password: "",
        confirm: "",
        agree: false,
    });
    const [touched, setTouched] = useState<Record<keyof SignUpValues, boolean>>({
        username: false,
        password: false,
        confirm: false,
        agree: false,
    });
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [loading, setLoading] = useState(false);

    const pwMatch = values.password.length > 0 && values.password === values.confirm;
    const errors = {
        username: !values.username.trim() ? "Username is required" : "",
        password: !values.password ? "Password is required" : "",
        confirm: !values.confirm
            ? "Confirm your password"
            : !pwMatch
                ? "Passwords do not match"
                : "",
        agree: !values.agree ? "You must agree to the Terms" : "",
    };
    const isValid =
        !errors.username &&
        !errors.password &&
        !errors.confirm &&
        !errors.agree;

    const handleChange =
        (field: keyof SignUpValues) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.target.type === "checkbox" ? (e.target as any).checked : e.target.value;
                setValues((s) => ({ ...s, [field]: v }));
            };

    const handleBlur = (field: keyof SignUpValues) => () =>
        setTouched((t) => ({ ...t, [field]: true }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({
            username: true,
            password: true,
            confirm: true,
            agree: true,
        });
        if (!isValid) return;
        try {
            setLoading(true);
            await onSubmit?.({
                username: values.username.trim(),
                password: values.password,
                agree: values.agree,
            });
            // navigate on success, e.g. router.push("/welcome")
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
                            <span className="font-bold text-white text-2xl">📝</span>
                        </div>
                        <h1 className="mt-4 font-semibold text-white text-2xl sm:text-3xl">
                            Create your account
                        </h1>
                        <p className="mt-1 text-slate-300 text-sm">
                            It only takes a minute.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Username */}
                        <label htmlFor="username" className="block font-medium text-slate-200 text-sm">
                            Username
                        </label>
                        <div className="mt-1">
                            <input
                                id="username"
                                type="text"
                                value={values.username}
                                onChange={handleChange("username")}
                                onBlur={handleBlur("username")}
                                required
                                aria-invalid={!!(touched.username && errors.username)}
                                aria-describedby="username-error"
                                className="bg-white/5 px-4 py-2.5 border border-white/10 focus:border-indigo-400 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300/40 w-full text-white transition placeholder-slate-400"
                                placeholder="e.g. ramy_az"
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
                                type={showPw ? "text" : "password"}
                                value={values.password}
                                onChange={handleChange("password")}
                                onBlur={handleBlur("password")}
                                required
                                aria-invalid={!!(touched.password && errors.password)}
                                aria-describedby="password-error"
                                className="bg-white/5 px-4 py-2.5 pr-12 border border-white/10 focus:border-indigo-400 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300/40 w-full text-white transition placeholder-slate-400"
                                placeholder="••••••••"
                                autoComplete="new-password"
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

                        {/* Confirm Password */}
                        <label htmlFor="confirm" className="block mt-4 font-medium text-slate-200 text-sm">
                            Confirm password
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="confirm"
                                type={showPw2 ? "text" : "password"}
                                value={values.confirm}
                                onChange={handleChange("confirm")}
                                onBlur={handleBlur("confirm")}
                                required
                                aria-invalid={!!(touched.confirm && errors.confirm)}
                                aria-describedby="confirm-error"
                                className="bg-white/5 px-4 py-2.5 pr-12 border border-white/10 focus:border-indigo-400 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300/40 w-full text-white transition placeholder-slate-400"
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw2((s) => !s)}
                                className="top-1/2 right-2 absolute hover:bg-white/10 px-2 py-1 rounded-lg text-slate-300 hover:text-white text-sm transition -translate-y-1/2"
                                aria-label={showPw2 ? "Hide password" : "Show password"}
                            >
                                {showPw2 ? "Hide" : "Show"}
                            </button>
                            {touched.confirm && errors.confirm && (
                                <p id="confirm-error" role="alert" className="mt-1 text-rose-300 text-xs">
                                    {errors.confirm}
                                </p>
                            )}
                        </div>

                        {/* Terms */}
                        <label className="inline-flex items-center gap-2 mt-4 text-slate-300 text-sm">
                            <input
                                type="checkbox"
                                checked={values.agree}
                                onChange={handleChange("agree")}
                                onBlur={handleBlur("agree")}
                                required
                                aria-invalid={!!(touched.agree && errors.agree)}
                                className="bg-white/5 border-white/20 rounded focus:ring-indigo-300/40 w-4 h-4 text-indigo-400"
                            />
                            I agree to the{" "}
                            <a className="text-indigo-300 hover:text-white underline underline-offset-4" href="#">
                                Terms & Privacy
                            </a>
                        </label>
                        {touched.agree && errors.agree && (
                            <p role="alert" className="mt-1 text-rose-300 text-xs">
                                {errors.agree}
                            </p>
                        )}

                        {/* Submit */}
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
                            {loading ? "Creating account…" : "Create account"}
                        </button>
                    </form>
                </div>

                <div className="bg-white/5 px-6 sm:px-8 py-4">
                    <p className="text-slate-300 text-sm text-center">
                        Already have an account?{" "}
                        <Link className="font-medium text-white hover:underline underline-offset-4" to="/signin">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { buildApiUrl } from "../lib/apiUrl";
import { ADMIN_PATH } from "../lib/adminPath";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState("secret");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [secretPhrase, setSecretPhrase] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(event) {
        event.preventDefault();

        if (mode === "secret") {
            if (!secretPhrase.trim()) return alert("Enter your secret phrase.");
        } else if (!username || !password) {
            return alert("Enter username and password.");
        }

        try {
            setLoading(true);

            const body =
                mode === "secret"
                    ? { secretPhrase }
                    : { username, password };

            const response = await fetch(buildApiUrl("/api/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) return alert(payload?.message || "Login failed.");

            localStorage.setItem("token", payload.token);
            localStorage.setItem("user", JSON.stringify(payload.user));

            const requestedNext = new URLSearchParams(window.location.search).get("next");
            const next = requestedNext || (payload?.user?.role === "admin" ? ADMIN_PATH : "/dashboard");
            router.push(next);
        } catch {
            alert("Network error");
        } finally {
            setLoading(false);
        }
    }

    const fieldClass = "input border-[#303745] bg-[#0c1016]";

    return (
        <main className="relative min-h-screen overflow-y-auto px-4 py-8 sm:py-10">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/register-background.webp')" }}
            />
            <div className="absolute inset-0 bg-[rgba(4,6,10,.74)]" />

            <div className="relative z-10 grid min-h-[calc(100vh-4rem)] place-items-center sm:min-h-[calc(100vh-5rem)]">
                <div className="mx-auto w-full max-w-md">
                    <Link href="/" className="mx-auto mb-6 flex w-fit items-center text-sm text-[var(--gold)]">
                        <img src="/assets/svgs/logo.svg?v=btc-shield-1" alt="Logo" className="h-12 w-12" />
                    </Link>

                    <div className="site-card bg-[#0f1218] p-5 sm:p-6">
                        <h1 className="text-3xl font-semibold text-[#f3f4f6]">Sign in</h1>
                        <p className="mt-2 text-sm text-[var(--muted)]">Access your crypto safe.</p>

                        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
                            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#2e3645] bg-[#0b0f16] p-1 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setMode("secret")}
                                    className={`rounded-md px-3 py-2 transition ${
                                        mode === "secret"
                                            ? "bg-[var(--gold)] text-[#16120a]"
                                            : "text-[#c7d0de] hover:bg-white/[0.05]"
                                    }`}
                                >
                                    12-Word Phrase
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("password")}
                                    className={`rounded-md px-3 py-2 transition ${
                                        mode === "password"
                                            ? "bg-[var(--gold)] text-[#16120a]"
                                            : "text-[#c7d0de] hover:bg-white/[0.05]"
                                    }`}
                                >
                                    Username
                                </button>
                            </div>

                            {mode === "secret" ? (
                                <label className="block">
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Secret phrase</span>
                                    <input
                                        value={secretPhrase}
                                        onChange={(e) => setSecretPhrase(e.target.value)}
                                        placeholder="Enter your 12-word secret phrase"
                                        className={fieldClass}
                                    />
                                </label>
                            ) : (
                                <>
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs text-[var(--muted)]">Username</span>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter username"
                                            className={fieldClass}
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-1.5 block text-xs text-[var(--muted)]">Password</span>
                                        <span className="relative block">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter password"
                                                className={`${fieldClass} pr-12`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </span>
                                    </label>
                                </>
                            )}

                            <button type="submit" disabled={loading} className="btn-gold mt-1 w-full justify-center">
                                {loading ? "Signing in..." : "Sign in"}
                            </button>

                            <a href="/register" className="text-center text-sm text-[var(--muted)] hover:text-[#eef1f6]">
                                No account yet? <span className="text-[var(--gold)]">Create one</span>
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

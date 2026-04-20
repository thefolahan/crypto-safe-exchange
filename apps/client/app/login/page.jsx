"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (!username || !password) return alert("Enter username and password.");

        try {
            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data?.message || "Login failed.");

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
            router.push(next);
        } catch (err) {
            alert("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/register-background.webp')" }}
            />
            <div className="absolute inset-0 bg-[rgba(6,12,24,0.72)]" />

            <div className="relative z-10 grid min-h-screen place-items-center px-4 py-10 sm:py-14">
                <div className="mx-auto w-full max-w-md">
                    <div className="rounded-2xl border border-white/10 bg-[rgba(15,26,46,.92)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.55)] sm:p-7">
                        <h1 className="text-center text-2xl font-black tracking-tight text-white sm:text-3xl">
                            Sign in
                        </h1>

                        <form onSubmit={onSubmit} className="mt-5 grid gap-3.5">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaUser />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaLock />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-1 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(47,107,255,.95)] to-[rgba(32,211,255,.75)] px-4 py-3.5 font-extrabold text-white transition hover:from-[rgba(47,107,255,1)] hover:to-[rgba(32,211,255,.85)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? "Signing in..." : "Login"}
                            </button>

                            <a
                                href="/register"
                                className="mt-1 text-center font-extrabold text-white/85 hover:text-white hover:underline"
                            >
                                Don’t have an account? Register
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}

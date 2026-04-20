"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_PATH } from "../app/lib/adminPath";

const navItems = [
    { id: "about", label: "About" },
    { id: "pricing", label: "Pricing" },
    { id: "contact", label: "Contact" },
];

function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function readStoredUser() {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

export default function Navbar() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [token, setToken] = useState(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("token") || "";
    });
    const [authUser, setAuthUser] = useState(() => readStoredUser());

    useEffect(() => {
        const read = () => {
            setToken(localStorage.getItem("token") || "");
            setAuthUser(readStoredUser());
        };

        read();
        window.addEventListener("storage", read);
        window.addEventListener("focus", read);
        return () => {
            window.removeEventListener("storage", read);
            window.removeEventListener("focus", read);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    function onLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken("");
        setAuthUser(null);
        setOpen(false);
        router.push("/");
    }

    return (
        <header className="sticky top-0 z-50 border-b border-[#1e232d] bg-[rgba(8,9,12,.88)] backdrop-blur-xl">
            <div className="site-container flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
                <a href="/" className="flex items-center gap-2.5" aria-label="Crypto Safe Exchange Home">
                    <img src="/assets/svgs/logo.svg?v=btc-shield-1" alt="Logo" className="h-10 w-10 sm:h-11 sm:w-11" />
                </a>

                <nav className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollTo(item.id)}
                            className="rounded-full px-3 py-1.5 text-sm font-medium text-[#d9dbe0] transition hover:bg-white/[0.04] hover:text-white"
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    {token ? (
                        <>
                            <a href="/dashboard" className="btn-dark h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm">
                                Dashboard
                            </a>
                            {authUser?.role === "admin" ? (
                                <a href={ADMIN_PATH} className="btn-dark h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm">
                                    Admin
                                </a>
                            ) : null}
                            <button type="button" onClick={onLogout} className="btn-gold h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="/register" className="btn-gold text-sm">
                                Get Started
                            </a>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#262c37] text-[#e6e9ee] md:hidden"
                    aria-label="Open menu"
                >
                    {open ? "✕" : "☰"}
                </button>
            </div>

            {open ? (
                <div className="border-t border-[#1e232d] bg-[#0a0c10] md:hidden">
                    <div className="site-container py-3">
                        <div className="grid gap-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        scrollTo(item.id);
                                    }}
                                    className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#d9dbe0] hover:bg-white/[0.04]"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 grid gap-2">
                            {token ? (
                                <>
                                    <a href="/dashboard" className="btn-dark h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm" onClick={() => setOpen(false)}>
                                        Dashboard
                                    </a>
                                    {authUser?.role === "admin" ? (
                                        <a href={ADMIN_PATH} className="btn-dark h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm" onClick={() => setOpen(false)}>
                                            Admin
                                        </a>
                                    ) : null}
                                    <button type="button" onClick={onLogout} className="btn-gold h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a href="/register" className="btn-gold text-sm" onClick={() => setOpen(false)}>
                                        Get Started
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}

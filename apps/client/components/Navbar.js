"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ADMIN_PATH } from "../app/lib/adminPath";

const navItems = [
    { id: "features", label: "Safe" },
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

function isAdminOnMainPage(nextToken, nextUser) {
    if (typeof window === "undefined") return false;
    return Boolean(nextToken) && nextUser?.role === "admin" && window.location.pathname === "/";
}

export default function Navbar() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [token, setToken] = useState(() => {
        if (typeof window === "undefined") return "";
        const nextToken = localStorage.getItem("token") || "";
        const nextUser = readStoredUser();
        if (isAdminOnMainPage(nextToken, nextUser)) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return "";
        }
        return nextToken;
    });
    const [authUser, setAuthUser] = useState(() => {
        const nextUser = readStoredUser();
        const nextToken = typeof window === "undefined" ? "" : localStorage.getItem("token") || "";
        return isAdminOnMainPage(nextToken, nextUser) ? null : nextUser;
    });
    const isAdmin = authUser?.role === "admin";

    function clearSessionState() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken("");
        setAuthUser(null);
    }

    useEffect(() => {
        const read = () => {
            const nextToken = localStorage.getItem("token") || "";
            const nextUser = readStoredUser();

            if (isAdminOnMainPage(nextToken, nextUser)) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setToken("");
                setAuthUser(null);
                return;
            }

            setToken(nextToken);
            setAuthUser(nextUser);
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") read();
        };

        read();
        window.addEventListener("storage", read);
        window.addEventListener("focus", read);
        window.addEventListener("pageshow", read);
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            window.removeEventListener("storage", read);
            window.removeEventListener("focus", read);
            window.removeEventListener("pageshow", read);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    function onLogout() {
        clearSessionState();
        setOpen(false);
        router.push("/");
    }

    return (
        <header className="sticky top-0 z-50 border-b border-[#1e232d] bg-[rgba(8,9,12,.88)] backdrop-blur-xl">
            <div className="site-container flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
                <Link href="/" className="flex items-center gap-2.5" aria-label="Crypto Safe Home">
                    <img src="/assets/svgs/logo.svg?v=btc-shield-1" alt="Logo" className="h-10 w-10 sm:h-11 sm:w-11" />
                </Link>

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
                            <a
                                href={isAdmin ? ADMIN_PATH : "/dashboard"}
                                className="btn-dark h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm"
                            >
                                {isAdmin ? "Admin" : "Dashboard"}
                            </a>
                            <button type="button" onClick={onLogout} className="btn-gold h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="/register" className="btn-gold text-sm">
                                Create Safe
                            </a>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#262c37] text-[#e6e9ee] transition-colors duration-200 hover:bg-white/[0.03] md:hidden"
                    aria-label={open ? "Close menu" : "Open menu"}
                >
                    <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                    <span
                        className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-all duration-200 ease-out ${
                            open ? "translate-y-0 rotate-[18deg]" : "-translate-y-[5px] rotate-0"
                        }`}
                    />
                    <span
                        className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-all duration-200 ease-out ${
                            open ? "scale-x-80 opacity-0" : "scale-x-100 opacity-100"
                        }`}
                    />
                    <span
                        className={`absolute h-[1.5px] w-5 rounded-full bg-current transition-all duration-200 ease-out ${
                            open ? "translate-y-0 -rotate-[18deg]" : "translate-y-[5px] rotate-0"
                        }`}
                    />
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
                                    <a
                                        href={isAdmin ? ADMIN_PATH : "/dashboard"}
                                        className="btn-dark h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm"
                                        onClick={() => setOpen(false)}
                                    >
                                        {isAdmin ? "Admin" : "Dashboard"}
                                    </a>
                                    <button type="button" onClick={onLogout} className="btn-gold h-10 w-[116px] break-normal whitespace-nowrap px-0 text-xs leading-none sm:text-sm">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a href="/register" className="btn-gold text-sm" onClick={() => setOpen(false)}>
                                        Create Safe
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

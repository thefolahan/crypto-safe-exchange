"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function scrollToId(id, close) {
    close?.();
    setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
}

export default function Navbar() {
    const router = useRouter();

    const [mobileOpen, setMobileOpen] = useState(false);
    const panelRef = useRef(null);

    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const read = () => {
            const t = localStorage.getItem("token") || "";
            const u = localStorage.getItem("user");
            setToken(t);
            try {
                setUser(u ? JSON.parse(u) : null);
            } catch {
                setUser(null);
            }
        };

        read();
        window.addEventListener("storage", read);
        return () => window.removeEventListener("storage", read);
    }, []);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken("");
        setUser(null);
        setMobileOpen(false);
        router.push("/");
    }

    useEffect(() => {
        function onDoc(e) {
            if (!mobileOpen) return;
            if (!panelRef.current) return;
            if (!panelRef.current.contains(e.target)) setMobileOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [mobileOpen]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") setMobileOpen(false);
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => (document.body.style.overflow = "");
    }, [mobileOpen]);

    const closeMobile = () => setMobileOpen(false);

    return (
        <header className="navWrap">
            <div className="container navInner">
                <a className="logo" href="/" onClick={closeMobile} aria-label="Home">
                    <img src="/assets/svgs/logo.svg" alt="Logo" className="navLogo" />
                </a>

                <nav className="nav">
                    <a
                        className="navLink"
                        href="#products"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId("products", closeMobile);
                        }}
                    >
                        Products
                    </a>

                    <a
                        className="navLink"
                        href="#services"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId("services", closeMobile);
                        }}
                    >
                        Services
                    </a>

                    <a
                        className="navLink"
                        href="#footer"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId("footer", closeMobile);
                        }}
                    >
                        About Us
                    </a>
                </nav>

                <div className="navActions">
                    {!token ? (
                        <>
                            <a className="btn small ghost" href="/register">
                                Register
                            </a>
                            <a className="btn small primary" href="/login">
                                Login
                            </a>
                        </>
                    ) : (
                        <>
                            <a className="btn small ghost" href="/dashboard">
                                Dashboard
                            </a>
                            <button className="btn small primary" type="button" onClick={logout}>
                                Logout{user?.username ? ` (${user.username})` : ""}
                            </button>
                        </>
                    )}
                </div>

                <button
                    className="hamburger"
                    type="button"
                    aria-label="Open menu"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((v) => !v)}
                >
                    <span className={`hamLine ${mobileOpen ? "x1" : ""}`} />
                    <span className={`hamLine ${mobileOpen ? "x2" : ""}`} />
                    <span className={`hamLine ${mobileOpen ? "x3" : ""}`} />
                </button>
            </div>

            {mobileOpen && <div className="mOverlay" />}

            <div className={`mPanel ${mobileOpen ? "open" : ""}`}>
                <div className="mPanelInner" ref={panelRef}>
                    <div className="mTopRow">
                        <div className="mTitle">Menu</div>
                        <button className="mClose" type="button" onClick={closeMobile} aria-label="Close menu">
                            ✕
                        </button>
                    </div>

                    <div className="mNav">
                        <a
                            className="mItem"
                            href="#products"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToId("products", closeMobile);
                            }}
                        >
                            Products
                        </a>

                        <a
                            className="mItem"
                            href="#services"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToId("services", closeMobile);
                            }}
                        >
                            Services
                        </a>

                        <a
                            className="mItem"
                            href="#footer"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToId("footer", closeMobile);
                            }}
                        >
                            About Us
                        </a>

                        <div className="mActions">
                            {!token ? (
                                <>
                                    <a className="btn full ghost" href="/register" onClick={closeMobile}>
                                        Register
                                    </a>
                                    <a className="btn full primary" href="/login" onClick={closeMobile}>
                                        Login
                                    </a>
                                </>
                            ) : (
                                <>
                                    <a className="btn full ghost" href="/dashboard" onClick={closeMobile}>
                                        Dashboard
                                    </a>
                                    <button className="btn full primary" type="button" onClick={logout}>
                                        Logout{user?.username ? ` (${user.username})` : ""}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

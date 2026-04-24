"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { buildApiUrl } from "../lib/apiUrl";
import { ADMIN_PATH } from "../lib/adminPath";

const WITHDRAW_UNLOCK_BTC_PRICE = 250000;
const REFRESH_MS = 12 * 60 * 60 * 1000;

function normalizePlanCode(value) {
    return String(value || "").trim().toLowerCase();
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

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
}

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
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

function toPlanPayload(plan) {
    return {
        code: normalizePlanCode(plan?.code),
        name: String(plan?.name || "").trim(),
        feeUsd: Number(plan?.feeUsd || 0),
        capacity: String(plan?.capacity || "").trim(),
        support: String(plan?.support || "").trim(),
        status: String(plan?.status || "none"),
        selectedAt: plan?.selectedAt || null,
        activatedAt: plan?.activatedAt || null,
    };
}

function toDepositPayload(deposit) {
    return {
        id: String(deposit?.id || ""),
        kind: String(deposit?.kind || "wallet_deposit"),
        amountUsd: Number(deposit?.amountUsd || 0),
        creditedAmountUsd: Number(deposit?.creditedAmountUsd || 0),
        txReference: String(deposit?.txReference || ""),
        planCode: normalizePlanCode(deposit?.planCode),
        planName: String(deposit?.planName || "").trim(),
        status: String(deposit?.status || "pending"),
        createdAt: deposit?.createdAt || null,
    };
}

function planStatusLabel(status) {
    if (status === "active") return "Active";
    if (status === "awaiting_verification") return "Awaiting admin verification";
    if (status === "awaiting_payment") return "Awaiting payment";
    return "No plan selected";
}

function arePlansEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i += 1) {
        const one = a[i] || {};
        const two = b[i] || {};
        if (
            String(one.code || "") !== String(two.code || "") ||
            String(one.name || "") !== String(two.name || "") ||
            Number(one.feeUsd || 0) !== Number(two.feeUsd || 0) ||
            String(one.capacity || "") !== String(two.capacity || "") ||
            String(one.support || "") !== String(two.support || "")
        ) {
            return false;
        }
    }

    return true;
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
    const searchParams = useSearchParams();
    const planFromQuery = normalizePlanCode(searchParams.get("plan"));

    const [user, setUser] = useState(() => readStoredUser());
    const [settings, setSettings] = useState({ btcWalletAddress: "", plans: [] });
    const [deposits, setDeposits] = useState([]);
    const [btcPrice, setBtcPrice] = useState(null);
    const [btcTs, setBtcTs] = useState(null);
    const [priceError, setPriceError] = useState("");
    const [activeModal, setActiveModal] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [actionBusy, setActionBusy] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [depositPlanCode, setDepositPlanCode] = useState("");
    const [depositTxReference, setDepositTxReference] = useState("");
    const [planTxReference, setPlanTxReference] = useState("");

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
            } catch {
                if (!cancelled) setPriceError("Could not load BTC price.");
            }
        }

        loadPrice();
        const timer = setInterval(loadPrice, REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadAccount() {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }

            setLoadingAccount(true);
            setError("");

            try {
                const [meResponse, settingsResponse, depositsResponse] = await Promise.all([
                    fetch(buildApiUrl("/api/auth/me"), {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(buildApiUrl("/api/settings/public")),
                    fetch(buildApiUrl("/api/deposits/me"), {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                const [mePayload, settingsPayload, depositsPayload] = await Promise.all([
                    meResponse.json().catch(() => ({})),
                    settingsResponse.json().catch(() => ({})),
                    depositsResponse.json().catch(() => ({})),
                ]);

                if (meResponse.status === 401 || depositsResponse.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.replace("/login");
                    return;
                }

                if (!meResponse.ok) {
                    if (!cancelled) setError(mePayload?.message || "Could not load your dashboard.");
                    return;
                }

                if (!settingsResponse.ok) {
                    if (!cancelled) setError(settingsPayload?.message || "Could not load wallet settings.");
                    return;
                }

                if (!depositsResponse.ok) {
                    if (!cancelled) setError(depositsPayload?.message || "Could not load deposits.");
                    return;
                }

                const nextUser = mePayload?.user || null;
                const nextPlans = Array.isArray(settingsPayload?.plans)
                    ? settingsPayload.plans.map(toPlanPayload)
                    : [];
                const nextDeposits = Array.isArray(depositsPayload?.deposits)
                    ? depositsPayload.deposits.map(toDepositPayload)
                    : [];

                if (!cancelled) {
                    if (nextUser) {
                        setUser(nextUser);
                        localStorage.setItem("user", JSON.stringify(nextUser));
                    }
                    setSettings({
                        btcWalletAddress: String(settingsPayload?.btcWalletAddress || "").trim(),
                        plans: nextPlans,
                    });
                    setDeposits(nextDeposits);
                }
            } catch {
                if (!cancelled) setError("Network error. Could not load your dashboard.");
            } finally {
                if (!cancelled) setLoadingAccount(false);
            }
        }

        loadAccount();

        return () => {
            cancelled = true;
        };
    }, [router, refreshKey]);

    useEffect(() => {
        if (!planFromQuery || !user?.id) return;

        let cancelled = false;

        async function applyPlanFromQuery() {
            const token = localStorage.getItem("token") || "";
            if (!token) return;
            let shouldStripQuery = true;

            try {
                setError("");
                const response = await fetch(buildApiUrl("/api/auth/plan"), {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ planCode: planFromQuery }),
                });

                const payload = await response.json().catch(() => ({}));

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    shouldStripQuery = false;
                    router.replace("/login");
                    return;
                }

                if (!response.ok) {
                    if (!cancelled) setError(payload?.message || "Could not apply selected plan.");
                    return;
                }

                if (!cancelled) {
                    const nextUser = payload?.user || null;
                    if (nextUser) {
                        setUser(nextUser);
                        localStorage.setItem("user", JSON.stringify(nextUser));
                    }
                    setMessage(payload?.message || "Plan selected.");
                    setActiveModal("deposit");
                    setRefreshKey((value) => value + 1);
                }
            } catch {
                if (!cancelled) setError("Network error. Could not apply selected plan.");
            } finally {
                if (shouldStripQuery) {
                    router.replace("/dashboard");
                }
            }
        }

        applyPlanFromQuery();

        return () => {
            cancelled = true;
        };
    }, [planFromQuery, router, user?.id]);

    useEffect(() => {
        if (activeModal !== "deposit") return;

        let cancelled = false;

        async function refreshSettingsWhileOpen() {
            try {
                const response = await fetch(buildApiUrl("/api/settings/public"), { cache: "no-store" });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || cancelled) return;

                const nextWalletAddress = String(payload?.btcWalletAddress || "").trim();
                const nextPlans = Array.isArray(payload?.plans) ? payload.plans.map(toPlanPayload) : [];

                if (cancelled) return;
                setSettings((prev) => {
                    const walletChanged = nextWalletAddress && nextWalletAddress !== prev.btcWalletAddress;
                    const plansChanged = nextPlans.length ? !arePlansEqual(prev.plans, nextPlans) : false;

                    if (!walletChanged && !plansChanged) return prev;
                    return {
                        btcWalletAddress: nextWalletAddress || prev.btcWalletAddress,
                        plans: nextPlans.length ? nextPlans : prev.plans,
                    };
                });
            } catch {
            }
        }

        refreshSettingsWhileOpen();
        const id = setInterval(refreshSettingsWhileOpen, 10000);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [activeModal]);

    const portfolioUsd = Number(user?.portfolioUsd || 0);
    const btcHoldings = useMemo(() => {
        if (!Number.isFinite(btcPrice) || btcPrice <= 0) return 0;
        return portfolioUsd / btcPrice;
    }, [portfolioUsd, btcPrice]);

    const selectedPlan = useMemo(() => {
        const userPlan = toPlanPayload(user?.selectedPlan || null);
        if (!userPlan.code) return null;

        const planFromSettings = settings.plans.find((plan) => plan.code === userPlan.code);
        if (!planFromSettings) return userPlan;

        return {
            ...planFromSettings,
            status: userPlan.status,
            selectedAt: userPlan.selectedAt,
            activatedAt: userPlan.activatedAt,
        };
    }, [settings.plans, user?.selectedPlan]);

    const planRequiresPayment = Boolean(
        selectedPlan && selectedPlan.feeUsd > 0 && selectedPlan.status !== "active"
    );

    const planCodes = settings.plans.map((plan) => plan.code).filter(Boolean);
    const resolvedDepositPlanCode = !planCodes.length
        ? ""
        : depositPlanCode && planCodes.includes(depositPlanCode)
            ? depositPlanCode
            : selectedPlan?.code && planCodes.includes(selectedPlan.code)
                ? selectedPlan.code
                : planCodes[0];

    const selectedDepositPlan = settings.plans.find((plan) => plan.code === resolvedDepositPlanCode) || null;

    const pendingDeposits = useMemo(
        () => deposits.filter((deposit) => deposit.status === "pending"),
        [deposits]
    );

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

    async function copyWalletAddress() {
        if (!settings.btcWalletAddress) return;
        try {
            await navigator.clipboard.writeText(settings.btcWalletAddress);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1400);
        } catch {
            setError("Could not copy wallet address.");
        }
    }

    async function selectPlanForDeposit(planCode, token) {
        const normalizedPlanCode = normalizePlanCode(planCode);
        if (!normalizedPlanCode) {
            return { ok: false, message: "Please select a pricing plan." };
        }

        const response = await fetch(buildApiUrl("/api/auth/plan"), {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ planCode: normalizedPlanCode }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { ok: false, message: payload?.message || "Could not select plan for deposit." };
        }

        const nextUser = payload?.user || null;
        if (nextUser) {
            setUser(nextUser);
            localStorage.setItem("user", JSON.stringify(nextUser));
        }

        const planFromResponse = toPlanPayload(payload?.plan || null);
        return {
            ok: true,
            feeUsd: Number(planFromResponse.feeUsd || 0),
        };
    }

    async function submitWalletDeposit() {
        const token = localStorage.getItem("token") || "";
        if (!token) {
            logout();
            return;
        }

        try {
            setActionBusy(true);
            setError("");
            setMessage("");

            const planSelection = await selectPlanForDeposit(resolvedDepositPlanCode, token);
            if (!planSelection.ok) {
                setError(planSelection.message);
                return;
            }

            if (!Number.isFinite(planSelection.feeUsd) || planSelection.feeUsd <= 0) {
                setMessage("Selected plan does not require a deposit. Plan has been activated.");
                setDepositTxReference("");
                setActiveModal(null);
                setRefreshKey((value) => value + 1);
                return;
            }

            const response = await fetch(buildApiUrl("/api/deposits"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    kind: "plan_payment",
                    txReference: depositTxReference,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.message || "Could not submit deposit.");
                return;
            }

            setMessage(payload?.message || "Deposit submitted for verification.");
            setDepositTxReference("");
            setActiveModal(null);
            setRefreshKey((value) => value + 1);
        } catch {
            setError("Network error. Could not submit deposit.");
        } finally {
            setActionBusy(false);
        }
    }

    async function submitPlanPayment() {
        const token = localStorage.getItem("token") || "";
        if (!token) {
            logout();
            return;
        }

        if (!selectedPlan?.code) {
            setError("Select a plan first.");
            return;
        }

        try {
            setActionBusy(true);
            setError("");
            setMessage("");

            const planSelection = await selectPlanForDeposit(selectedPlan.code, token);
            if (!planSelection.ok) {
                setError(planSelection.message);
                return;
            }

            if (!Number.isFinite(planSelection.feeUsd) || planSelection.feeUsd <= 0) {
                setMessage("Selected plan does not require a deposit. Plan has been activated.");
                setPlanTxReference("");
                setActiveModal(null);
                setRefreshKey((value) => value + 1);
                return;
            }

            const response = await fetch(buildApiUrl("/api/deposits"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    kind: "plan_payment",
                    txReference: planTxReference,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.message || "Could not submit plan payment.");
                return;
            }

            setMessage(payload?.message || "Plan payment submitted for verification.");
            setPlanTxReference("");
            setActiveModal(null);
            setRefreshKey((value) => value + 1);
        } catch {
            setError("Network error. Could not submit plan payment.");
        } finally {
            setActionBusy(false);
        }
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
                                <div className="grid h-full w-full place-items-center text-[#061023]">
                                    <FaUserCircle className="h-14 w-14 sm:h-16 sm:w-16" aria-hidden="true" />
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
                                    <span className="rounded-full border border-[#333d4e] bg-[#171f2b] px-3 py-1">
                                        BTC: <span className="font-black text-[var(--text)]">{btcPrice ? formatUSD(btcPrice) : "Loading…"}</span>
                                    </span>
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
                            {String(user.role || "user") === "admin" ? (
                                <a
                                    href={ADMIN_PATH}
                                    className="group inline-flex h-10 items-center justify-center rounded-xl border border-[#323b4a] bg-[#151b24] px-3 text-sm font-extrabold text-[var(--text)] shadow-[0_12px_26px_rgba(0,0,0,.3)] transition hover:-translate-y-[1px] hover:bg-[#1b2430]"
                                >
                                    Admin
                                </a>
                            ) : null}
                            <IconBtn title="Logout" onClick={logout}>
                                Logout
                            </IconBtn>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#2f3948] pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {btcTs ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#333d4f] bg-[#171f2b] px-3 py-1 text-xs font-bold text-[#dde1e8]">
                                    Updated: <span className="font-black text-[var(--text)]">{formatDate(btcTs)}</span>
                                </span>
                            ) : null}
                            {loadingAccount ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#333d4f] bg-[#171f2b] px-3 py-1 text-xs font-bold text-[#dde1e8]">
                                    Refreshing account…
                                </span>
                            ) : null}
                        </div>

                        <div className="inline-flex items-center rounded-full border border-[#333d4f] bg-[#171f2b] px-3 py-1 text-xs font-extrabold text-[#d8dfeb]">
                            Pending verification: {pendingDeposits.length}
                        </div>
                    </div>
                </div>

                {message ? (
                    <div className="mt-4 rounded-xl border border-[rgba(123,231,192,.35)] bg-[rgba(26,70,60,.32)] p-3 text-sm font-semibold text-[#b8ffe9]">
                        {message}
                    </div>
                ) : null}

                {error ? (
                    <div className="mt-4 rounded-xl border border-[#523634] bg-[rgba(88,40,38,.32)] p-3 text-sm font-semibold text-[#ffc9bc]">
                        {error}
                    </div>
                ) : null}

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.28fr_.82fr]">
                    <div className="rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                    Total Portfolio Value
                                </div>

                                <div className="mt-3 text-[clamp(2.2rem,4vw,3.25rem)] font-black leading-[1.05] tracking-tight text-[var(--text)]">
                                    {formatUSD(portfolioUsd)}
                                </div>

                                <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                    Only admin-verified deposits are reflected here.
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
                                    {btcPrice ? `${formatBTC(btcHoldings)} BTC` : "—"}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                    {btcPrice ? `1 BTC = ${formatUSD(btcPrice)}` : priceError || "Fetching price…"}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                        Active Plan
                                    </div>
                                    <img src="/assets/svgs/usd.svg" alt="USD" className="h-5 w-5 opacity-90" />
                                </div>
                                <div className="mt-2 text-lg font-black text-[var(--text)]">
                                    {selectedPlan?.name || "No plan selected"}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                    {planStatusLabel(selectedPlan?.status)}
                                </div>
                            </div>
                        </div>

                        {selectedPlan ? (
                            <div className="mt-4 rounded-2xl border border-[#323c4d] bg-[#161e2b] p-4">
                                <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                    Plan Details
                                </div>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-base font-black text-[var(--text)]">
                                            {selectedPlan.name}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                            Fee: {formatUSD(selectedPlan.feeUsd)} · {planStatusLabel(selectedPlan.status)}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setActiveModal("deposit")}
                                        className="inline-flex items-center justify-center rounded-lg border border-[rgba(221,192,138,.35)] bg-[var(--gold)] px-4 py-2 text-sm font-extrabold text-[#1c160c] transition hover:bg-[var(--gold-strong)]"
                                    >
                                        Open Deposit
                                    </button>
                                </div>

                                {planRequiresPayment ? (
                                    <div className="mt-3 text-sm font-semibold text-[#f7d9a1]">
                                        Send {formatUSD(selectedPlan.feeUsd)} to the dashboard wallet and click
                                        {" "}“I Have Paid for This Plan”.
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
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

                                <div className="mt-3 text-sm font-semibold text-[var(--muted)]">
                                    Current BTC:{" "}
                                    <span className="font-black text-[var(--text)]">
                                        {btcPrice ? formatUSD(btcPrice) : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                            <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Quick Actions
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

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Deposit History
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                Submitted deposits and verification state.
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-dark h-10 whitespace-nowrap px-4 text-sm"
                            onClick={() => setRefreshKey((value) => value + 1)}
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2f3949]">
                        <table className="min-w-[920px] w-full border-collapse">
                            <thead>
                                <tr className="bg-[#121a27] text-left text-xs uppercase tracking-[.08em] text-[var(--muted)]">
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Plan</th>
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.length ? (
                                    deposits.map((deposit) => (
                                        <tr
                                            key={deposit.id}
                                            className="border-t border-[#263142] text-sm text-[#e8edf6] hover:bg-[#131c2a]"
                                        >
                                            <td className="px-4 py-3">
                                                {deposit.kind === "plan_payment" ? "Plan payment" : "Wallet deposit"}
                                            </td>
                                            <td className="px-4 py-3">{formatUSD(deposit.amountUsd)}</td>
                                            <td className="px-4 py-3">{deposit.planName || "—"}</td>
                                            <td className="px-4 py-3">{deposit.txReference || "—"}</td>
                                            <td className="px-4 py-3 capitalize">{deposit.status}</td>
                                            <td className="px-4 py-3">{formatDate(deposit.createdAt)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-5 text-sm font-semibold text-[var(--muted)]" colSpan={6}>
                                            No deposits submitted yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Modal
                    open={activeModal === "deposit"}
                    title="Deposit"
                    subtitle="Send BTC to the wallet below, then submit for verification."
                    onClose={() => setActiveModal(null)}
                >
                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-[#323c4d] bg-[#141c28] p-4">
                            <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                BTC Wallet Address
                            </div>
                            <div className="mt-2 break-all rounded-xl border border-[#32405a] bg-[#111927] px-3 py-2 font-mono text-sm font-bold text-[var(--text)]">
                                {settings.btcWalletAddress || "Wallet not configured"}
                            </div>
                            <button
                                type="button"
                                onClick={copyWalletAddress}
                                className="mt-3 inline-flex items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735]"
                            >
                                {copySuccess ? "Copied" : "Copy Wallet"}
                            </button>
                        </div>

                        {planRequiresPayment ? (
                            <div className="rounded-2xl border border-[#323c4d] bg-[#141c28] p-4">
                                <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                    Plan Payment Required
                                </div>
                                <div className="mt-2 text-base font-black text-[var(--text)]">
                                    {selectedPlan.name}: {formatUSD(selectedPlan.feeUsd)}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                    Status: {planStatusLabel(selectedPlan.status)}
                                </div>

                                <label className="mt-3 block">
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">
                                        Transaction hash / reference (optional)
                                    </span>
                                    <input
                                        value={planTxReference}
                                        onChange={(event) => setPlanTxReference(event.target.value)}
                                        placeholder="Paste transaction hash"
                                        className="input border-[#303745] bg-[#0c1016]"
                                    />
                                </label>

                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[rgba(221,192,138,.35)] bg-[var(--gold)] px-4 py-2.5 text-sm font-extrabold text-[#1c160c] transition hover:bg-[var(--gold-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={submitPlanPayment}
                                    disabled={actionBusy}
                                >
                                    {actionBusy ? "Submitting..." : "I Have Paid for This Plan"}
                                </button>
                            </div>
                        ) : null}

                        <div className="rounded-2xl border border-[#323c4d] bg-[#141c28] p-4">
                            <div className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Wallet Deposit
                            </div>

                            <label className="mt-3 block">
                                <span className="mb-1.5 block text-xs text-[var(--muted)]">Select pricing plan</span>
                                <select
                                    value={resolvedDepositPlanCode}
                                    onChange={(event) => setDepositPlanCode(normalizePlanCode(event.target.value))}
                                    className="input border-[#303745] bg-[#0c1016]"
                                >
                                    {settings.plans.map((plan) => (
                                        <option key={plan.code} value={plan.code}>
                                            {plan.name} ({formatUSD(plan.feeUsd)})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                Deposit amount:{" "}
                                <span className="font-black text-[var(--text)]">
                                    {selectedDepositPlan ? formatUSD(selectedDepositPlan.feeUsd) : "—"}
                                </span>
                            </div>

                            <label className="mt-3 block">
                                <span className="mb-1.5 block text-xs text-[var(--muted)]">
                                    Transaction hash / reference (optional)
                                </span>
                                <input
                                    value={depositTxReference}
                                    onChange={(event) => setDepositTxReference(event.target.value)}
                                    placeholder="Paste transaction hash"
                                    className="input border-[#303745] bg-[#0c1016]"
                                />
                            </label>

                            <button
                                type="button"
                                className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[rgba(221,192,138,.35)] bg-[var(--gold)] px-4 py-2.5 text-sm font-extrabold text-[#1c160c] transition hover:bg-[var(--gold-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={submitWalletDeposit}
                                disabled={actionBusy || !resolvedDepositPlanCode}
                            >
                                {actionBusy ? "Submitting..." : "I Have Made Deposit"}
                            </button>
                        </div>

                        <div className="text-sm font-semibold text-[var(--muted)]">
                            Deposits reflect on your dashboard only after verification.
                        </div>
                    </div>
                </Modal>

                <Modal open={activeModal === "withdraw"} title="Withdraw" onClose={() => setActiveModal(null)}>
                    <div className="grid gap-3">
                        <div className="rounded-2xl border border-[#323c4d] bg-[#141c28] p-4">
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

                            <button
                                type="button"
                                className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#333d4f] bg-[#151d29] px-4 py-2.5 text-sm font-bold text-[#eef2f7] transition hover:bg-[#1d2735] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={!withdrawState.ok}
                            >
                                Request Withdrawal
                            </button>

                            <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
                                If locked, withdrawal opens automatically once BTC reaches the target.
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </main>
    );
}

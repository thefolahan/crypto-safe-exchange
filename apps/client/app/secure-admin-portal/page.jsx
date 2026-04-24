"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "../lib/apiUrl";
import { ADMIN_PATH } from "../lib/adminPath";

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
}

function formatUSD(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [savingSettings, setSavingSettings] = useState(false);
    const [activePortfolioSaveId, setActivePortfolioSaveId] = useState("");
    const [activeDepositActionId, setActiveDepositActionId] = useState("");

    const [usersData, setUsersData] = useState({
        users: [],
        counts: {
            totalUsers: 0,
            adminUsers: 0,
            regularUsers: 0,
        },
    });
    const [portfolioDrafts, setPortfolioDrafts] = useState({});

    const [settingsDraft, setSettingsDraft] = useState({
        btcWalletAddress: "",
        plans: [],
    });

    const [deposits, setDeposits] = useState([]);
    const [depositCreditDrafts, setDepositCreditDrafts] = useState({});
    const [depositAdminNotes, setDepositAdminNotes] = useState({});

    useEffect(() => {
        let cancelled = false;

        async function loadAdminData(isRefresh = false) {
            const token = localStorage.getItem("token") || "";
            if (!token) {
                router.replace(`/login?next=${encodeURIComponent(ADMIN_PATH)}`);
                return;
            }

            if (!isRefresh) setLoading(true);
            if (isRefresh) setRefreshing(true);
            setError("");

            const params = new URLSearchParams();
            params.set("limit", "250");
            if (searchQuery) params.set("search", searchQuery);

            try {
                const [usersResponse, settingsResponse, depositsResponse] = await Promise.all([
                    fetch(buildApiUrl(`/api/auth/admin/users?${params.toString()}`), {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(buildApiUrl("/api/settings/admin"), {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(buildApiUrl("/api/deposits/admin?status=pending"), {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                const [usersPayload, settingsPayload, depositsPayload] = await Promise.all([
                    usersResponse.json().catch(() => ({})),
                    settingsResponse.json().catch(() => ({})),
                    depositsResponse.json().catch(() => ({})),
                ]);

                if (
                    usersResponse.status === 401 ||
                    settingsResponse.status === 401 ||
                    depositsResponse.status === 401
                ) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.replace(`/login?next=${encodeURIComponent(ADMIN_PATH)}`);
                    return;
                }

                if (
                    usersResponse.status === 403 ||
                    settingsResponse.status === 403 ||
                    depositsResponse.status === 403
                ) {
                    router.replace("/dashboard");
                    return;
                }

                if (!usersResponse.ok || !settingsResponse.ok || !depositsResponse.ok) {
                    if (!cancelled) {
                        setError(
                            usersPayload?.message ||
                            settingsPayload?.message ||
                            depositsPayload?.message ||
                            "Could not load admin data."
                        );
                    }
                    return;
                }

                const users = Array.isArray(usersPayload?.users) ? usersPayload.users : [];
                const plans = Array.isArray(settingsPayload?.plans) ? settingsPayload.plans : [];
                const pendingDeposits = Array.isArray(depositsPayload?.deposits) ? depositsPayload.deposits : [];

                if (!cancelled) {
                    setUsersData({
                        users,
                        counts: usersPayload?.counts || {
                            totalUsers: users.length,
                            adminUsers: users.filter((user) => user.role === "admin").length,
                            regularUsers: users.filter((user) => user.role !== "admin").length,
                        },
                    });

                    setPortfolioDrafts(
                        Object.fromEntries(
                            users.map((user) => [String(user.id), String(Number(user.portfolioUsd || 0))])
                        )
                    );

                    setSettingsDraft({
                        btcWalletAddress: String(settingsPayload?.btcWalletAddress || ""),
                        plans: plans.map((plan) => ({
                            code: String(plan?.code || "").trim().toLowerCase(),
                            name: String(plan?.name || "").trim(),
                            feeUsd: Number(plan?.feeUsd || 0),
                            capacity: String(plan?.capacity || "").trim(),
                            support: String(plan?.support || "").trim(),
                        })),
                    });

                    setDeposits(
                        pendingDeposits.map((deposit) => ({
                            id: String(deposit?.id || ""),
                            userId: String(deposit?.userId || ""),
                            user: deposit?.user || null,
                            kind: String(deposit?.kind || "wallet_deposit"),
                            amountUsd: Number(deposit?.amountUsd || 0),
                            txReference: String(deposit?.txReference || ""),
                            planName: String(deposit?.planName || ""),
                            status: String(deposit?.status || "pending"),
                            createdAt: deposit?.createdAt || null,
                        }))
                    );

                    setDepositCreditDrafts(
                        Object.fromEntries(
                            pendingDeposits.map((deposit) => [
                                String(deposit?.id || ""),
                                String(Number(deposit?.amountUsd || 0)),
                            ])
                        )
                    );
                    setDepositAdminNotes({});
                }
            } catch {
                if (!cancelled) setError("Network error. Could not load admin data.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        }

        loadAdminData(refreshKey > 0);

        return () => {
            cancelled = true;
        };
    }, [router, searchQuery, refreshKey]);

    const newestUsers = useMemo(() => {
        return [...usersData.users]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 3);
    }, [usersData.users]);

    function onLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    }

    async function saveSettings() {
        const token = localStorage.getItem("token") || "";
        if (!token) return;

        if (!settingsDraft.btcWalletAddress.trim()) {
            setError("BTC wallet address is required.");
            return;
        }

        try {
            setSavingSettings(true);
            setError("");
            setMessage("");

            const response = await fetch(buildApiUrl("/api/settings/admin"), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settingsDraft),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.message || "Could not save settings.");
                return;
            }

            setMessage(payload?.message || "Settings updated.");
            setRefreshKey((value) => value + 1);
        } catch {
            setError("Network error. Could not save settings.");
        } finally {
            setSavingSettings(false);
        }
    }

    async function savePortfolio(userId) {
        const token = localStorage.getItem("token") || "";
        if (!token) return;

        const rawValue = portfolioDrafts[userId];
        const portfolioUsd = Number(rawValue);
        if (!Number.isFinite(portfolioUsd) || portfolioUsd < 0) {
            setError("Portfolio value must be a number greater than or equal to 0.");
            return;
        }

        try {
            setActivePortfolioSaveId(userId);
            setError("");
            setMessage("");

            const response = await fetch(buildApiUrl(`/api/auth/admin/users/${userId}/portfolio`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ portfolioUsd }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.message || "Could not update portfolio.");
                return;
            }

            setMessage(payload?.message || "Portfolio updated.");
            setUsersData((prev) => ({
                ...prev,
                users: prev.users.map((user) =>
                    String(user.id) === String(userId)
                        ? { ...user, portfolioUsd: Number(payload?.user?.portfolioUsd || portfolioUsd) }
                        : user
                ),
            }));
        } catch {
            setError("Network error. Could not update portfolio.");
        } finally {
            setActivePortfolioSaveId("");
        }
    }

    async function reviewDeposit(depositId, status) {
        const token = localStorage.getItem("token") || "";
        if (!token) return;

        const creditedAmountUsd = Number(depositCreditDrafts[depositId]);
        if (status === "approved" && (!Number.isFinite(creditedAmountUsd) || creditedAmountUsd < 0)) {
            setError("Credited amount must be a number greater than or equal to 0.");
            return;
        }

        try {
            setActiveDepositActionId(`${depositId}-${status}`);
            setError("");
            setMessage("");

            const response = await fetch(buildApiUrl(`/api/deposits/admin/${depositId}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    creditedAmountUsd: status === "approved" ? creditedAmountUsd : undefined,
                    adminNote: depositAdminNotes[depositId] || "",
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.message || "Could not review deposit.");
                return;
            }

            setMessage(payload?.message || "Deposit updated.");
            setRefreshKey((value) => value + 1);
        } catch {
            setError("Network error. Could not review deposit.");
        } finally {
            setActiveDepositActionId("");
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden py-7 sm:py-8">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/hero1.webp')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,.86)_0%,rgba(7,9,13,.9)_100%)]" />

            <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 sm:px-5 lg:px-7">
                <section className="rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.5)] sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <img src="/assets/svgs/logo.svg?v=btc-shield-1" alt="Logo" className="h-14 w-14" />
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">
                                    Admin
                                </p>
                                <h1 className="text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl">
                                    Portfolio & Deposit Control
                                </h1>
                                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                    Manage wallet settings, pricing, user portfolios, and deposit approvals.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="btn-dark h-10 whitespace-nowrap px-4 text-sm"
                                onClick={() => setRefreshKey((value) => value + 1)}
                                disabled={refreshing}
                            >
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </button>
                            <button
                                type="button"
                                className="btn-gold h-10 whitespace-nowrap px-4 text-sm"
                                onClick={onLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Total Users
                            </p>
                            <p className="mt-2 text-3xl font-black text-[var(--text)]">{usersData.counts.totalUsers}</p>
                        </div>
                        <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Admin Accounts
                            </p>
                            <p className="mt-2 text-3xl font-black text-[var(--gold)]">{usersData.counts.adminUsers}</p>
                        </div>
                        <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Pending Deposits
                            </p>
                            <p className="mt-2 text-3xl font-black text-[var(--text)]">{deposits.length}</p>
                        </div>
                    </div>
                </section>

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

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Wallet & Plan Pricing
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                Set BTC wallet destination and edit plan prices.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-gold h-10 whitespace-nowrap px-4 text-sm"
                            onClick={saveSettings}
                            disabled={savingSettings}
                        >
                            {savingSettings ? "Saving..." : "Save Settings"}
                        </button>
                    </div>

                    <label className="mt-4 block">
                        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[.1em] text-[var(--muted)]">
                            BTC Wallet Address
                        </span>
                        <input
                            value={settingsDraft.btcWalletAddress}
                            onChange={(event) =>
                                setSettingsDraft((prev) => ({ ...prev, btcWalletAddress: event.target.value }))
                            }
                            className="input border-[#303745] bg-[#0c1016]"
                            placeholder="Paste wallet address"
                        />
                    </label>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {settingsDraft.plans.map((plan) => (
                            <div key={plan.code} className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                                <p className="text-base font-black text-[var(--text)]">{plan.name}</p>
                                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{plan.code}</p>
                                <label className="mt-3 block">
                                    <span className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">Fee (USD)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={String(plan.feeUsd)}
                                        onChange={(event) => {
                                            const nextFee = Number(event.target.value);
                                            setSettingsDraft((prev) => ({
                                                ...prev,
                                                plans: prev.plans.map((item) =>
                                                    item.code === plan.code
                                                        ? { ...item, feeUsd: Number.isFinite(nextFee) ? nextFee : 0 }
                                                        : item
                                                ),
                                            }));
                                        }}
                                        className="input border-[#303745] bg-[#0c1016]"
                                    />
                                </label>
                                <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                                    Current: <span className="font-black text-[var(--text)]">{formatUSD(plan.feeUsd)}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Users & Portfolios
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                Search users and update portfolio values directly.
                            </p>
                        </div>

                        <form
                            className="flex w-full max-w-md gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                setSearchQuery(searchInput.trim());
                            }}
                        >
                            <input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search name, username, email, phone, country…"
                                className="input border-[#303745] bg-[#0c1016]"
                            />
                            <button type="submit" className="btn-gold h-10 whitespace-nowrap px-4 text-sm">
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2f3949]">
                        <table className="min-w-[1280px] w-full border-collapse">
                            <thead>
                                <tr className="bg-[#121a27] text-left text-xs uppercase tracking-[.08em] text-[var(--muted)]">
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Plan</th>
                                    <th className="px-4 py-3">Portfolio (USD)</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td className="px-4 py-5 text-sm font-semibold text-[var(--muted)]" colSpan={7}>
                                            Loading users…
                                        </td>
                                    </tr>
                                ) : usersData.users.length ? (
                                    usersData.users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-t border-[#263142] text-sm text-[#e8edf6] hover:bg-[#131c2a]"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-[var(--text)]">{user.fullName}</p>
                                                <p className="text-xs text-[var(--muted)]">@{user.username}</p>
                                            </td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3 uppercase">{user.role || "user"}</td>
                                            <td className="px-4 py-3">
                                                <p>{user?.selectedPlan?.name || "—"}</p>
                                                <p className="text-xs text-[var(--muted)]">
                                                    {user?.selectedPlan?.status || "none"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={portfolioDrafts[String(user.id)] ?? ""}
                                                        onChange={(event) =>
                                                            setPortfolioDrafts((prev) => ({
                                                                ...prev,
                                                                [String(user.id)]: event.target.value,
                                                            }))
                                                        }
                                                        className="input h-10 min-w-[140px] border-[#303745] bg-[#0c1016]"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-dark h-10 whitespace-nowrap px-3 text-xs"
                                                        onClick={() => savePortfolio(String(user.id))}
                                                        disabled={activePortfolioSaveId === String(user.id)}
                                                    >
                                                        {activePortfolioSaveId === String(user.id) ? "Saving..." : "Save"}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDate(user.createdAt)}</td>
                                            <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDate(user.updatedAt)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-5 text-sm font-semibold text-[var(--muted)]" colSpan={7}>
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Pending Deposit Reviews
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                Approve or reject deposits. Approved wallet deposits credit the user portfolio.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2f3949]">
                        <table className="min-w-[1280px] w-full border-collapse">
                            <thead>
                                <tr className="bg-[#121a27] text-left text-xs uppercase tracking-[.08em] text-[var(--muted)]">
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Requested Amount</th>
                                    <th className="px-4 py-3">Credit Amount</th>
                                    <th className="px-4 py-3">Plan</th>
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Note</th>
                                    <th className="px-4 py-3">Submitted</th>
                                    <th className="px-4 py-3">Actions</th>
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
                                                <p className="font-bold text-[var(--text)]">
                                                    {deposit.user?.fullName || "Unknown user"}
                                                </p>
                                                <p className="text-xs text-[var(--muted)]">@{deposit.user?.username || "—"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {deposit.kind === "plan_payment" ? "Plan payment" : "Wallet deposit"}
                                            </td>
                                            <td className="px-4 py-3">{formatUSD(deposit.amountUsd)}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={depositCreditDrafts[deposit.id] ?? ""}
                                                    onChange={(event) =>
                                                        setDepositCreditDrafts((prev) => ({
                                                            ...prev,
                                                            [deposit.id]: event.target.value,
                                                        }))
                                                    }
                                                    className="input h-10 min-w-[120px] border-[#303745] bg-[#0c1016]"
                                                />
                                            </td>
                                            <td className="px-4 py-3">{deposit.planName || "—"}</td>
                                            <td className="px-4 py-3">{deposit.txReference || "—"}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    value={depositAdminNotes[deposit.id] || ""}
                                                    onChange={(event) =>
                                                        setDepositAdminNotes((prev) => ({
                                                            ...prev,
                                                            [deposit.id]: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Optional admin note"
                                                    className="input h-10 min-w-[180px] border-[#303745] bg-[#0c1016]"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[var(--muted)]">
                                                {formatDate(deposit.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn-gold h-10 whitespace-nowrap px-3 text-xs"
                                                        onClick={() => reviewDeposit(deposit.id, "approved")}
                                                        disabled={activeDepositActionId === `${deposit.id}-approved`}
                                                    >
                                                        {activeDepositActionId === `${deposit.id}-approved`
                                                            ? "Approving..."
                                                            : "Approve"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-dark h-10 whitespace-nowrap px-3 text-xs"
                                                        onClick={() => reviewDeposit(deposit.id, "rejected")}
                                                        disabled={activeDepositActionId === `${deposit.id}-rejected`}
                                                    >
                                                        {activeDepositActionId === `${deposit.id}-rejected`
                                                            ? "Rejecting..."
                                                            : "Reject"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-5 text-sm font-semibold text-[var(--muted)]" colSpan={9}>
                                            No pending deposits.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                        Latest Registrations
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {newestUsers.map((user) => (
                            <article key={user.id} className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                                <p className="truncate text-base font-black text-[var(--text)]">{user.fullName}</p>
                                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">@{user.username}</p>
                                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{user.email}</p>
                                <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                                    Joined: <span className="text-[var(--text)]">{formatDate(user.createdAt)}</span>
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

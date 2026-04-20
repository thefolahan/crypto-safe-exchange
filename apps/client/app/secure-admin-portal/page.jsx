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

function maskEmail(email) {
    const [name, domain] = String(email || "").split("@");
    if (!name || !domain) return "—";
    if (name.length <= 3) return `${name[0] || ""}***@${domain}`;
    return `${name.slice(0, 3)}***@${domain}`;
}

function resolveUserImage(profilePictureUrl) {
    const value = String(profilePictureUrl || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return buildApiUrl(value);
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [data, setData] = useState({
        users: [],
        counts: {
            totalUsers: 0,
            adminUsers: 0,
            regularUsers: 0,
        },
        pagination: {
            page: 1,
            limit: 100,
            totalUsers: 0,
            totalPages: 1,
        },
    });

    useEffect(() => {
        let cancelled = false;

        async function loadUsers(isRefresh = false) {
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
                const response = await fetch(buildApiUrl(`/api/auth/admin/users?${params.toString()}`), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const payload = await response.json().catch(() => ({}));

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.replace(`/login?next=${encodeURIComponent(ADMIN_PATH)}`);
                    return;
                }

                if (response.status === 403) {
                    router.replace("/dashboard");
                    return;
                }

                if (!response.ok) {
                    if (!cancelled) setError(payload?.message || "Could not load users.");
                    return;
                }

                if (!cancelled) {
                    setData({
                        users: Array.isArray(payload?.users) ? payload.users : [],
                        counts: payload?.counts || {
                            totalUsers: 0,
                            adminUsers: 0,
                            regularUsers: 0,
                        },
                        pagination: payload?.pagination || {
                            page: 1,
                            limit: 100,
                            totalUsers: 0,
                            totalPages: 1,
                        },
                    });
                }
            } catch {
                if (!cancelled) setError("Network error. Could not load users.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        }

        loadUsers(refreshKey > 0);

        return () => {
            cancelled = true;
        };
    }, [router, searchQuery, refreshKey]);

    const newestUsers = useMemo(() => {
        return [...data.users]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 3);
    }, [data.users]);

    function onLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
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
                                    User Management Dashboard
                                </h1>
                                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                    View all registered users and account details.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <a href="/dashboard" className="btn-dark h-10 whitespace-nowrap px-4 text-sm">
                                Back to Dashboard
                            </a>
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
                            <p className="mt-2 text-3xl font-black text-[var(--text)]">{data.counts.totalUsers}</p>
                        </div>
                        <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Admin Accounts
                            </p>
                            <p className="mt-2 text-3xl font-black text-[var(--gold)]">{data.counts.adminUsers}</p>
                        </div>
                        <div className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Regular Users
                            </p>
                            <p className="mt-2 text-3xl font-black text-[var(--text)]">{data.counts.regularUsers}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                Latest Registrations
                            </p>
                            <p className="mt-1 text-base font-black text-[var(--text)]">
                                {newestUsers.length ? `${newestUsers.length} most recent users` : "No users yet"}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-dark h-10 whitespace-nowrap px-4 text-sm"
                            onClick={() => setRefreshKey((v) => v + 1)}
                            disabled={refreshing}
                        >
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {newestUsers.map((user) => (
                            <article key={user.id} className="rounded-2xl border border-[#323c4d] bg-[#151e2a] p-4">
                                <p className="truncate text-base font-black text-[var(--text)]">{user.fullName}</p>
                                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">@{user.username}</p>
                                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{maskEmail(user.email)}</p>
                                <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                                    Joined: <span className="text-[var(--text)]">{formatDate(user.createdAt)}</span>
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-5 rounded-3xl border border-[#2f3949] bg-[#101621] p-5 shadow-[0_20px_56px_rgba(0,0,0,.38)]">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--muted)]">
                                All Users
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                                Complete user details from your database.
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

                    {error ? (
                        <div className="mt-4 rounded-xl border border-[#523634] bg-[rgba(88,40,38,.32)] p-3 text-sm font-semibold text-[#ffc9bc]">
                            {error}
                        </div>
                    ) : null}

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#2f3949]">
                        <table className="min-w-[1120px] w-full border-collapse">
                            <thead>
                                <tr className="bg-[#121a27] text-left text-xs uppercase tracking-[.08em] text-[var(--muted)]">
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Gender</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Country</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td className="px-4 py-5 text-sm font-semibold text-[var(--muted)]" colSpan={8}>
                                            Loading users…
                                        </td>
                                    </tr>
                                ) : data.users.length ? (
                                    data.users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-t border-[#263142] text-sm text-[#e8edf6] hover:bg-[#131c2a]"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 overflow-hidden rounded-full border border-[#2f3b4f] bg-[#0c1119]">
                                                        {user.profilePictureUrl ? (
                                                            <img
                                                                src={resolveUserImage(user.profilePictureUrl)}
                                                                alt={user.fullName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-[var(--text)]">{user.fullName}</p>
                                                        <p className="truncate text-xs text-[var(--muted)]">@{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3 capitalize">{user.gender || "—"}</td>
                                            <td className="px-4 py-3">{user.phoneNumber || "—"}</td>
                                            <td className="px-4 py-3">{user.country || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[.08em] ${
                                                        user.role === "admin"
                                                            ? "border-[rgba(221,192,138,.4)] bg-[rgba(221,192,138,.12)] text-[var(--gold)]"
                                                            : "border-[#2e3a4d] bg-[#172131] text-[#dfe6f2]"
                                                    }`}
                                                >
                                                    {user.role || "user"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDate(user.createdAt)}</td>
                                            <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDate(user.updatedAt)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-5 text-sm font-semibold text-[var(--muted)]" colSpan={8}>
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

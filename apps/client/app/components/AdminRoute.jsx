"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildApiUrl } from "../lib/apiUrl";
import { ADMIN_PATH } from "../lib/adminPath";

function readToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
}

export default function AdminRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [ready, setReady] = useState(false);
    const [allowed, setAllowed] = useState(false);
    const [message, setMessage] = useState("Checking admin session…");

    useEffect(() => {
        let cancelled = false;

        async function validateAdmin() {
            const token = readToken();
            if (!token) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace(`/login?next=${encodeURIComponent(pathname || ADMIN_PATH)}`);
                return;
            }

            try {
                const response = await fetch(buildApiUrl("/api/auth/me"), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.replace(`/login?next=${encodeURIComponent(pathname || ADMIN_PATH)}`);
                    return;
                }

                const user = payload?.user || null;
                if (!user || user.role !== "admin") {
                    setMessage("Admin access only. Redirecting…");
                    router.replace("/dashboard");
                    return;
                }

                localStorage.setItem("user", JSON.stringify(user));
                if (!cancelled) {
                    setAllowed(true);
                    setReady(true);
                }
            } catch {
                setMessage("Could not verify admin access.");
                if (!cancelled) setReady(true);
            }
        }

        validateAdmin();
        return () => {
            cancelled = true;
        };
    }, [pathname, router]);

    if (!ready || !allowed) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#050607] px-4">
                <div className="w-full max-w-md text-center">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--gold)]">Admin</p>
                    <p className="mt-2 text-lg font-semibold text-[#f2f4f7]">{message}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Please wait.</p>
                </div>
            </main>
        );
    }

    return children;
}

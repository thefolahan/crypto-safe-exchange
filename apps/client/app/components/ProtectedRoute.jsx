"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

function readSessionValidity() {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) return false;

    try {
        JSON.parse(user);
        return true;
    } catch {
        return false;
    }
}

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const ok = useMemo(() => readSessionValidity(), []);

    useEffect(() => {
        if (ok === false) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        }
    }, [ok, router, pathname]);

    if (ok === null) {
        return null;
    }

    if (!ok) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#050607] px-4">
                <div className="w-full max-w-md text-center">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--gold)]">Protected</p>
                    <p className="mt-2 text-lg font-semibold text-[#f2f4f7]">Checking session…</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Please wait.</p>
                </div>
            </main>
        );
    }

    return children;
}

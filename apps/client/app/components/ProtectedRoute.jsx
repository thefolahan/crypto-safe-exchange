"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [ok, setOk] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
            return;
        }

        try {
            JSON.parse(user);
            setOk(true);
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        }
    }, [router, pathname]);

    if (!ok) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#050607] px-4">
                <div className="site-card w-full max-w-md p-5 text-center sm:p-6">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--gold)]">Protected</p>
                    <p className="mt-2 text-lg font-semibold text-[#f2f4f7]">Checking session…</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Please wait.</p>
                </div>
            </main>
        );
    }

    return children;
}

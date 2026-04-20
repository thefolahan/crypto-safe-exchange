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
            <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
                <div className="panel" style={{ width: "min(560px, 92%)" }}>
                    <div className="smallcaps muted">Protected</div>
                    <div className="h3" style={{ fontWeight: 900, marginTop: 6 }}>
                        Checking session…
                    </div>
                    <p className="muted lead" style={{ marginTop: 8 }}>
                        Please wait.
                    </p>
                </div>
            </main>
        );
    }

    return children;
}

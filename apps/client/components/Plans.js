"use client";

import { useEffect, useState } from "react";
import Section from "./Section";
import { buildApiUrl } from "../app/lib/apiUrl";

const FALLBACK_PLANS = [
    {
        code: "basic-safe",
        name: "Basic Safe",
        feeUsd: 0,
        capacity: "Up to $25,000",
        support: "Email support",
    },
    {
        code: "plus-safe",
        name: "Plus Safe",
        feeUsd: 19,
        capacity: "Up to $250,000",
        support: "Priority support",
    },
    {
        code: "premium-safe",
        name: "Premium Safe",
        feeUsd: 79,
        capacity: "Up to $1,000,000",
        support: "24/7 concierge support",
    },
];

function normalizePlan(plan) {
    return {
        code: String(plan?.code || "").trim().toLowerCase(),
        name: String(plan?.name || "").trim(),
        feeUsd: Number(plan?.feeUsd || 0),
        capacity: String(plan?.capacity || "").trim(),
        support: String(plan?.support || "").trim(),
    };
}

function formatPlanFee(feeUsd) {
    const amount = Number(feeUsd || 0);
    return `$${amount.toLocaleString()} / month`;
}

export default function Plans() {
    const [plans, setPlans] = useState(FALLBACK_PLANS);
    const [token, setToken] = useState(() =>
        typeof window === "undefined" ? "" : localStorage.getItem("token") || ""
    );

    useEffect(() => {
        let cancelled = false;

        async function loadPlans() {
            try {
                const response = await fetch(buildApiUrl("/api/settings/public"));
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || cancelled) return;

                const incomingPlans = Array.isArray(payload?.plans) ? payload.plans.map(normalizePlan) : [];
                if (incomingPlans.length) {
                    setPlans(incomingPlans);
                }
            } catch {
            }
        }

        loadPlans();

        const onStorage = () => {
            setToken(localStorage.getItem("token") || "");
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener("focus", onStorage);

        return () => {
            cancelled = true;
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("focus", onStorage);
        };
    }, []);

    return (
        <Section
            id="pricing"
            label="Pricing"
            title="Choose a plan for your crypto safe."
            centered
        >
            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan, index) => (
                    <article
                        key={plan.code || plan.name}
                        className={`site-card flex flex-col p-5 sm:p-6 ${index === 1 ? "border-[rgba(221,192,138,.45)]" : ""}`}
                    >
                        <h3 className="text-xl font-semibold text-[#f6f7f9]">{plan.name}</h3>
                        <div className="mt-5 rounded-xl border border-[#2a303a] bg-[#0f1218] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Storage Capacity</p>
                            <p className="mt-2 break-words text-xl font-bold text-[var(--gold)]">
                                {plan.capacity}
                            </p>
                        </div>

                        <ul className="mt-5 space-y-2 text-sm text-[#dce0e7]">
                            <li>Account fee: {formatPlanFee(plan.feeUsd)}</li>
                            <li>Recovery phrase backup</li>
                            <li>Support: {plan.support || "Standard support"}</li>
                            <li>Withdrawal tracking</li>
                        </ul>

                        <a
                            href={`${token ? "/dashboard" : "/login"}?plan=${encodeURIComponent(plan.code)}`}
                            className="btn-gold mt-6"
                        >
                            Create Safe
                        </a>
                    </article>
                ))}
            </div>
        </Section>
    );
}

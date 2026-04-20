"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MAX_POINTS = 60;
const REFRESH_MS = 12 * 60 * 60 * 1000;
const STORAGE_KEY = "btc_price_points_v1";

function formatUSD(value) {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function readStoredPoints() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((item) => ({ ts: Number(item.ts), price: Number(item.price) }))
            .filter((item) => Number.isFinite(item.ts) && Number.isFinite(item.price))
            .sort((a, b) => a.ts - b.ts)
            .slice(-MAX_POINTS);
    } catch {
        return [];
    }
}

function storePoints(points) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(points.slice(-MAX_POINTS)));
    } catch {
    }
}

export default function BitcoinPrice() {
    const [data, setData] = useState([]);
    const [price, setPrice] = useState(null);
    const [status, setStatus] = useState("loading");
    const [mounted, setMounted] = useState(false);
    const inflightRef = useRef(false);

    async function loadPrice(signal) {
        if (inflightRef.current) return;
        inflightRef.current = true;

        try {
            const response = await fetch("/api/btc", { cache: "no-store", signal });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setStatus("error");
                return;
            }

            const nextPrice = Number(payload?.price);
            const nextTs = Number(payload?.ts);
            if (!Number.isFinite(nextPrice) || !Number.isFinite(nextTs)) {
                setStatus("error");
                return;
            }

            setPrice(nextPrice);
            setStatus("ok");

            setData((previous) => {
                const seeded = previous.length ? previous : readStoredPoints();
                const latest = seeded[seeded.length - 1];
                if (latest && latest.ts === nextTs) {
                    storePoints(seeded);
                    return seeded;
                }

                const next = [...seeded, { ts: nextTs, price: nextPrice }]
                    .sort((a, b) => a.ts - b.ts)
                    .slice(-MAX_POINTS);

                storePoints(next);
                return next;
            });
        } catch (error) {
            if (error?.name !== "AbortError") setStatus("error");
        } finally {
            inflightRef.current = false;
        }
    }

    useEffect(() => {
        setMounted(true);

        const saved = typeof window !== "undefined" ? readStoredPoints() : [];
        if (saved.length) {
            setData(saved);
            setPrice(saved[saved.length - 1].price);
            setStatus("ok");
        }

        const firstController = new AbortController();
        loadPrice(firstController.signal);

        const interval = setInterval(() => {
            const controller = new AbortController();
            loadPrice(controller.signal);
        }, REFRESH_MS);

        return () => {
            firstController.abort();
            clearInterval(interval);
        };
    }, []);

    const change = useMemo(() => {
        if (data.length < 2) return null;
        const first = data[0].price;
        const last = data[data.length - 1].price;
        const diff = last - first;
        const pct = (diff / (first || 1)) * 100;
        return { diff, pct };
    }, [data]);

    const chartData = useMemo(
        () => data.map((point) => ({ ...point, t: formatTime(point.ts) })),
        [data]
    );

    return (
        <section className="site-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <span className="kicker">Bitcoin Pulse</span>
                    <p className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">{formatUSD(price)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {change ? (
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${change.diff >= 0 ? "bg-[rgba(221,192,138,.2)] text-[#f3d8ad]" : "bg-[rgba(255,128,96,.2)] text-[#ffc3b3]"}`}
                            >
                                {change.diff >= 0 ? "▲" : "▼"} {formatUSD(Math.abs(change.diff))} (
                                {Math.abs(change.pct).toFixed(2)}%)
                            </span>
                        ) : (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">—</span>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {status === "ok" ? "Live" : status === "loading" ? "Loading" : "Offline"}
                        </span>
                    </div>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {Math.min(data.length, MAX_POINTS)} data points
                </p>
            </div>

            <div className="mt-5 h-[220px] w-full sm:h-[280px]">
                {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#9db2c8" }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#9db2c8" }}
                                axisLine={false}
                                tickLine={false}
                                width={64}
                                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 14,
                                    border: "1px solid rgba(255,255,255,.15)",
                                    background: "rgba(8,17,26,.92)",
                                    color: "#eff6ff",
                                }}
                                formatter={(value) => [formatUSD(Number(value)), "Price"]}
                                labelStyle={{ color: "#b8c8da" }}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="var(--gold)"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl bg-white/10" />
                )}
            </div>

            {!data.length ? (
                <div className="mt-2 rounded-2xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-slate-300">
                    Waiting for market data...
                </div>
            ) : null}
        </section>
    );
}

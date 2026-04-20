"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MAX_POINTS = 60;
const REFRESH_MS = 12 * 60 * 60 * 1000;
const STORAGE_KEY = "btc_price_points_v1";

function formatUSD(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

export default function BitcoinPrice() {
    const [data, setData] = useState([]);
    const [price, setPrice] = useState(null);
    const [status, setStatus] = useState("idle");
    const inflightRef = useRef(false);

    async function fetchSpot(signal) {
        if (inflightRef.current) return;
        inflightRef.current = true;

        try {
            setStatus((s) => (s === "idle" ? "loading" : s));

            const res = await fetch("/api/btc", { cache: "no-store", signal });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return;

            const amount = Number(json?.price);
            const ts = Number(json?.ts);
            if (!Number.isFinite(amount) || !Number.isFinite(ts)) return;

            setPrice(amount);

            setData((prev) => {
                const existing = prev.length ? prev : safeReadPoints();

                const last = existing[existing.length - 1];
                if (last && last.ts === ts) {
                    safeWritePoints(existing);
                    return existing;
                }

                const next = [...existing, { ts, price: amount }]
                    .sort((a, b) => a.ts - b.ts)
                    .slice(-MAX_POINTS);

                safeWritePoints(next);
                return next;
            });

            setStatus("ok");
        } catch (e) {
            if (e?.name === "AbortError") return;
        } finally {
            inflightRef.current = false;
        }
    }

    useEffect(() => {
        const saved = typeof window !== "undefined" ? safeReadPoints() : [];
        if (saved.length) {
            setData(saved);
            setPrice(saved[saved.length - 1].price);
            setStatus("ok");
        }

        const ac = new AbortController();
        fetchSpot(ac.signal);

        const id = setInterval(() => {
            const ac2 = new AbortController();
            fetchSpot(ac2.signal);
        }, REFRESH_MS);

        return () => {
            ac.abort();
            clearInterval(id);
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
        () => data.map((d) => ({ ...d, t: formatTime(d.ts) })),
        [data]
    );

    return (
        <section className="btcWrap">
            <div className="btcHead">
                <div>
                    <div className="btcKicker">Bitcoin Price</div>
                    <div className="btcPrice">{formatUSD(price)}</div>

                    <div className="btcMeta">
                        {change ? (
                            <span className={`btcChange ${change.diff >= 0 ? "up" : "down"}`}>
                                {change.diff >= 0 ? "▲" : "▼"} {formatUSD(Math.abs(change.diff))} (
                                {Math.abs(change.pct).toFixed(2)}%)
                            </span>
                        ) : (
                            <span className="btcChange neutral">—</span>
                        )}

                        <span className="btcDot">•</span>

                        <span className="btcStatus">
                            {status === "loading" && "Loading…"}
                            {status === "ok" && "Live"}
                            {status === "idle" && "—"}
                        </span>
                    </div>
                </div>

                <div className="btcRight">
                    <div className="btcSmall">
                        Last {Math.min(data.length, MAX_POINTS)} points
                    </div>
                </div>
            </div>

            <div className="btcChartCard">
                <div className="btcChartBox">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="t" tick={{ fontSize: 12 }} />
                            <YAxis
                                domain={["auto", "auto"]}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(v) => `${Math.round(v).toLocaleString()}`}
                                width={70}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "rgba(15,26,46,.95)",
                                    border: "1px solid rgba(255,255,255,.12)",
                                    borderRadius: 12,
                                }}
                                labelStyle={{ color: "rgba(234,240,255,.92)" }}
                                formatter={(val) => [formatUSD(Number(val)), "BTC"]}
                            />
                            <Line type="monotone" dataKey="price" stroke="var(--accent2)" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>

                    {data.length === 0 && <div className="btcEmptyOverlay">Waiting for data…</div>}
                </div>
            </div>
        </section>
    );
}

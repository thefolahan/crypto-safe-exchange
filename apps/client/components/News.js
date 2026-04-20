"use client";

import { useEffect, useState } from "react";
import Section from "./Section";

function formatDate(value) {
    const ts = Date.parse(value || "");
    if (!Number.isFinite(ts)) return "Unknown date";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ts));
}

export default function News() {
    const [items, setItems] = useState([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    async function fetchNews() {
        try {
            setLoading(true);
            const response = await fetch("/api/news", { cache: "no-store" });
            const payload = await response.json().catch(() => ({}));
            const news = Array.isArray(payload?.items) ? payload.items : [];
            setItems(news);
            setIndex(0);
        } catch {
            setItems([]);
            setIndex(0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNews();
    }, []);

    useEffect(() => {
        if (!items.length) return;
        const interval = setInterval(() => {
            setIndex((current) => (current + 1) % items.length);
        }, 9000);

        return () => clearInterval(interval);
    }, [items.length]);

    const active = items[index];

    return (
        <Section id="news" title="Latest News" centered>
            <article className="site-card rounded-2xl p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-2 pb-3 sm:px-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#e7eaf0]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                        Live feed
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIndex((current) => (items.length ? (current - 1 + items.length) % items.length : 0))}
                            disabled={!items.length}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,.03)] text-[#dce1ea] transition hover:bg-[rgba(255,255,255,.08)] disabled:opacity-45"
                            aria-label="Previous news"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={() => setIndex((current) => (items.length ? (current + 1) % items.length : 0))}
                            disabled={!items.length}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,.03)] text-[#dce1ea] transition hover:bg-[rgba(255,255,255,.08)] disabled:opacity-45"
                            aria-label="Next news"
                        >
                            ›
                        </button>
                        <button
                            type="button"
                            onClick={fetchNews}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,.03)] text-[#dce1ea] transition hover:bg-[rgba(255,255,255,.08)]"
                            aria-label="Refresh news"
                        >
                            ↻
                        </button>
                    </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,.02)] p-4 sm:p-5">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                            <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                        </div>
                    ) : !items.length ? (
                        <div className="py-8 text-center">
                            <p className="text-lg font-semibold text-[#eef1f6]">No news available now.</p>
                            <p className="mt-1 text-sm text-[var(--muted)]">Try refreshing again.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-right text-xs font-semibold text-[var(--muted)]">{formatDate(active?.pubDate)}</p>
                            <h3 className="mt-2 break-words text-balance text-2xl font-semibold leading-tight text-[#f2f4f8]">
                                {active?.title}
                            </h3>
                            <p className="mt-3 break-words text-sm leading-relaxed text-[var(--muted)] sm:text-base">{active?.description}</p>
                            <a
                                href={active?.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-5 inline-flex text-sm font-semibold text-[var(--gold)]"
                            >
                                Read full story →
                            </a>

                            {items.length > 1 ? (
                                <div className="mt-8 flex items-center justify-end gap-2">
                                    {items.map((_, dotIndex) => (
                                        <button
                                            key={dotIndex}
                                            type="button"
                                            onClick={() => setIndex(dotIndex)}
                                            className={`h-2 rounded-full transition ${dotIndex === index ? "w-5 bg-[var(--gold)]" : "w-2 bg-[#4a4f58]"}`}
                                            aria-label={`Go to news item ${dotIndex + 1}`}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </article>
        </Section>
    );
}

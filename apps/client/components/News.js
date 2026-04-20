"use client";

import { useEffect, useMemo, useState } from "react";
import Section from "./Section";

function formatDate(pubDate) {
    const t = Date.parse(pubDate || "");
    if (!Number.isFinite(t)) return "";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(t));
}

export default function News() {
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [loading, setLoading] = useState(true);

    const safeIdx = useMemo(() => {
        if (!items.length) return 0;
        return Math.max(0, Math.min(idx, items.length - 1));
    }, [idx, items.length]);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch("/api/news", { cache: "no-store" });
            const data = await res.json();
            setItems(Array.isArray(data?.items) ? data.items : []);
            setIdx(0);
        } catch {
            setItems([]);
            setIdx(0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let alive = true;

        (async () => {
            if (!alive) return;
            await load();
        })();

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!items.length) return;
        const t = setInterval(() => {
            setIdx((v) => (v + 1) % items.length);
        }, 9000);
        return () => clearInterval(t);
    }, [items.length]);

    const active = items[safeIdx];

    return (
        <Section id="news" title="Latest News">
            <div className="newsWrap">
                <div className="newsTopBar">
                    <div className="newsLive">
                        <span className="newsLiveDot" aria-hidden="true" />
                        <span className="newsLiveText">Live feed</span>
                    </div>

                    <div className="newsControls">
                        <button
                            className="newsBtn"
                            type="button"
                            onClick={() => setIdx((v) => (items.length ? (v - 1 + items.length) % items.length : 0))}
                            aria-label="Previous"
                            disabled={!items.length}
                        >
                            ‹
                        </button>

                        <button
                            className="newsBtn"
                            type="button"
                            onClick={() => setIdx((v) => (items.length ? (v + 1) % items.length : 0))}
                            aria-label="Next"
                            disabled={!items.length}
                        >
                            ›
                        </button>

                        <button className="newsBtn" type="button" onClick={load} aria-label="Refresh">
                            ↻
                        </button>
                    </div>
                </div>

                <div className="newsViewport">
                    {loading ? (
                        <div className="newsSkeleton">
                            <div className="newsSkTitle" />
                            <div className="newsSkLine" />
                            <div className="newsSkLine" />
                            <div className="newsSkLine short" />
                        </div>
                    ) : !items.length ? (
                        <div className="newsEmpty">
                            <div className="h3">No news right now</div>
                            <p className="muted">Try refresh in a moment.</p>
                        </div>
                    ) : (
                        <>
                            <div className="newsMetaRow">
                                <div className="newsDate">{formatDate(active?.pubDate)}</div>
                            </div>

                            <h3 className="newsTitle">{active?.title}</h3>
                            <p className="newsText muted">{active?.description}</p>

                            <a className="newsLink" href={active?.link} target="_blank" rel="noopener noreferrer">
                                Read full story →
                            </a>

                            <div className="newsDots" aria-label="News carousel pagination">
                                {items.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`newsDot ${i === safeIdx ? "active" : ""}`}
                                        onClick={() => setIdx(i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Section>
    );
}

"use client";

import { useEffect, useMemo, useState } from "react";

export default function Hero() {
    const slides = useMemo(
        () => [
            {
                image: "/assets/images/hero1.webp",
                title: "Trade Bitcoin",
                subtitle:
                    "Trade foreign currencies on the largest and most liquid\nmarket in the world.",
                cta: { label: "Start trading now", href: "/register" },
            },
            {
                image: "/assets/images/hero2.jpg",
                title: "The Future of Financing\nis cryptocurrency",
                subtitle:
                    "Trade BTC, ETH, XRP, LTC, and EOS with 100x leverage and\nthe lowest fees",
                cta: { label: "Start trading now", href: "/register" },
            },
            {
                image: "/assets/images/hero3.avif",
                title: "Trade Shares, Indices,\nCommodities",
                subtitle:
                    "Our trading engine is specially designed to execute over\n12,000 orders per second.",
                cta: { label: "Start trading now", href: "/register" },
            },
        ],
        []
    );

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!mq) return;
        const apply = () => setReduceMotion(!!mq.matches);
        apply();
        mq.addEventListener?.("change", apply);
        return () => mq.removeEventListener?.("change", apply);
    }, []);

    useEffect(() => {
        if (paused || reduceMotion) return;
        const t = setInterval(() => {
            setIndex((i) => (i + 1) % slides.length);
        }, 3000);
        return () => clearInterval(t);
    }, [paused, reduceMotion, slides.length]);

    return (
        <section
            className="heroFull"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="heroSlides" aria-hidden="true">
                {slides.map((s, i) => (
                    <div
                        key={s.image}
                        className={`heroSlide ${i === index ? "active" : ""}`}
                        style={{ backgroundImage: `url(${s.image})` }}
                    >
                        <div className="heroOverlay" />
                    </div>
                ))}
            </div>

            <div className="heroContent">
                <div className="container heroContentInner">
                    <h1 className="heroTitle">
                        {slides[index].title.split("\n").map((line, idx) => (
                            <span key={`t-${idx}`} className="heroLine">
                                {line}
                            </span>
                        ))}
                    </h1>

                    <p className="heroSub">
                        {slides[index].subtitle.split("\n").map((line, idx) => (
                            <span key={`s-${idx}`} className="heroLine subLine">
                                {line}
                            </span>
                        ))}
                    </p>

                    <div className="heroBtnRow">
                        <a className="heroCta" href={slides[index].cta.href}>
                            {slides[index].cta.label}
                        </a>
                    </div>
                </div>
            </div>

            <div className="heroDots" role="tablist" aria-label="Hero slides">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`heroDot ${i === index ? "active" : ""}`}
                        onClick={() => setIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-pressed={i === index}
                    />
                ))}
            </div>
        </section>
    );
}

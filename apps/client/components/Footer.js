"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const buyLinks = [
        { name: "Blockchain", url: "https://www.blockchain.com" },
        { name: "Bitcoin.com", url: "https://www.bitcoin.com" },
        { name: "Crypto.com", url: "https://crypto.com" },
        { name: "Coinbase", url: "https://www.coinbase.com" },
        { name: "Cash App", url: "https://cash.app" },
    ];

    async function onSubscribe(e) {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter your email.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data?.message || "Subscription failed");
                return;
            }

            toast.success(data?.message || "Subscribed!");
            setEmail("");
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <footer id="footer" className="footer">
            <div className="container footerGrid">
                <div>
                    <div className="footerLogo">
                        <img
                            src="/assets/svgs/logo.svg"
                            alt="Crypto Earnings"
                            loading="lazy"
                            className="h-10 w-auto opacity-90"
                        />
                        <div className="logoText">Crypto Earnings</div>
                    </div>

                    <p className="muted" style={{ marginTop: 14, lineHeight: 1.8 }}>
                        15 Kay Ave Mc Kenzie, Tennessee (TN), 38201 <br />
                        support@cryptoearnings.org
                    </p>
                </div>

                <div>
                    <div className="footerTitle">About Us</div>
                    <a
                        className="footerLink"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    >
                        Our Company
                    </a>
                </div>

                <div>
                    <div className="footerTitle">Where to buy Bitcoin</div>
                    {buyLinks.map((x) => (
                        <a key={x.name} className="footerLink" href={x.url} target="_blank" rel="noopener noreferrer">
                            {x.name}
                        </a>
                    ))}
                </div>

                <div>
                    <div className="footerTitle">Newsletter</div>
                    <p className="muted">Get latest updates and offers.</p>

                    <form className="newsForm" onSubmit={onSubscribe}>
                        <input
                            className="input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <button className="btn" type="submit" disabled={loading}>
                            {loading ? "..." : "➤"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="container footBottom">
                <span className="muted">© {new Date().getFullYear()} Crypto Earnings. All rights reserved.</span>
            </div>
        </footer>
    );
}

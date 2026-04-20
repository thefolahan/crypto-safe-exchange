"use client";

import { useState } from "react";
import { toast } from "sonner";
import { buildApiUrl } from "../app/lib/apiUrl";

const buyLinks = ["Blockchain", "Bitcoin.com", "Crypto.com", "Coinbase", "Cash App"];

export default function Footer() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubscribe(event) {
        event.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your email.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(buildApiUrl("/api/newsletter/subscribe"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                toast.error(payload?.message || "Subscription failed.");
                return;
            }

            toast.success(payload?.message || "Subscribed.");
            setEmail("");
        } catch {
            toast.error("Network error.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <footer id="contact" className="border-t border-[var(--border)] bg-[#06070a]">
            <div className="site-container py-10">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                    <div>
                        <img src="/assets/svgs/logo.svg?v=btc-shield-1" alt="Crypto Safe Exchange" className="h-24 w-24 sm:h-28 sm:w-28" />
                        <div className="mt-3 text-2xl font-semibold text-[#eef1f6]">Crypto Safe Exchange</div>
                        <p className="mt-4 break-words text-sm leading-relaxed text-[var(--muted)]">
                            15 Kay Ave Mc Kenzie, Tennessee (TN), 38201
                            <br />
                            support@cryptosafeexchange.com
                        </p>
                    </div>

                    <div>
                        <div className="text-lg font-semibold text-[#eef1f6]">Where to buy Bitcoin</div>
                        <div className="mt-4 grid gap-2">
                            {buyLinks.map((item) => (
                                <a key={item} href="#" className="text-sm text-[var(--muted)] hover:text-[#edf2fb]">
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-lg font-semibold text-[#eef1f6]">Newsletter</div>
                        <p className="mt-4 text-sm text-[var(--muted)]">Get latest updates and offers.</p>

                        <form onSubmit={onSubscribe} className="mt-3 flex items-center overflow-hidden rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,.03)]">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-[#eef1f6] outline-none placeholder:text-[#8d98b1]"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="grid h-11 w-12 place-items-center border-l border-[var(--border)] text-[var(--gold)] transition hover:bg-[rgba(255,255,255,.06)] disabled:opacity-60"
                                aria-label="Subscribe"
                            >
                                ➤
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="border-t border-[var(--border)] py-5 text-center text-sm text-[var(--muted)]">
                © {new Date().getFullYear()} Crypto Safe Exchange. All rights reserved.
            </div>
        </footer>
    );
}

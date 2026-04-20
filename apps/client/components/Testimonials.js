import Section from "./Section";

const testimonials = [
    {
        name: "Forex scalper",
        quote: "The execution flow is clean. I can move from watchlist to order ticket instantly.",
    },
    {
        name: "Crypto swing trader",
        quote: "Charts and account details stay readable on mobile, which is where I trade most.",
    },
    {
        name: "Portfolio manager",
        quote: "The structure helps me avoid impulsive entries. Risk details are always in front of me.",
    },
    {
        name: "Commodities trader",
        quote: "I like having metals, forex, and crypto in one interface without clutter.",
    },
];

export default function Testimonials() {
    return (
        <Section
            id="testimonials"
            kicker="Community"
            title="Traders use the platform because it stays clear when markets get noisy."
        >
            <div className="grid gap-4 md:grid-cols-2">
                {testimonials.map((item) => (
                    <article key={item.name} className="glass p-5 sm:p-6">
                        <p className="text-sm leading-relaxed text-slate-200 sm:text-base">“{item.quote}”</p>
                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.name}</p>
                    </article>
                ))}
            </div>
        </Section>
    );
}

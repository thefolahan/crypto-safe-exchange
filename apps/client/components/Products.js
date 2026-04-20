import Section from "./Section";

const markets = [
    {
        title: "Cryptocurrencies",
        icon: "/assets/svgs/bitcoin2.svg",
        text: "Trade major assets like BTC and ETH with real-time price visibility and risk controls.",
    },
    {
        title: "Forex",
        icon: "/assets/svgs/forex.svg",
        text: "Access high-liquidity currency pairs with fast order routing and clear execution states.",
    },
    {
        title: "Commodities",
        icon: "/assets/svgs/commodities.svg",
        text: "Diversify with global commodities including metals and energy in one structured dashboard.",
    },
];

export default function Products() {
    return (
        <Section
            id="markets"
            label="Markets"
            title="Trade the world’s most active markets."
            subtitle="One account, one interface, and a consistent experience across desktop and mobile."
            centered
        >
            <div className="grid gap-4 md:grid-cols-3">
                {markets.map((market) => (
                    <article key={market.title} className="site-card p-5 sm:p-6">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#2a303a] bg-[#0f1218]">
                            <img src={market.icon} alt="" className="h-6 w-6 object-contain" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-[#f4f6f8]">{market.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">{market.text}</p>
                    </article>
                ))}
            </div>
        </Section>
    );
}

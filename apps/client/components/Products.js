import Section from "./Section";

const products = [
    {
        title: "Commodities",
        media: "/assets/svgs/commodities.svg",
        text:
            "Speculate on popular commodities like gold and oil with flexible position sizing and fast execution ideal for diversification and hedging during uncertain market cycles.",
    },
    {
        title: "Forex",
        media: "/assets/svgs/forex.svg",
        text:
            "Trade major, minor, and select exotic currency pairs with deep liquidity and tight spreads. Built for speed, clarity, and consistent risk management across global FX markets.",
    },
    {
        title: "Cryptocurrencies",
        media: "/assets/svgs/cryptocurrencies.svg",
        text:
            "Access top digital assets like BTC and ETH with clear pricing, smooth execution, and tools designed for volatility helping you stay disciplined while managing risk.",
    },
];

export default function Products() {
    return (
        <Section
            id="products"
            title="Products"
            subtitle="Explore global markets with a streamlined platform built for speed, clarity, and 24/7 opportunity."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
                {products.map((p) => (
                    <article
                        key={p.title}
                        className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,.10)] bg-[rgba(15,26,46,.55)]"
                    >
                        <div className="bg-white flex items-center justify-center h-48 sm:h-56 md:h-52 lg:h-64">
                            <img
                                src={p.media}
                                alt=""
                                className="h-16 w-16 sm:h-20 sm:w-20 md:h-16 md:w-16 lg:h-20 lg:w-20 object-contain"
                            />
                        </div>

                        <div className="p-5 sm:p-6 bg-gradient-to-br from-[rgba(47,107,255,.95)] to-[rgba(32,211,255,.75)] text-white">
                            <h3 className="text-xl font-extrabold">{p.title}</h3>
                            <p className="mt-3 leading-relaxed text-white/95 text-[1rem] sm:text-[1.05rem]">
                                {p.text}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    );
}

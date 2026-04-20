import Section from "./Section";

const services = [
    { title: "Cryptocurrencies (Coin Offering)", media: "/assets/svgs/coins.svg", text: "Buy and sell top crypto assets with live pricing, fast execution, and an interface that stays simple even when markets move quickly." },
    { title: "Indices", media: "/assets/svgs/blockchain.svg", text: "Follow major global indices in one place and trade broad market direction without having to pick individual stocks." },
    { title: "Forex", media: "/assets/svgs/forex2.svg", text: "Trade major and minor currency pairs with tight pricing, quick order placement, and tools that help you control risk on every trade." },
    { title: "Bitcoin Mining", media: "/assets/svgs/mining.svg", text: "Learn how mining works, compare hardware and returns, and get a clear view of costs like power, difficulty, and expected yield." },
    { title: "Cryptocurrencies Investing", media: "/assets/svgs/bitcoin.svg", text: "Build longer-term positions with simple portfolio tracking and performance snapshots, so you can stay consistent instead of chasing moves." },
    { title: "Commodities", media: "/assets/svgs/commodities2.svg", text: "Trade key commodities like gold and oil to diversify your strategy, hedge uncertainty, and take advantage of global price swings." },
];

export default function Services() {
    return (
        <Section
            id="services"
            title="Our Services"
            subtitle="A wide range of ways to participate built for both new and experienced traders."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7">
                {services.map((s) => (
                    <article
                        key={s.title}
                        className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,.10)] bg-[rgba(15,26,46,.55)]"
                    >
                        <div className="bg-white flex items-center justify-center h-48 sm:h-56">
                            <img src={s.media} alt="" className="h-16 w-16 sm:h-20 sm:w-20 object-contain" />
                        </div>

                        <div className="p-5 sm:p-6 bg-gradient-to-br from-[rgba(47,107,255,.95)] to-[rgba(32,211,255,.75)] text-white">
                            <h3 className="text-xl font-extrabold">{s.title}</h3>
                            <p className="mt-3 leading-relaxed text-white/95">
                                {s.text}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    );
}

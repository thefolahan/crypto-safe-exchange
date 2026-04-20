export default function Hero() {
    return (
        <section className="relative min-h-[78vh] overflow-hidden sm:min-h-[86vh]">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/hero2.jpg')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,10,.78)_0%,rgba(4,6,10,.72)_45%,rgba(4,6,10,.58)_100%)]" />

            <div className="site-container relative z-10 flex min-h-[78vh] items-center sm:min-h-[86vh]">
                <div className="max-w-3xl text-center sm:text-left">
                    <h1 className="title whitespace-pre-line text-balance text-[#f7f8fa]">
                        {"The Future of Financing\nis cryptocurrency"}
                    </h1>
                    <p className="sub mt-6 max-w-2xl whitespace-pre-line text-base text-[#d6dae1] sm:text-lg">
                        {"Trade BTC, ETH, XRP, LTC, and EOS with 100x leverage and\nthe lowest fees"}
                    </p>

                    <div className="mt-8 flex justify-center sm:justify-start">
                        <a href="/register" className="btn-gold">
                            Start trading now
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

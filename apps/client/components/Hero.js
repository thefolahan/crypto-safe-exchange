export default function Hero() {
    return (
        <section className="relative min-h-[78vh] overflow-hidden sm:min-h-[86vh]">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/hero-section.webp')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,10,.78)_0%,rgba(4,6,10,.72)_45%,rgba(4,6,10,.58)_100%)]" />

            <div className="site-container relative z-10 flex min-h-[78vh] items-center sm:min-h-[86vh]">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="title whitespace-pre-line text-balance text-[#f7f8fa]">
                        <span className="block whitespace-nowrap">Your Crypto Safe</span>
                        <span className="block">Starts Here</span>
                    </h1>
                    <p className="sub mt-6 max-w-2xl text-[#d6dae1]">
                        <span className="block whitespace-nowrap text-[0.75rem] sm:text-lg sm:whitespace-normal">
                            Store and protect your crypto assets in one secure vault.
                        </span>
                        <span className="mt-1 block text-[0.75rem] sm:mt-0 sm:text-lg">
                            Use your recovery phrase to access funds anytime.
                        </span>
                    </p>

                    <div className="mt-8 flex justify-center">
                        <a href="/login" className="btn-gold">
                            Go to Safe
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

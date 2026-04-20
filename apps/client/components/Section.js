export default function Section({ id, title, subtitle = "", className = "", children }) {
    return (
        <section id={id} className={`py-12 sm:py-16 ${className}`}>
            <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-4">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-[clamp(1.55rem,2.2vw,2.1rem)] font-extrabold">{title}</h2>
                    {subtitle ? (
                        <p className="mt-2 text-[rgba(167,178,204,.92)] mx-auto max-w-[70ch] leading-relaxed">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                <div>{children}</div>
            </div>
        </section>
    );
}

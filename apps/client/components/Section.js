export default function Section({ id, title, subtitle = "", label = "", centered = false, children }) {
    return (
        <section id={id} className="section-pad">
            <div className="site-container">
                <header className={`mb-8 sm:mb-10 ${centered ? "mx-auto flex max-w-3xl flex-col items-center text-center" : ""}`}>
                    {label ? <span className="kicker">{label}</span> : null}
                    <h2 className={`section-title mt-3 ${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}>{title}</h2>
                    {subtitle ? (
                        <p className={`section-sub ${centered ? "mx-auto text-center" : ""}`}>{subtitle}</p>
                    ) : null}
                </header>

                {children}
            </div>
        </section>
    );
}

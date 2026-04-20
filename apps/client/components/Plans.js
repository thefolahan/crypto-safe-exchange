import Section from "./Section";

const plans = [
    { name: "Basic", min: "$15,000", max: "$100,000", roi: "10%" },
    { name: "Compound", min: "$25,000", max: "$250,000", roi: "20%" },
    { name: "Deluxe", min: "$100,000", max: "$1,000,000", roi: "50%" },
];

export default function Plans() {
    return (
        <Section
            id="pricing"
            label="Pricing"
            title="Choose a plan that fits your investment target."
            centered
        >
            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan, index) => (
                    <article
                        key={plan.name}
                        className={`site-card flex flex-col p-5 sm:p-6 ${index === 1 ? "border-[rgba(221,192,138,.45)]" : ""}`}
                    >
                        <h3 className="text-xl font-semibold text-[#f6f7f9]">{plan.name}</h3>
                        <div className="mt-5 rounded-xl border border-[#2a303a] bg-[#0f1218] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Investment Range</p>
                            <p className="mt-2 break-words text-xl font-bold text-[var(--gold)]">
                                {plan.min} - {plan.max}
                            </p>
                        </div>

                        <ul className="mt-5 space-y-2 text-sm text-[#dce0e7]">
                            <li>Plan return: {plan.roi}</li>
                            <li>Referral bonus: 10%</li>
                            <li>Support: 24/7</li>
                            <li>Withdrawal tracking</li>
                        </ul>

                        <a href="/register" className="btn-gold mt-6">
                            Get Started
                        </a>
                    </article>
                ))}
            </div>
        </Section>
    );
}

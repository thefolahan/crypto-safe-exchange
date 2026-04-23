import Section from "./Section";

const plans = [
    { name: "Basic Safe", fee: "$0 / month", capacity: "Up to $25,000", support: "Email support" },
    { name: "Plus Safe", fee: "$19 / month", capacity: "Up to $250,000", support: "Priority support" },
    { name: "Premium Safe", fee: "$79 / month", capacity: "Up to $1,000,000", support: "24/7 concierge support" },
];

export default function Plans() {
    return (
        <Section
            id="pricing"
            label="Pricing"
            title="Choose a plan for your crypto safe."
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
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Storage Capacity</p>
                            <p className="mt-2 break-words text-xl font-bold text-[var(--gold)]">
                                {plan.capacity}
                            </p>
                        </div>

                        <ul className="mt-5 space-y-2 text-sm text-[#dce0e7]">
                            <li>Account fee: {plan.fee}</li>
                            <li>Recovery phrase backup</li>
                            <li>Support: {plan.support}</li>
                            <li>Withdrawal tracking</li>
                        </ul>

                        <a href="/register" className="btn-gold mt-6">
                            Create Safe
                        </a>
                    </article>
                ))}
            </div>
        </Section>
    );
}

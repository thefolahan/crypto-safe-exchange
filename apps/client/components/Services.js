import Section from "./Section";

const features = [
    {
        title: "Vault-First Protection",
        text: "Your account is designed around secure asset storage with hardened access and session safeguards.",
    },
    {
        title: "12-Word Recovery Access",
        text: "Recover account access with your 12-word phrase and keep ownership control in your hands.",
    },
    {
        title: "Protected Activity Timeline",
        text: "Track deposits, transfers, and withdrawals in a clear history built for accountability.",
    },
    {
        title: "Withdrawal Safety Controls",
        text: "Manage outflows through structured checks that reduce mistakes and unauthorized movement.",
    },
];

export default function Services() {
    return (
        <Section
            id="features"
            label="Features"
            title="Security Features for Your Crypto Safe"
            centered
        >
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                {features.map((feature) => (
                    <article key={feature.title} className="site-card p-5 sm:p-6">
                        <h3 className="text-xl font-semibold leading-tight text-[#f5f6f8]">{feature.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">{feature.text}</p>
                        <a href="/login" className="mt-4 inline-flex text-sm font-semibold text-[var(--gold)]">
                            Open Safe →
                        </a>
                    </article>
                ))}
            </div>
        </Section>
    );
}

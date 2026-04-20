import Section from "./Section";

const steps = [
    {
        step: "01",
        title: "Create Account",
        text: "Sign up securely and verify your profile details.",
    },
    {
        step: "02",
        title: "Deposit Funds",
        text: "Fund your account and choose your target market.",
    },
    {
        step: "03",
        title: "Trade & Monitor",
        text: "Execute and track performance through your dashboard.",
    },
];

export default function HowItWorks() {
    return (
        <Section
            id="about"
            label="How It Works"
            title="Get started in three straightforward steps."
            centered
        >
            <div className="grid gap-4 md:grid-cols-3">
                {steps.map((item) => (
                    <article key={item.step} className="site-card p-5 sm:p-6">
                        <div className="text-sm font-semibold tracking-[0.1em] text-[var(--gold)]">{item.step}</div>
                        <h3 className="mt-3 text-xl font-semibold text-[#f4f6f8]">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">{item.text}</p>
                    </article>
                ))}
            </div>
        </Section>
    );
}

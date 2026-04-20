import Section from "./Section";

const features = [
    {
        title: "Innovative Data Visualization",
        text: "Track price movement and account activity through clean charts and responsive market cards.",
    },
    {
        title: "User-Friendly Interface",
        text: "Every action is streamlined so traders can move from analysis to execution without friction.",
    },
    {
        title: "Customized Display",
        text: "Prioritize the instruments and metrics that matter to your strategy with flexible modules.",
    },
    {
        title: "Multi-Market Support",
        text: "Manage crypto, forex, and commodities from one environment with consistent workflows.",
    },
];

export default function Services() {
    return (
        <Section
            id="features"
            label="Features"
            title="Our Unique Features"
            centered
        >
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                {features.map((feature) => (
                    <article key={feature.title} className="site-card p-5 sm:p-6">
                        <h3 className="text-xl font-semibold leading-tight text-[#f5f6f8]">{feature.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">{feature.text}</p>
                        <a href="/register" className="mt-4 inline-flex text-sm font-semibold text-[var(--gold)]">
                            Learn More →
                        </a>
                    </article>
                ))}
            </div>
        </Section>
    );
}

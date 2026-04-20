import Section from "./Section";

const faqItems = [
    {
        q: "Can I visualize my own smart contract or token?",
        a: "Yes. After signing in, you can connect a supported wallet address and inspect token or contract activity through the dashboard tools.",
    },
    {
        q: "How often is the data updated?",
        a: "Market and account data are updated continuously from our feeds. News and analytics panels are refreshed automatically on a regular cycle.",
    },
    {
        q: "Can I export charts or data?",
        a: "Yes. You can export selected history and reports from supported sections in your account for external review or record keeping.",
    },
    {
        q: "Is my data private?",
        a: "Yes. Account data is protected with authenticated access and secure transmission. Only authorized sessions can access your private dashboard.",
    },
];

export default function Faq() {
    return (
        <Section
            id="faq"
            label="FAQ"
            title="Frequently Asked Questions"
            centered
        >
            <div className="site-card overflow-hidden">
                {faqItems.map((item, idx) => (
                    <details key={item.q} className={`${idx !== faqItems.length - 1 ? "border-b border-[#252b35]" : ""}`}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-[#e8ebf0] sm:px-5 sm:py-5 sm:text-base">
                            <span className="min-w-0 flex-1 break-words pr-2">{item.q}</span>
                            <span className="shrink-0 text-lg text-[var(--gold)]">+</span>
                        </summary>
                        <div className="px-4 pb-4 text-sm leading-relaxed text-[var(--muted)] sm:px-5">
                            {item.a}
                        </div>
                    </details>
                ))}
            </div>
        </Section>
    );
}

import Section from "./Section";

const plans = [
    { name: "Basic Plan", min: "$15000", max: "$100,000", rate: "10%", bonus: "10" },
    { name: "Compound Plan", min: "$25,000", max: "$250,000", rate: "20%", bonus: "10" },
    { name: "Deluxe Plan", min: "$100,000", max: "$1,000,000", rate: "50%", bonus: "10" },
];

export default function Plans() {
    return (
        <Section id="plans" title="Choose Investment" subtitle="Pick a plan that fits your budget and target.">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {plans.map((p) => (
                    <article
                        key={p.name}
                        className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,.10)] bg-[rgba(15,26,46,.55)] flex flex-col"
                    >
                        <div className="p-5 text-center font-extrabold text-white text-lg bg-gradient-to-br from-[rgba(47,107,255,.95)] to-[rgba(32,211,255,.75)]">
                            {p.name}
                        </div>

                        <div className="divide-y divide-[rgba(255,255,255,.06)] bg-[rgba(255,255,255,.02)]">
                            {[
                                ["Minimum Investment", p.min],
                                ["Top-up Rate", p.rate],
                                ["Maximum Investment", p.max],
                                ["Ref. Bonus", p.bonus],
                                ["Support", "24/7"],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between gap-4 p-4">
                                    <span className="text-[rgba(167,178,204,.92)] font-semibold">{label}</span>
                                    <span className="text-[rgba(234,240,255,.95)] font-extrabold">{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto p-5 bg-[rgba(255,255,255,.02)] border-t border-[rgba(255,255,255,.06)] flex justify-center">
                            <a className="btn primary full" href="/login">Invest</a>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    );
}

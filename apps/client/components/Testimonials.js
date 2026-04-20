import Section from "./Section";

const testimonials = [
    { name: "Verified forex trader", tag: "Forex", text: "Execution feels quick and the layout stays clean even when I’m moving fast." },
    { name: "Crypto swing trader", tag: "Crypto", text: "The dashboard is simple. I can track positions without a bunch of clutter." },
    { name: "Risk first trader", tag: "Risk", text: "Love that the flow encourages discipline. Easier to stick to a plan." },
    { name: "Mobile trader", tag: "Mobile", text: "On phone it’s actually usable — buttons, spacing, everything feels right." },
    { name: "Commodities trader", tag: "Markets", text: "Nice mix of markets in one place. Feels organized, not messy." },
    { name: "Beginner trader", tag: "Onboarding", text: "Signup didn’t stress me. The steps are straightforward and clear." },
    { name: "Day trader", tag: "Speed", text: "Pages load fast and I’m not fighting the UI. That matters a lot." },
    { name: "Part time trader", tag: "Ease", text: "I can jump in, check what I need, and place trades without wasting time." },
    { name: "Market analyst", tag: "Insights", text: "The way everything is structured makes it easier to focus on price action." },
    { name: "Consistency trader", tag: "Tracking", text: "I like being able to review results quickly — keeps me accountable." },
    { name: "Forex scalper", tag: "Forex", text: "Smooth execution feel. The platform doesn’t lag when the market spikes." },
    { name: "Crypto trader", tag: "Crypto", text: "It’s clean and modern. Doesn’t feel like those old clunky broker sites." },
    { name: "New user", tag: "Support", text: "Had a question and got help quickly. Didn’t feel ignored." },
    { name: "Index trader", tag: "Indices", text: "Indices are easy to find and the interface stays consistent everywhere." },
    { name: "Long term investor", tag: "Investing", text: "Good for building positions and monitoring without overcomplication." },
    { name: "News driven trader", tag: "Tools", text: "I like the quick market access. Less friction from idea to execution." },
    { name: "Late night trader", tag: "24/7", text: "Even at odd hours it feels stable. Withdrawal flow is also simple." },
    { name: "Portfolio builder", tag: "Planning", text: "Feels built for people who plan trades, not just chase moves." },
    { name: "Active trader", tag: "UX", text: "The design feels calm even when markets are moving. That’s rare." },
    { name: "Execution tester", tag: "Flows", text: "Deposit/withdraw steps are simple — no weird hidden steps." },
];

export default function Testimonials() {
    return (
        <Section id="testimonials" title="What traders say">
            <div className="marqueeWrap coolMarquee">
                <div className="marqueeFade left" aria-hidden="true" />
                <div className="marqueeFade right" aria-hidden="true" />

                <div className="marqueeTrack">
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <div className="marqueeCard2" key={i}>
                            <div className="marqueeTop">
                                <span className="marqueeChip">{t.tag}</span>
                                <span className="marqueeStars" aria-hidden="true">
                                    ★★★★★
                                </span>
                            </div>

                            <p className="marqueeText2">“{t.text}”</p>

                            <div className="marqueeBottom">
                                <span className="marqueeName2">{t.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

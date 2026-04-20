"use client";

import Section from "./Section";

const traders = [
    { role: "Marketing Manager", name: "Sarah Willburn", img: "/assets/images/Sarah%20Willburn.jpg" },
    { role: "Trading Manager", name: "Denise Fletcher", img: "/assets/images/Denise%20Fletcher.jpg" },
    { role: "Mining Manager", name: "Jeffery Kumar", img: "/assets/images/Jeffery%20Kumar.jpg" },
];

const investors = [
    { role: "Top Trading Investor", name: "Mark Cuban", img: "/assets/images/Mark%20Cuban.webp" },
    { role: "Top Mining Investor", name: "Omar Bin Sultan Al Olama", img: "/assets/images/Omar%20Bin%20Sultan%20Al%20Olama.jpg" },
    { role: "Investment Strategist", name: "Cathie Wood", img: "/assets/images/Cathie%20Wood.jpg" },
];

function CardGrid({ items }) {
    return (
        <div className="teamGrid">
            {items.map((x) => (
                <article className="teamCard" key={x.name}>
                    <div className="teamMedia">
                        <img
                            className="teamMediaImg"
                            src={x.img}
                            alt={x.name}
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>

                    <div className="teamInfo">
                        <div className="teamRole muted smallcaps">{x.role}</div>
                        <div className="teamName">{x.name}</div>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function TeamGrid() {
    return (
        <Section id="team" title="Top Investors & Traders" subtitle="The people behind the edge.">
            <div className="teamSplit">
                <div className="teamHeader center">
                    <div className="h3">Top Investors</div>
                </div>
                <CardGrid items={investors} />
            </div>

            <div className="teamSplit">
                <div className="teamHeader center">
                    <div className="h3">Top Traders</div>
                </div>
                <CardGrid items={traders} />
            </div>
        </Section>
    );
}

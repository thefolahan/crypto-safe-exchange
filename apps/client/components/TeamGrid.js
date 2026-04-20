import Section from "./Section";

const team = [
    { role: "Trading Manager", name: "Denise Fletcher", img: "/assets/images/Denise Fletcher.jpg" },
    { role: "Mining Manager", name: "Jeffery Kumar", img: "/assets/images/Jeffery Kumar.jpg" },
    { role: "Marketing Manager", name: "Sarah Willburn", img: "/assets/images/Sarah Willburn.jpg" },
    { role: "Top Investor", name: "Mark Cuban", img: "/assets/images/Mark Cuban.webp" },
    { role: "Strategic Advisor", name: "Cathie Wood", img: "/assets/images/Cathie Wood.jpg" },
    { role: "Global Partner", name: "Omar Bin Sultan Al Olama", img: "/assets/images/Omar Bin Sultan Al Olama.jpg" },
];

export default function TeamGrid() {
    return (
        <Section
            id="team"
            kicker="Leadership"
            title="Experienced operators and market specialists."
            subtitle="A cross-functional team focused on execution quality, user safety, and market intelligence."
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((person) => (
                    <article key={person.name} className="glass overflow-hidden">
                        <img
                            src={person.img}
                            alt={person.name}
                            className="h-60 w-full object-cover sm:h-64"
                            loading="lazy"
                        />
                        <div className="p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{person.role}</p>
                            <h3 className="mt-2 text-xl font-bold text-slate-50">{person.name}</h3>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    );
}

import Section from "./Section";

const notableUsers = [
    { name: "Mark Cuban", img: "/assets/images/Mark-Cuban.jpg" },
    { name: "Steve Ballmer", img: "/assets/images/Steve-Ballmer.jpg" },
    { name: "Richard Branson", img: "/assets/images/Richard-Branson.jpg" },
    { name: "Jenny Johnson", img: "/assets/images/Jenny-Johnson.webp" },
    { name: "Elizabeth Stark", img: "/assets/images/Elizabeth-Stark.webp" },
    { name: "Gracy Chen", img: "/assets/images/Gracy-Chen.jpeg" },
];

export default function NotableUsers() {
    return (
        <Section
            id="notable-users"
            label="NOTABLE USERS"
            title="Trusted by notable investors."
            centered
        >
            <div className="grid gap-4 md:grid-cols-3">
                {notableUsers.map((user) => (
                    <article key={user.name} className="site-card relative h-64 overflow-hidden">
                        <img
                            src={user.img}
                            alt={user.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-5 pt-10 text-center">
                            <h3 className="text-lg font-semibold text-[#f6f7f9]">{user.name}</h3>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    );
}

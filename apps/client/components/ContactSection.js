import Section from "./Section";

const socials = ["Discord", "Twitter", "Instagram", "Youtube", "LinkedIn"];

export default function ContactSection() {
    return (
        <Section id="contact" label="Contact" title="Contact Us" centered>
            <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
                <div className="site-card rounded-xl px-4 py-4 text-sm text-[var(--muted)] sm:px-5">
                    info@cryptoearnings.org
                </div>
                <div className="site-card rounded-xl px-4 py-4 text-sm text-[var(--muted)] sm:px-5">
                    contactus@cryptoearnings.org
                </div>
            </div>

            <div className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-5">
                {socials.map((social) => (
                    <a
                        key={social}
                        href="#"
                        className="site-card rounded-xl px-3 py-3 text-center text-sm text-[#dce1e9] transition hover:border-[rgba(221,192,138,.35)]"
                    >
                        {social}
                    </a>
                ))}
            </div>
        </Section>
    );
}

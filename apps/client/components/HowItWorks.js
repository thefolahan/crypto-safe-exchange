import Section from "./Section";

const steps = [
    { title: "Register", text: "Signup on your PC or mobile with your first name, last name, email & mobile number.", icon: "/assets/svgs/register.svg" },
    { title: "Verify & Deposit", text: "Complete verification and fund your account.", icon: "/assets/svgs/verification.svg" },
    { title: "Trade & Withdraw", text: "Earn profits, enter your bitcoin address, specify the amount and withdraw.", icon: "/assets/svgs/withdraw.svg" },
];

export default function HowItWorks() {
    return (
        <Section id="how" title="How it works" subtitle="Start trading in a simple flow.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 text-center">
                {steps.map((s) => (
                    <div
                        key={s.title}
                        className="rounded-3xl border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.04)] p-5 sm:p-6"
                    >
                        <div className="mx-auto mb-4 grid place-items-center h-20 w-20 rounded-full border border-[rgba(255,255,255,.10)] bg-[rgba(255,255,255,.04)] shadow-[0_16px_45px_rgba(0,0,0,.25)]">
                            <img src={s.icon} alt="" className="h-10 w-10 object-contain opacity-95" />
                        </div>

                        <h3 className="text-xl font-extrabold">{s.title}</h3>
                        <p className="mt-2 text-[rgba(167,178,204,.92)] leading-relaxed mx-auto max-w-[40ch]">
                            {s.text}
                        </p>
                    </div>
                ))}
            </div>
        </Section>
    );
}

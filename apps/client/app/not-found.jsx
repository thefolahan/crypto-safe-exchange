import Link from "next/link";

export default function NotFoundPage() {
    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/hero1.webp')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,.88)_0%,rgba(7,9,13,.92)_100%)]" />

            <section className="relative z-10 w-full max-w-xl rounded-3xl border border-[#2f3949] bg-[#101621] p-7 text-center shadow-[0_20px_56px_rgba(0,0,0,.45)] sm:p-9">
                <img
                    src="/assets/svgs/logo.svg?v=btc-shield-1"
                    alt="Crypto Safe Exchange logo"
                    className="mx-auto h-16 w-16"
                />
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[.14em] text-[var(--gold)]">404</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl">
                    Page Not Found
                </h1>
                <p className="mt-3 text-sm font-semibold text-[var(--muted)] sm:text-base">
                    The page you requested does not exist or has been moved.
                </p>

                <div className="mt-7">
                    <Link href="/" className="btn-gold inline-flex h-11 items-center px-6">
                        Back to Home
                    </Link>
                </div>
            </section>
        </main>
    );
}

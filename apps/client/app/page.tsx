import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Services from "../components/Services";
import BitcoinPrice from "../components/BitcoinPrice";
import Plans from "../components/Plans";
import Faq from "../components/Faq";
import News from "../components/News";
import Footer from "../components/Footer";

export default function HomePage() {
    return (
        <>
            <Navbar />
            <main className="overflow-x-clip">
                <Hero />
                <HowItWorks />
                <Services />

                <section className="section-pad">
                    <div className="site-container">
                        <BitcoinPrice />
                    </div>
                </section>

                <Plans />
                <Faq />
                <News />
            </main>
            <Footer />
        </>
    );
}

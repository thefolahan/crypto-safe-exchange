import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Services from "../components/Services";
import BitcoinPrice from "../components/BitcoinPrice";
import Plans from "../components/Plans";
import NotableUsers from "../components/NotableUsers";
import Faq from "../components/Faq";
import News from "../components/News";
import Footer from "../components/Footer";

export default function HomePage() {
    return (
        <>
            <Navbar />
            <main className="overflow-x-clip">
                <Hero />
                <Services />
                <NotableUsers />
                <Plans />
                <section className="section-pad">
                    <div className="site-container">
                        <BitcoinPrice />
                    </div>
                </section>
                <News />
                <Faq />
            </main>
            <Footer />
        </>
    );
}

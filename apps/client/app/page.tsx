import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BitcoinPrice from "../components/BitcoinPrice";
import Section from "../components/Section";
import Products from "../components/Products";
import Services from "../components/Services";
import HowItWorks from "../components/HowItWorks";
import Plans from "../components/Plans";
import Testimonials from "../components/Testimonials";
import TeamGrid from "../components/TeamGrid";
import News from "../components/News";
import Footer from "../components/Footer";

export default function HomePage() {
    return (
        <>
            <Navbar/>
            <main>
                <Hero/>

                <Section id="about" title="What is Crypto Earnings?" className="sectionCenter">
                    <p className="lead">
                        Crypto Earnings is a modern trading platform built to make market participation simpler,
                        faster, and more accessible. We help traders explore opportunities across Forex, Crypto,
                        and other major markets using a smooth interface and reliable execution tools.
                    </p>

                    <p className="lead">
                        From beginners learning the basics to experienced traders refining their edge, Crypto Earnings
                        provides the features needed to plan, execute, and track trades effectively. You can trade
                        manually or apply rule based strategies using predefined parameters helping you stay disciplined
                        while focusing on risk management and long term consistency.
                    </p>
                </Section>

                <Products/>
                <Services/>
                <HowItWorks/>
                <Plans/>

                <div className="container" style={{marginTop: 24}}>
                    <BitcoinPrice/>
                </div>

                <div className="container" style={{ marginTop: 40 }}>
                    <div className="videoWrap">
                        <iframe
                            src="https://www.youtube.com/embed/tZOSQBP946Q?start=40&autoplay=1&mute=1&rel=0&modestbranding=1"
                            title="Crypto Earnings Video"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    </div>
                </div>

                <Testimonials/>
                <TeamGrid/>
                <News/>
            </main>
            <Footer/>
        </>
    );
}

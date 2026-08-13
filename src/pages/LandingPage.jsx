import SeoHead from "../components/SeoHead.jsx";
import PublicNavbar from "../components/PublicNavbar.jsx";
import PublicFooter from "../components/PublicFooter.jsx";
import Hero from "../components/Hero.jsx";
import BeforeAfter from "../components/BeforeAfter.jsx";
import SubscribedMadrassasMarquee from "../components/SubscribedMadrassasMarquee.jsx";
import FeatureSpotlights from "../components/FeatureSpotlights.jsx";
import Features from "../components/Features.jsx";
import AudienceSplit from "../components/AudienceSplit.jsx";
import Pricing from "../components/Pricing.jsx";
import FinalCta from "../components/FinalCta.jsx";
import ContactSection from "../components/ContactSection.jsx";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#171717]">
      <SeoHead
        description="Run your Madrassa's Milad-un-Nabi festival end to end: registrations, live schedules, category results and public leaderboards — all in one platform built for madrassa committees. Introductory pricing from ₹399 for one Madrassa's Milad-e-Nabi festival."
        path="/"
      />
      <PublicNavbar />
      <main>
        <Hero />
        <SubscribedMadrassasMarquee />
        <BeforeAfter />
        <FeatureSpotlights />
        <Features />
        <AudienceSplit />
        <Pricing />
        <FinalCta />
        <ContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}

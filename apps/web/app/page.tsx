"use client";

import "./landing.css";
import {
  LandingNav,
  HeroSection,
  CoreCapabilitiesSection,
  CTASection,
  LandingFooter,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="landing-root">
      <LandingNav />
      <HeroSection />
      <CoreCapabilitiesSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}

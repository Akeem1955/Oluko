import { lazy, Suspense } from "react";
import { useLandingAnimations } from "@/lib/hooks/landing/useLandingAnimations";
import { LandingBackground } from "@/components/layout/landing/LandingBackground";
import { LandingHeader } from "@/components/layout/landing/LandingHeader";
import { LandingHero } from "@/components/layout/landing/LandingHero";

// Lazy load below-the-fold sections
const LandingEcosystem = lazy(() =>
  import("@/components/layout/landing/LandingEcosystem").then((m) => ({
    default: m.LandingEcosystem,
  })),
);
const LandingFeatures = lazy(() =>
  import("@/components/layout/landing/LandingFeatures").then((m) => ({
    default: m.LandingFeatures,
  })),
);
const LandingTestimonial = lazy(() =>
  import("@/components/layout/landing/LandingTestimonial").then((m) => ({
    default: m.LandingTestimonial,
  })),
);
const LandingWorkflow = lazy(() =>
  import("@/components/layout/landing/LandingWorkflow").then((m) => ({
    default: m.LandingWorkflow,
  })),
);
const LandingCTA = lazy(() =>
  import("@/components/layout/landing/LandingCTA").then((m) => ({
    default: m.LandingCTA,
  })),
);
const LandingFooter = lazy(() =>
  import("@/components/layout/landing/LandingFooter").then((m) => ({
    default: m.LandingFooter,
  })),
);

export default function Landing() {
  const {
    isMenuOpen,
    setIsMenuOpen,
    scrolled,
    heroRef,
    ecoRef,
    opacity,
    scale,
  } = useLandingAnimations();

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#02040c] text-slate-900 dark:text-white selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
      <LandingBackground />

      <LandingHeader
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <main className="relative z-10">
        <LandingHero heroRef={heroRef} opacity={opacity} scale={scale} />

        <Suspense fallback={null}>
          <LandingEcosystem ecoRef={ecoRef} />

          <LandingFeatures />

          <LandingTestimonial />

          <LandingWorkflow />

          <LandingCTA />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <LandingFooter />
      </Suspense>
    </div>
  );
}

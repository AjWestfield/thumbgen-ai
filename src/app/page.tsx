import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/landing/Hero";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";

// Dynamic imports - code splitting for below-fold components
// Reduces initial bundle size by deferring these heavy components
const PersonasFeature = dynamic(
  () => import("@/components/landing/PersonasFeature").then((m) => m.PersonasFeature)
);
const Features = dynamic(
  () => import("@/components/landing/Features").then((m) => m.Features)
);
const Pricing = dynamic(
  () => import("@/components/landing/Pricing").then((m) => m.Pricing)
);

export default function Home() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <PersonasFeature />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />

      <footer className="w-full border-t border-zinc-900 bg-black py-8 text-center text-xs text-zinc-600">
        <div className="container mx-auto">
          <p className="mb-2">© 2025 ThumbZap. Viral thumbnails in seconds.</p>
          <div className="flex justify-center gap-4 text-zinc-700">
            <a href="#" className="hover:text-zinc-500">Privacy</a>
            <a href="#" className="hover:text-zinc-500">Terms</a>
            <a href="#" className="hover:text-zinc-500">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

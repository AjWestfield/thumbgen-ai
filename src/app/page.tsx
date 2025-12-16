import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { PersonasFeature } from "@/components/landing/PersonasFeature";

export default function Home() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <Navbar />
      <Hero />
      <PersonasFeature />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />

      <footer className="w-full border-t border-zinc-900 bg-black py-8 text-center text-xs text-zinc-600">
        <div className="container mx-auto">
          <p className="mb-2">© 2024 AI Thumbnails. Designed with YouTube aesthetics.</p>
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

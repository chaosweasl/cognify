// Moved landing page logic here from /
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { FinalCTA } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <Hero />
      <Features />
      <FinalCTA />
      <Footer />
    </div>
  );
}

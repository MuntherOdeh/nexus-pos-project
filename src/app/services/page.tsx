import type { Metadata } from "next";
import { Services, Clients } from "@/components/sections";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Complete POS solutions including restaurant POS, cafe POS, retail systems, hardware, and custom development. Professional point of sale solutions in UAE.",
};

export default function ServicesPage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
              What We Offer
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Our Solutions
            </h1>
            <p className="text-xl text-primary-100">
              From restaurant POS to retail systems, we provide complete
              point of sale solutions tailored to your business needs.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <Services showAll />

      {/* Clients - Will not render if empty */}
      <Clients />
    </>
  );
}

import type { Metadata } from "next";
import { About, Clients, WhyChooseUs } from "@/components/sections";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about NexusPoint - a professional POS solutions company in UAE specialized in point of sale systems for restaurants, cafes, and retail shops.",
};

export default function AboutPage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
              Who We Are
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              About NexusPoint
            </h1>
            <p className="text-xl text-primary-100">
              Your trusted POS partner in the UAE, delivering smart solutions
              for restaurants, cafes, and retail businesses.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <About showFull />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Clients - Will not render if empty */}
      <Clients />
    </>
  );
}

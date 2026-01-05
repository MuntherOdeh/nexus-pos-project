import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/sections";
import { COMPANY_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with NexusPoint for POS solutions, restaurant systems, and retail point of sale in UAE. We're here to help transform your business.",
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Phone,
      title: "Phone",
      description: "Call us directly",
      value: COMPANY_INFO.phone,
      href: `tel:${COMPANY_INFO.phone}`,
    },
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email",
      value: COMPANY_INFO.email,
      href: `mailto:${COMPANY_INFO.email}`,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Message us on WhatsApp",
      value: "Chat Now",
      href: COMPANY_INFO.social.whatsapp || "#",
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Our base",
      value: COMPANY_INFO.address,
      href: COMPANY_INFO.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(COMPANY_INFO.address)}`,
    },
  ];

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-4">
              Get In Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-primary-100">
              Ready to streamline your business? Let&apos;s discuss how NexusPoint
              can help you achieve your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Get In Touch With Us
              </h2>
              <p className="text-neutral-600 mb-8">
                We&apos;re here to help and answer any questions you might have.
                Get a free demo and see how NexusPoint can transform your business.
              </p>

              <div className="space-y-6">
                {contactMethods.map((method) => (
                  <a
                    key={method.title}
                    href={method.href}
                    target={method.title === "WhatsApp" || method.title === "Location" ? "_blank" : undefined}
                    rel={method.title === "WhatsApp" || method.title === "Location" ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {method.title}
                      </h3>
                      <p className="text-sm text-neutral-500 mb-1">
                        {method.description}
                      </p>
                      <p className="text-primary-600 group-hover:text-primary-700">
                        {method.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Business Hours */}
              <div className="mt-8 p-6 bg-neutral-50 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">Business Hours</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Sunday - Thursday</span>
                    <span className="text-neutral-900 font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Friday - Saturday</span>
                    <span className="text-neutral-900 font-medium">Closed</span>
                  </div>
                </div>
              </div>

              {/* Free Demo CTA */}
              <div className="mt-6 p-6 bg-primary-50 border border-primary-100 rounded-2xl">
                <h3 className="font-semibold text-neutral-900 mb-2">Get a Free Demo</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  See NexusPoint in action. Schedule a free demo and discover how our
                  POS solutions can streamline your business operations.
                </p>
                <div className="flex items-center gap-2 text-primary-600 font-medium">
                  <Phone className="w-4 h-4" />
                  <span>Call us to schedule</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-neutral-50 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Send Us a Message
                </h2>
                <p className="text-neutral-600 mb-8">
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="relative h-96 bg-gradient-to-br from-primary-900 to-primary-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-primary-300" />
            <h3 className="text-2xl font-bold mb-2">Our Location</h3>
            <p className="text-primary-200 mb-6 max-w-md">
              {COMPANY_INFO.address}
            </p>
            <a
              href={COMPANY_INFO.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_INFO.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              Open in Google Maps
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

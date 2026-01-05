import { Metadata } from 'next';
import { COMPANY_INFO } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'NexusPoint privacy policy - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="py-20">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-neutral-600">
              Last updated: January 1, 2024
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-neutral max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                NexusPoint (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our POS services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                Personal Information
              </h3>
              <p className="text-neutral-600 leading-relaxed mb-4">
                When you use our contact form or request our services, we may collect:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Business name</li>
                <li>Message content</li>
              </ul>

              <h3 className="text-xl font-semibold text-neutral-800 mb-3 mt-6">
                Automatically Collected Information
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                We automatically collect certain information when you visit our website, including your IP address, browser type, operating system, and browsing behavior.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Respond to your inquiries and provide customer support</li>
                <li>Deliver the POS services you request</li>
                <li>Send you updates about our services (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                4. Information Sharing
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2 mt-4">
                <li>With service providers who assist us in operating our business</li>
                <li>When required by law or legal process</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>With your consent</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                5. Data Security
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                6. Your Rights
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                7. Cookies
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Our website uses cookies to enhance your browsing experience. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                8. Changes to This Policy
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                9. Contact Us
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-neutral-100 rounded-lg">
                <p className="text-neutral-700">
                  <strong>Email:</strong> {COMPANY_INFO.email}<br />
                  <strong>Phone:</strong> {COMPANY_INFO.phone}<br />
                  <strong>Location:</strong> {COMPANY_INFO.address}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

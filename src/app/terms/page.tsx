import { Metadata } from 'next';
import { COMPANY_INFO } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'NexusPoint terms of service - Read our terms and conditions for using our POS services.',
};

export default function TermsOfServicePage() {
  return (
    <main className="py-20">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-neutral-600">
              Last updated: January 1, 2024
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-neutral max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                1. Agreement to Terms
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                By accessing or using NexusPoint&apos;s website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                2. Services
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                NexusPoint provides POS services including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2 mt-4">
                <li>Restaurant POS Systems</li>
                <li>Cafe & Coffee Shop POS</li>
                <li>Retail Shop POS</li>
                <li>POS Hardware (Terminals, Tablets, Peripherals)</li>
                <li>Custom POS Development</li>
                <li>Cloud Management Systems</li>
                <li>Technical Support and Maintenance</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                3. User Responsibilities
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                When using our services, you agree to:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the confidentiality of any account credentials</li>
                <li>Use our services only for lawful purposes</li>
                <li>Not interfere with the proper functioning of our services</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                4. Payment Terms
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Payment terms for our services will be specified in individual service agreements or quotations. Unless otherwise agreed, payment is due upon completion of services or as specified in the invoice.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                All content on our website, including text, graphics, logos, and software, is the property of NexusPoint or its licensors and is protected by intellectual property laws. Upon full payment, clients receive appropriate rights to deliverables as specified in service agreements.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                To the maximum extent permitted by law, NexusPoint shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services. Our total liability shall not exceed the amount paid by you for the specific service giving rise to the claim.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                7. Warranty Disclaimer
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Our services are provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, error-free, or completely secure.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                8. Service Warranty
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Specific warranty terms for individual services will be outlined in service agreements. Generally, we provide support for any issues directly related to the work we have performed within the warranty period specified.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                9. Termination
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                Either party may terminate ongoing services with written notice as specified in the service agreement. Upon termination, all outstanding payments become immediately due, and each party shall return or destroy any confidential information of the other party.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                10. Governing Law
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of the UAE.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after any changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                12. Contact Information
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                For questions about these Terms of Service, please contact us:
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

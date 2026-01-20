import type { Metadata } from "next";
import { SiteHeader } from "@/component/SiteHeader";
import { SiteFooter } from "@/component/SiteFooter";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms of Service for Orca CLI",
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] selection:bg-emerald-500/30 text-neutral-300">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <SiteHeader />

                <div className="py-16 max-w-4xl mx-auto">
                    <h1 className="mb-8 text-4xl font-bold tracking-tight text-white md:text-5xl">
                        Terms of Service
                    </h1>

                    <div className="prose prose-invert prose-emerald max-w-none">
                        <p className="text-lg text-neutral-400 mb-8">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                            <p className="mb-4">
                                Welcome to Orca CLI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our command-line interface tool, website, and related services (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of the terms, then you may not access the Service.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">2. Usage License</h2>
                            <p className="mb-4">
                                Permission is granted to temporarily download one copy of the materials (information or software) on Orca CLI&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license, you may not:
                            </p>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>Modify or copy the materials;</li>
                                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                                <li>Attempt to decompile or reverse engineer any software contained on Orca CLI&apos;s website or tools;</li>
                                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                                <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
                            <p className="mb-4">
                                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                            </p>
                            <p className="mb-4">
                                You are responsible for safeguarding the credentials that you use to access the Service and for any activities or actions under your account.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">4. Intellectual Property</h2>
                            <p className="mb-4">
                                The Service and its original content, features, and functionality are and will remain the exclusive property of Orca CLI and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">5. API Usage</h2>
                            <p className="mb-4">
                                Our CLI interacts with various AI providers (OpenAI, Gemini, etc.). You are responsible for any API keys you bring to the platform (&quot;Bring Your Own Key&quot;) and for complying with the terms of service of those respective providers. We do not store your API keys on our servers; they are managed locally on your device or securely transmitted for the sole purpose of generating content.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
                            <p className="mb-4">
                                In no event shall Orca CLI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">7. Changes</h2>
                            <p className="mb-4">
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
                            <p className="mb-4">
                                If you have any questions about these Terms, please contact us at support@orcacli.codes.
                            </p>
                        </section>
                    </div>
                </div>

                <SiteFooter />
            </div>
        </main>
    );
}

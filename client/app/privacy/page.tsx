import type { Metadata } from "next";
import { SiteHeader } from "@/component/SiteHeader";
import { SiteFooter } from "@/component/SiteFooter";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for Orca CLI",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] selection:bg-emerald-500/30 text-neutral-300">
            <div className="container mx-auto px-4 py-8">
                <SiteHeader />

                <div className="py-16 max-w-4xl mx-auto">
                    <h1 className="mb-8 text-4xl font-bold tracking-tight text-white md:text-5xl">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-invert prose-emerald max-w-none">
                        <p className="text-lg text-neutral-400 mb-8">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">1. Information Collection</h2>
                            <p className="mb-4">
                                We collect information you provide directly to us, such as when you create an account, subscribe to a newsletter, or communicate with us. This may include your name, email address, and any other information you choose to provide.
                            </p>
                            <p className="mb-4">
                                When you use our CLI tool, we may collect certain telemetry data to help us improve the tool. This includes command usage statistics, error reports, and performance metrics. We do NOT collect your private code or the contents of your repositories unless explicitly authorized for specific features (like PR generation), and even then, data is transient and not permanently stored.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Information</h2>
                            <p className="mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>Provide, maintain, and improve our services;</li>
                                <li>Process transactions and send related information, including confirmations and invoices;</li>
                                <li>Send you technical notices, updates, security alerts, and support and administrative messages;</li>
                                <li>Respond to your comments, questions, and requests;</li>
                                <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">3. AI Data Processing</h2>
                            <p className="mb-4">
                                Orca CLI utilizes third-party AI models (e.g., OpenAI, Gemini) to generate commit messages and other content. When you trigger these features, necessary context (such as git diffs) is sent to these providers.
                            </p>
                            <p className="mb-4">
                                Note that if you use your own API keys (&quot;Bring Your Own Key&quot;), your data handling is also subject to the privacy policies of those respective AI providers. We do not store your API keys on our servers.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
                            <p className="mb-4">
                                We implement appropriate technical and organizational measures to protect specific personal data processed by us. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies</h2>
                            <p className="mb-4">
                                We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">6. Third-Party Links</h2>
                            <p className="mb-4">
                                Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party&apos;s site. We strongly advise you to review the Privacy Policy of every site you visit.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Us</h2>
                            <p className="mb-4">
                                If you have any questions about this Privacy Policy, please contact us at privacy@orcacli.codes.
                            </p>
                        </section>
                    </div>
                </div>

                <SiteFooter />
            </div>
        </main>
    );
}

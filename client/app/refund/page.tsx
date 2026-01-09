import type { Metadata } from "next";
import { SiteHeader } from "@/component/SiteHeader";
import { SiteFooter } from "@/component/SiteFooter";

export const metadata: Metadata = {
    title: "Refund Policy",
    description: "Refund Policy for Orca CLI",
};

export default function RefundPage() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] selection:bg-emerald-500/30 text-neutral-300">
            <div className="container mx-auto px-4 py-8">
                <SiteHeader />

                <div className="py-16 max-w-4xl mx-auto">
                    <h1 className="mb-8 text-4xl font-bold tracking-tight text-white md:text-5xl">
                        Refund Policy
                    </h1>

                    <div className="prose prose-invert prose-emerald max-w-none">
                        <p className="text-lg text-neutral-400 mb-8">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">1. Free Tier</h2>
                            <p className="mb-4">
                                Orca CLI offers a generous free tier that is available to everyone indefinitely. We encourage you to try the free version to ensure the software meets your needs before upgrading to any paid plan.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">2. Subscription Refunds</h2>
                            <p className="mb-4">
                                If you are not satisfied with your purchase of a paid subscription (e.g., Pro or Team plans), you may request a refund within <strong>7 days</strong> of your initial purchase.
                            </p>
                            <p className="mb-4">
                                To be eligible for a refund, you must contact our support team and provide proof of purchase. We reserve the right to decline a refund request if we detect abuse of the policy or if the account has violated our Terms of Service.
                            </p>
                            <p className="mb-4">
                                Refunds are granted only if the product has not been significantly used, defined as usage below a reasonable threshold of AI requests.
                            </p>
                            <p className="mb-4">
                                Due to the computational costs associated with AI-powered features, we reserve the right to deny refunds in cases of excessive usage or abuse.
                            </p>
                            <p className="mb-4">
                                Subscription renewals are non-refundable.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">3. Cancellation</h2>
                            <p className="mb-4">
                                You can cancel your subscription at any time. Your cancellation will take effect at the end of the current paid term. There are no refunds for partial months or unused time after the 7-day money-back guarantee period has expired.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">4. Enterprise Contracts</h2>
                            <p className="mb-4">
                                Refunds for Enterprise agreements are governed by the specific terms outlined in the signed Master Services Agreement (MSA) or purchasing contract. Please refer to your specific contract for details.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-white mb-4">5. How to Request a Refund</h2>
                            <p className="mb-4">
                                To request a refund, please email us at billing@orcacli.codes with the subject line &quot;Refund Request - [Your Username]&quot;. Please include your order number and a brief explanation of why you are requesting a refund. We use this feedback to improve our product.
                            </p>
                        </section>
                    </div>
                </div>

                <SiteFooter />
            </div>
        </main>
    );
}

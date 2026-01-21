import { Metadata } from "next";
import { SiteHeader } from "@/component/SiteHeader";
import { SiteFooter } from "@/component/SiteFooter";
import { GuideSection } from "@/component/GuideSection";

export const metadata: Metadata = {
    title: "Guide",
    description: "Master the Orca workflow, from your first commit to team collaboration.",
};

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-[#0c0c0c] text-neutral-100 font-sans selection:bg-emerald-500/30">
            <div className="max-w-7xl mx-auto py-4">
                <SiteHeader />
                <main className="mt-16">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl mb-6">
                            Docs
                        </h1>
                        <p className="text-lg text-neutral-400">
                            Learn how to generate semantic commit messages and publish Pull Requests with Orca CLI.
                        </p>
                    </div>

                    <GuideSection />

                    <div className="mt-24 border-t-2 border-dashed border-white/20 pt-16">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-900/20 to-black border border-emerald-500/30 p-8 md:p-12 text-center">
                            <h3 className="mb-4 text-2xl font-bold text-white">Still have questions?</h3>
                            <p className="mb-8 text-neutral-400 max-w-2xl mx-auto">
                                Check out our FAQ or join the community on GitHub discussions.
                            </p>
                            <a href="/#faq" className="inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white px-6 py-3 font-semibold hover:bg-emerald-400 transition-colors">
                                View FAQ
                            </a>
                        </div>
                    </div>
                </main>
                <SiteFooter />
            </div>
        </div>
    );
}

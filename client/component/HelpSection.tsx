
import Link from "next/link";
import { BookIcon, TerminalIcon } from "./icons";

export const HelpSection = () => {
    return (
        <section id="help" className="grid gap-16 py-16 border-t-2 border-dashed border-white/20">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-4 uppercase inline-flex items-center gap-2 justify-center">
                    <TerminalIcon className="h-5 w-5 text-emerald-400" />
                    Command Reference
                </h2>
                <p className="text-neutral-400 mb-8">
                    Complete guide to the Orca CLI toolset.
                </p>

                <Link
                    href="/guide"
                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-emerald-400 transition-colors"
                >
                    <BookIcon className="h-4 w-4" />
                    View Full Documentation
                </Link>
            </div>
        </section>
    );
};

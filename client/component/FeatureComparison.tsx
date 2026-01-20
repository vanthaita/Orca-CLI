import { Fragment } from "react";

export function FeatureComparison() {
    const features = [
        {
            category: 'Core Features',
            items: [
                { name: 'AI Commits/Day', free: '7', pro: 'Unlimited', team: 'Unlimited' },
                { name: 'Core Git Wrapper', free: true, pro: true, team: true },
                { name: 'AI Models', free: 'Gemini Flash', pro: 'All models*', team: 'All models*' },
            ],
        },
        {
            category: 'Premium Features',
            items: [
                { name: 'Auto-PR Workflow', free: false, pro: true, team: true },
                { name: 'AI Conflict Resolution', free: false, pro: true, team: true },
                { name: 'AI Release Notes', free: false, pro: true, team: true },
                { name: 'Custom Instructions', free: false, pro: true, team: true },
            ],
        },
        {
            category: 'Team Features',
            items: [
                { name: 'Shared Templates', free: false, pro: false, team: true },
                { name: 'Team Analytics', free: false, pro: false, team: true },
                { name: 'Team Members', free: '1', pro: '1', team: 'Up to 5' },
            ],
        },
        {
            category: 'Support',
            items: [
                { name: 'Support Level', free: 'Community', pro: 'Email', team: 'Priority' },
            ],
        },
    ];

    const renderValue = (value: boolean | string) => {
        if (typeof value === 'boolean') {
            return value ? (
                <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-neutral-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        }
        return <span className="text-neutral-300 font-medium">{value}</span>;
    };

    return (
        <div className="py-16">
            <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-white">
                    Feature Comparison
                </h2>
                <p className="text-neutral-400">
                    Choose the plan that fits your workflow
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-2 border-dashed border-white/20 rounded-xl overflow-hidden">
                    <thead>
                        <tr className="border-b-2 border-dashed border-white/20 bg-white/5">
                            <th className="p-4 text-left text-sm font-bold text-neutral-400 uppercase tracking-wide">
                                Feature
                            </th>
                            <th className="p-4 text-center text-sm font-bold text-neutral-400 uppercase tracking-wide">
                                Free
                            </th>
                            <th className="p-4 text-center text-sm font-bold text-emerald-400 uppercase tracking-wide bg-emerald-500/10">
                                Pro
                            </th>
                            <th className="p-4 text-center text-sm font-bold text-purple-400 uppercase tracking-wide">
                                Team
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((category, categoryIdx) => (
                            <Fragment key={`category-${categoryIdx}`}>
                                <tr className="border-b-2 border-dashed border-white/10 bg-white/5">
                                    <td colSpan={4} className="p-3 text-sm font-bold text-white uppercase tracking-wide">
                                        {category.category}
                                    </td>
                                </tr>
                                {category.items.map((item, itemIdx) => (
                                    <tr
                                        key={`${categoryIdx}-${itemIdx}`}
                                        className="border-b border-dashed border-white/10 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4 text-neutral-300">{item.name}</td>
                                        <td className="p-4 text-center">{renderValue(item.free)}</td>
                                        <td className="p-4 text-center bg-emerald-500/5">{renderValue(item.pro)}</td>
                                        <td className="p-4 text-center">{renderValue(item.team)}</td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 text-center text-sm text-neutral-500">
                * GPT-4o and Claude 3.5 Sonnet support coming soon
            </div>
        </div>
    );
}

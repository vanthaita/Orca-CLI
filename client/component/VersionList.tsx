import Link from "next/link";

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

export interface Release {
    tag_name: string;
    html_url: string;
    published_at: string;
    assets: ReleaseAsset[];
}

interface VersionListProps {
    releases: Release[];
    className?: string;
}

export const VersionList = ({ releases, className = "" }: VersionListProps) => {
    if (!releases || releases.length === 0) return null;

    return (
        <div className={`w-full overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/5 ${className}`}>
            <div className="border-b border-white/10 px-6 py-4 bg-white/5">
                <h3 className="font-bold text-neutral-200">Recent Releases</h3>
            </div>
            <div className="divide-y divide-white/10 max-h-[300px] overflow-y-auto custom-scrollbar">
                {releases.map((release) => {
                    const date = new Date(release.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    });

                    const msiAsset = release.assets.find((a) => a.name.endsWith(".msi"));
                    const downloadUrl = msiAsset?.browser_download_url || release.html_url;

                    return (
                        <div key={release.tag_name} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group">
                            <div className="flex flex-col gap-1">
                                <span className="font-mono text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
                                    {release.tag_name}
                                </span>
                                <span className="text-xs text-neutral-500">{date}</span>
                            </div>
                            <Link
                                href={downloadUrl}
                                target="_blank"
                                className="text-xs bg-white/10 hover:bg-white/20 text-neutral-300 px-3 py-1.5 rounded-md transition-colors font-medium"
                            >
                                {msiAsset ? "Download MSI" : "View Release"}
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

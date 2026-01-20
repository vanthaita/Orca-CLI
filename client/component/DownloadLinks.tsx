"use client";

import { useGithubReleases } from "@/hook/useGithub";

export function DownloadLinks() {
    const releasesQuery = useGithubReleases('vanthaita/Orca-CLI');
    const releases = releasesQuery.data ?? [];

    if (releasesQuery.isLoading) {
        return <div className="text-sm text-gray-500">Loading versions...</div>;
    }

    const windowsReleases = releases
        .map((release) => {
            const msiAsset = release.assets.find((asset) =>
                asset.name.endsWith(".msi")
            );
            return {
                ...release,
                msiAsset,
            };
        })
        .filter((release) => release.msiAsset);

    if (windowsReleases.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Versions (Windows)</h3>
            <ul className="space-y-2">
                {windowsReleases.map((release) => (
                    <li key={release.tag_name} className="flex items-center justify-between p-3 border-2 border-dashed border-white/20 rounded-lg bg-neutral-900/50 hover:bg-white/5 transition-colors">
                        <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{release.tag_name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                                {new Date(release.published_at).toLocaleDateString()}
                            </span>
                        </div>
                        {release.msiAsset && (
                            <a
                                href={release.msiAsset.browser_download_url}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Download MSI
                            </a>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

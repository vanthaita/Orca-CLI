export interface Release {
    tag_name: string;
    name: string;
    published_at: string;
    assets: Asset[];
}

export interface Asset {
    name: string;
    browser_download_url: string;
    size: number;
}

export async function getReleases(): Promise<Release[]> {
    try {
        const response = await fetch(
            "https://api.github.com/repos/vanthaita/orca/releases"
        );
        if (!response.ok) {
            console.error("Failed to fetch releases:", response.statusText);
            return [];
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching releases:", error);
        return [];
    }
}

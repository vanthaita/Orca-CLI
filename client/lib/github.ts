export interface Release {
    tag_name: string;
    name: string;
    html_url: string;
    published_at: string;
    assets: Asset[];
}

export interface Asset {
    name: string;
    browser_download_url: string;
    size: number;
}

export interface RepoInfo {
    stargazers_count: number;
}

export async function getReleases(repo: string = 'vanthaita/Orca-CLI'): Promise<Release[]> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${repo}/releases`
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

export async function getRepo(repo: string = 'vanthaita/Orca-CLI'): Promise<RepoInfo | null> {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        if (!response.ok) {
            console.error('Failed to fetch repo:', response.statusText);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching repo:', error);
        return null;
    }
}

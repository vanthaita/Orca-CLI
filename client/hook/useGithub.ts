import { useQuery } from '@tanstack/react-query';

import { getReleases, getRepo } from '@/lib/github';

export function useGithubReleases(repo: string) {
    return useQuery({
        queryKey: ['github', 'releases', repo],
        queryFn: async () => {
            return await getReleases(repo);
        },
        retry: 1,
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function useGithubRepo(repo: string) {
    return useQuery({
        queryKey: ['github', 'repo', repo],
        queryFn: async () => {
            return await getRepo(repo);
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

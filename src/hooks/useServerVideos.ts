import { useState, useCallback, useEffect, useRef } from 'react';

export interface ServerVideoFile {
    name: string;
    size: number;
    path: string;
}

interface UseServerVideosResult {
    videos: ServerVideoFile[];
    total: number;
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    search: (query: string) => void;
    loadMore: () => void;
    reset: () => void;
}

/**
 * Hook for fetching and searching server-side video files.
 * Provides debounced search and pagination support.
 */
export function useServerVideos(debounceMs: number = 300): UseServerVideosResult {
    const [videos, setVideos] = useState<ServerVideoFile[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // query state removed

    const [offset, setOffset] = useState(0);

    const debounceRef = useRef<number | null>(null);
    const currentQueryRef = useRef('');
    const limit = 50;

    const fetchVideos = useCallback(async (searchQuery: string, searchOffset: number, append: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                query: searchQuery,
                limit: String(limit),
                offset: String(searchOffset)
            });

            const res = await fetch(`/api/videos?${params}`);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to fetch videos');
            }

            const data = await res.json();

            setVideos(prev => append ? [...prev, ...data.videos] : data.videos);
            setTotal(data.total);
            setHasMore(data.hasMore);
            setOffset(searchOffset + data.videos.length);
        } catch (err: any) {
            setError(err.message || String(err));
            if (!append) {
                setVideos([]);
                setTotal(0);
                setHasMore(false);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const search = useCallback((newQuery: string) => {
        // Clear any pending debounce
        if (debounceRef.current !== null) {
            clearTimeout(debounceRef.current);
        }

        // setQuery(newQuery); // Unused

        currentQueryRef.current = newQuery;

        // Debounce the actual fetch
        debounceRef.current = window.setTimeout(() => {
            setOffset(0);
            fetchVideos(newQuery, 0, false);
        }, debounceMs);
    }, [debounceMs, fetchVideos]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchVideos(currentQueryRef.current, offset, true);
        }
    }, [loading, hasMore, offset, fetchVideos]);

    const reset = useCallback(() => {
        setVideos([]);
        setTotal(0);
        setHasMore(false);
        setOffset(0);
        // setQuery(''); // Unused

        setError(null);
        currentQueryRef.current = '';
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchVideos('', 0, false);

        return () => {
            if (debounceRef.current !== null) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [fetchVideos]);

    return {
        videos,
        total,
        hasMore,
        loading,
        error,
        search,
        loadMore,
        reset
    };
}

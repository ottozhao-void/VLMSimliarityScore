import { useState, useCallback, useEffect, useRef } from 'react';
import { QVHighlightsQuery } from './useAppState';

export interface UseQVHighlightsQueriesResult {
    queries: QVHighlightsQuery[];
    total: number;
    hasMore: boolean;
    loading: boolean;
    error: string | null;
    search: (query: string, windowsFilter?: string) => void;
    loadMore: () => void;
    reset: () => void;
}

/**
 * Hook for fetching and searching QVHighlights dataset queries.
 * Provides debounced search, filtering by relevant_windows count, and pagination support.
 */
export function useQVHighlightsQueries(debounceMs: number = 300): UseQVHighlightsQueriesResult {
    const [queries, setQueries] = useState<QVHighlightsQuery[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [offset, setOffset] = useState(0);

    const debounceRef = useRef<number | null>(null);
    const currentQueryRef = useRef('');
    const currentWindowsFilterRef = useRef('all');
    const limit = 50;

    const fetchQueries = useCallback(async (searchQuery: string, windowsFilter: string, searchOffset: number, append: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                query: searchQuery,
                limit: String(limit),
                offset: String(searchOffset),
                windows_filter: windowsFilter
            });

            const res = await fetch(`/api/qvhighlights/queries?${params}`);


            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to fetch queries');
            }

            const data = await res.json();

            setQueries(prev => append ? [...prev, ...data.queries] : data.queries);
            setTotal(data.total);
            setHasMore(data.hasMore);
            setOffset(searchOffset + data.queries.length);
        } catch (err: any) {
            setError(err.message || String(err));
            if (!append) {
                setQueries([]);
                setTotal(0);
                setHasMore(false);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const search = useCallback((newQuery: string, windowsFilter: string = 'all') => {
        // Clear any pending debounce
        if (debounceRef.current !== null) {
            clearTimeout(debounceRef.current);
        }

        currentQueryRef.current = newQuery;
        currentWindowsFilterRef.current = windowsFilter;

        // Debounce the actual fetch
        debounceRef.current = window.setTimeout(() => {
            setOffset(0);
            fetchQueries(newQuery, windowsFilter, 0, false);
        }, debounceMs);
    }, [debounceMs, fetchQueries]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchQueries(currentQueryRef.current, currentWindowsFilterRef.current, offset, true);
        }
    }, [loading, hasMore, offset, fetchQueries]);

    const reset = useCallback(() => {
        setQueries([]);
        setTotal(0);
        setHasMore(false);
        setOffset(0);
        setError(null);
        currentQueryRef.current = '';
        currentWindowsFilterRef.current = 'all';
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current !== null) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        queries,
        total,
        hasMore,
        loading,
        error,
        search,
        loadMore,
        reset
    };
}


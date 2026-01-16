import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, FileText, Loader2, Clock } from 'lucide-react';
import { useQVHighlightsQueries } from '../hooks/useQVHighlightsQueries';
import { QVHighlightsQuery } from '../hooks/useAppState';

interface QVHighlightsQueryPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (query: QVHighlightsQuery) => void;
}

// Filter options for relevant windows count
const WINDOW_FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: '=0', label: '=0' },
    { value: '=1', label: '=1' },
    { value: '=2', label: '=2' },
    { value: '>=3', label: '≥3' },
] as const;

/**
 * Quick Switcher-style modal for selecting QVHighlights dataset queries.
 * Features fuzzy search, relevant_windows filtering, keyboard navigation, and infinite scroll.
 */
export default function QVHighlightsQueryPicker({ isOpen, onClose, onSelect }: QVHighlightsQueryPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [windowsFilter, setWindowsFilter] = useState<string>('all');

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const { queries, total, hasMore, loading, error, search, loadMore, reset } = useQVHighlightsQueries();

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedIndex(0);
            setWindowsFilter('all');
            reset();
            // Trigger initial fetch
            search('', 'all');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, reset, search]);

    // Handle search input change
    useEffect(() => {
        search(searchTerm, windowsFilter);
        setSelectedIndex(0);
    }, [searchTerm, windowsFilter, search]);

    // Scroll selected item into view
    useEffect(() => {
        if (itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, queries.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (queries[selectedIndex]) {
                    onSelect(queries[selectedIndex]);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [queries, selectedIndex, onSelect, onClose]);

    // Infinite scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
            loadMore();
        }
    }, [hasMore, loading, loadMore]);

    // Format time ranges for display
    const formatTimeRanges = (windows: number[][]): string => {
        return windows.map(([start, end]) => {
            const formatTime = (seconds: number) => {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            return `${formatTime(start)}-${formatTime(end)}`;
        }).join(', ');
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Search Header */}
                <div className="p-4 border-b border-gray-100">
                    {/* Search Input Row */}
                    <div className="flex items-center gap-3">
                        <Search size={20} className="text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search queries..."
                            className="flex-1 text-lg bg-transparent outline-none placeholder:text-gray-400"
                        />
                        {loading && <Loader2 size={20} className="text-gray-400 animate-spin" />}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Capsule Filter Buttons */}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-500 mr-1">Windows:</span>
                        {WINDOW_FILTER_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setWindowsFilter(option.value)}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-150 ${windowsFilter === option.value
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                        {/* Sample count - pushed to the right */}
                        <span className="flex-1 text-right text-xs text-gray-500">
                            {total} 条样本
                        </span>
                    </div>
                </div>

                {/* Results List */}
                <div
                    ref={listRef}
                    className="max-h-[400px] overflow-y-auto"
                    onScroll={handleScroll}
                >
                    {error && (
                        <div className="p-4 text-center text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {!error && queries.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-400">
                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No queries found</p>
                        </div>
                    )}

                    {queries.map((query, index) => (
                        <button
                            key={query.qid}
                            ref={el => { itemRefs.current[index] = el; }}
                            onClick={() => {
                                onSelect(query);
                                onClose();
                            }}
                            className={`w-full px-4 py-3 flex flex-col gap-1 text-left transition-colors border-b border-gray-50 last:border-0
                                ${index === selectedIndex
                                    ? 'bg-gray-100'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            {/* Query Text */}
                            <p className="text-sm text-gray-900 line-clamp-2">
                                {query.query}
                            </p>

                            {/* Metadata Row */}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                    {query.vid}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {query.duration.toFixed(1)}s
                                </span>
                                {query.relevant_windows.length > 0 && (
                                    <span className="text-blue-600">
                                        {formatTimeRanges(query.relevant_windows)}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}

                    {loading && queries.length > 0 && (
                        <div className="p-4 text-center">
                            <Loader2 size={20} className="mx-auto text-gray-400 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>{total} queries</span>
                    <div className="flex items-center gap-4">
                        <span><kbd className="px-1.5 py-0.5 bg-white rounded border shadow-sm">↑↓</kbd> navigate</span>
                        <span><kbd className="px-1.5 py-0.5 bg-white rounded border shadow-sm">Enter</kbd> select</span>
                        <span><kbd className="px-1.5 py-0.5 bg-white rounded border shadow-sm">Esc</kbd> close</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


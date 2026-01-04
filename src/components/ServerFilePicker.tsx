import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, Film, Loader2 } from 'lucide-react';
import { useServerVideos, ServerVideoFile } from '../hooks/useServerVideos';

interface ServerFilePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (file: ServerVideoFile) => void;
}

/**
 * Obsidian Quick Switcher-style modal for selecting server video files.
 * Features fuzzy search, keyboard navigation, and infinite scroll.
 */
export default function ServerFilePicker({ isOpen, onClose, onSelect }: ServerFilePickerProps) {
    const { videos, total, hasMore, loading, error, search, loadMore, reset } = useServerVideos(200);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchValue, setSearchValue] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchValue('');
            setSelectedIndex(0);
            reset();
            // Focus input after a small delay to ensure modal is rendered
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, reset]);

    // Update itemRefs array size
    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, videos.length);
    }, [videos.length]);

    // Scroll selected item into view
    useEffect(() => {
        const selectedItem = itemRefs.current[selectedIndex];
        if (selectedItem && listRef.current) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);

    // Reset selection when videos change
    useEffect(() => {
        setSelectedIndex(0);
    }, [videos]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        search(value);
    }, [search]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => {
                    const next = Math.min(prev + 1, videos.length - 1);
                    // Load more when near bottom
                    if (next >= videos.length - 5 && hasMore && !loading) {
                        loadMore();
                    }
                    return next;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (videos[selectedIndex]) {
                    onSelect(videos[selectedIndex]);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [videos, selectedIndex, hasMore, loading, loadMore, onSelect, onClose]);

    const handleItemClick = useCallback((video: ServerVideoFile) => {
        onSelect(video);
        onClose();
    }, [onSelect, onClose]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loading) {
            loadMore();
        }
    }, [hasMore, loading, loadMore]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200"
                onKeyDown={handleKeyDown}
            >
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <Search className="text-gray-400 shrink-0" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search server videos..."
                        className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                    />
                    {loading && <Loader2 className="animate-spin text-gray-400 shrink-0" size={18} />}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Results List */}
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="max-h-[50vh] overflow-y-auto"
                >
                    {error && (
                        <div className="p-4 text-center text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {!error && videos.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-400">
                            <Film className="mx-auto mb-2 opacity-40" size={32} />
                            <p className="text-sm">No videos found</p>
                        </div>
                    )}

                    {videos.map((video, index) => (
                        <div
                            key={video.path}
                            ref={el => { itemRefs.current[index] = el }}
                            onClick={() => handleItemClick(video)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                                ? 'bg-black text-white'
                                : 'hover:bg-gray-50'
                                }`}
                        >
                            <Film
                                size={16}
                                className={index === selectedIndex ? 'text-white/70' : 'text-gray-400'}
                            />
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {video.name}
                                </div>
                            </div>
                            <span className={`text-xs shrink-0 ${index === selectedIndex ? 'text-white/60' : 'text-gray-400'
                                }`}>
                                {formatFileSize(video.size)}
                            </span>
                        </div>
                    ))}

                    {loading && videos.length > 0 && (
                        <div className="p-3 text-center">
                            <Loader2 className="animate-spin text-gray-400 mx-auto" size={20} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>{total} video{total !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-4">
                        <span>↑↓ navigate</span>
                        <span>↵ select</span>
                        <span>esc close</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

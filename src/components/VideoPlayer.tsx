import { Clock, Film } from 'lucide-react';
import { QVHighlightsQuery } from '../hooks/useAppState';

interface VideoPlayerProps {
    query: QVHighlightsQuery;
}

/**
 * Video player component for QVHighlights videos.
 * Displays video with metadata panel and relevant window highlighting on progress bar.
 */
export default function VideoPlayer({ query }: VideoPlayerProps) {
    // Format time for display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate highlight segment positions
    const getHighlightSegments = () => {
        if (!query.relevant_windows || query.relevant_windows.length === 0) {
            return [];
        }

        return query.relevant_windows.map(([start, end]) => ({
            left: (start / query.duration) * 100,
            width: ((end - start) / query.duration) * 100
        }));
    };

    const highlightSegments = getHighlightSegments();

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Video Container */}
            <div className="relative bg-black aspect-video">
                <video
                    src={`/api/qvhighlights/stream/${query.vid}`}
                    controls
                    className="w-full h-full"
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Custom Progress Bar with Highlights */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <div
                    className="relative h-2 bg-gray-200 rounded-full overflow-hidden"
                >
                    {/* Relevant Window Highlights */}
                    {highlightSegments.map((segment, index) => (
                        <div
                            key={index}
                            className="absolute top-0 h-full bg-blue-500/70"
                            style={{
                                left: `${segment.left}%`,
                                width: `${segment.width}%`
                            }}
                            title={`Relevant: ${formatTime(query.relevant_windows[index][0])} - ${formatTime(query.relevant_windows[index][1])}`}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                    Blue segments indicate relevant moments
                </p>
            </div>

            {/* Metadata Panel */}
            <div className="p-4 space-y-3 border-t border-gray-100">
                {/* Video ID */}
                <div className="flex items-start gap-3">
                    <Film size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Video ID</span>
                        <span className="text-sm font-mono text-gray-900 break-all">{query.vid}</span>
                    </div>
                </div>

                {/* Query Text */}
                <div className="flex items-start gap-3">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center text-gray-400 mt-0.5">
                        <span className="text-xs font-bold">Q</span>
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Query</span>
                        <p className="text-sm text-gray-900 leading-relaxed">{query.query}</p>
                    </div>
                </div>

                {/* Relevant Windows */}
                {query.relevant_windows.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Relevant Windows</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {query.relevant_windows.map((window, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                                    >
                                        {formatTime(window[0])} - {formatTime(window[1])}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Duration */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                        Duration: <span className="font-medium text-gray-900">{formatTime(query.duration)}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                        QID: <span className="font-mono text-gray-900">{query.qid}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

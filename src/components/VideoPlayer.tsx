import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Clock, Film } from 'lucide-react';
import { QVHighlightsQuery } from '../hooks/useAppState';
import SimilarityCurveOverlay from './SimilarityCurveOverlay';

interface CurvePoint {
    time: number;
    score: number;
}

interface VideoPlayerProps {
    query: QVHighlightsQuery;
    similarityCurve?: CurvePoint[];  // Optional similarity curve data for overlay
}

export interface VideoPlayerHandle {
    seekTo: (timeSeconds: number) => void;
    getCurrentTime: () => number;
}

/**
 * Video player component for QVHighlights videos.
 * Displays video with metadata panel, relevant window highlighting,
 * and optional similarity curve overlay on progress bar.
 * Supports programmatic seeking via ref.
 */
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
    ({ query, similarityCurve }, ref) => {
        const videoRef = useRef<HTMLVideoElement>(null);

        // Expose seekTo method to parent via ref
        useImperativeHandle(ref, () => ({
            seekTo: (timeSeconds: number) => {
                if (videoRef.current) {
                    videoRef.current.currentTime = timeSeconds;
                    videoRef.current.play().catch(() => {
                        // Ignore autoplay errors
                    });
                }
            },
            getCurrentTime: () => {
                return videoRef.current?.currentTime ?? 0;
            }
        }));

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
                width: ((end - start) / query.duration) * 100,
                start,
                end
            }));
        };

        // Seek to window start
        const handleWindowClick = (startTime: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime = startTime;
                videoRef.current.play().catch(() => {
                    // Ignore autoplay errors
                });
            }
        };

        const highlightSegments = getHighlightSegments();

        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Video Container */}
                <div className="relative bg-black aspect-video">
                    <video
                        ref={videoRef}
                        src={`/api/qvhighlights/stream/${query.vid}`}
                        controls
                        className="w-full h-full"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>

                {/* Custom Progress Bar with Highlights and Similarity Curve */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        {/* Similarity Curve Overlay (behind everything) */}
                        {similarityCurve && similarityCurve.length > 0 && (
                            <SimilarityCurveOverlay
                                curve={similarityCurve}
                                duration={query.duration}
                                relevantWindows={query.relevant_windows}
                                height={32}
                            />
                        )}

                        {/* Relevant Window Highlights (clickable) */}
                        {highlightSegments.map((segment, index) => (
                            <div
                                key={index}
                                className="absolute top-0 h-full bg-blue-500/70 cursor-pointer hover:bg-blue-600/80 transition-colors"
                                style={{
                                    left: `${segment.left}%`,
                                    width: `${segment.width}%`,
                                    zIndex: 1
                                }}
                                title={`Click to seek: ${formatTime(segment.start)} - ${formatTime(segment.end)}`}
                                onClick={() => handleWindowClick(segment.start)}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                        {similarityCurve && similarityCurve.length > 0
                            ? 'Curve shows similarity. Click blue segments to seek.'
                            : 'Blue segments indicate relevant moments. Click to seek.'
                        }
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

                    {/* Relevant Windows (clickable badges) */}
                    {query.relevant_windows.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">Relevant Windows</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {query.relevant_windows.map((window, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleWindowClick(window[0])}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors"
                                            title={`Click to seek to ${formatTime(window[0])}`}
                                        >
                                            {formatTime(window[0])} - {formatTime(window[1])}
                                        </button>
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
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

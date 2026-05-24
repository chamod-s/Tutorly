import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Radio, Loader2, AlertCircle, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';

interface HlsPlayerProps {
  src: string;
  isLive?: boolean;
  onViewerJoined?: () => void;
}

const HlsPlayer: React.FC<HlsPlayerProps> = ({ src, isLive = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(false);
  const [quality, setQuality] = useState(-1); // -1 = auto
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [showQuality, setShowQuality] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cleanup: (() => void) | undefined;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        backBufferLength: isLive ? 10 : 60,
        liveSyncDurationCount: isLive ? 2 : 3,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setLevels(data.levels.map(l => ({ height: l.height, bitrate: l.bitrate })));
        video.play().catch(() => {});
        setStatus('playing');
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setStatus('error');
      });

      hlsRef.current = hls;
      cleanup = () => { hls.destroy(); };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().catch(() => {});
      setStatus('playing');
    }

    return cleanup;
  }, [src, isLive]);

  const setQualityLevel = (idx: number) => {
    setQuality(idx);
    if (hlsRef.current) hlsRef.current.currentLevel = idx;
    setShowQuality(false);
  };

  const toggleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden group">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-white text-sm font-medium">Stream unavailable</p>
          <p className="text-slate-400 text-xs">The teacher may not have started yet</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full aspect-video"
        controls={false}
        playsInline
        muted={muted}
      />

      {/* Live badge */}
      {isLive && status === 'playing' && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          <Radio className="w-3 h-3 animate-pulse" /> LIVE
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <button onClick={() => setMuted(m => !m)} className="text-white hover:text-teal-300 transition-colors">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <div className="flex-1" />

          {/* Quality selector */}
          {levels.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowQuality(s => !s)} className="text-white hover:text-teal-300 transition-colors flex items-center gap-1 text-xs">
                <Settings className="w-4 h-4" />
                {quality === -1 ? 'Auto' : `${levels[quality]?.height}p`}
              </button>
              {showQuality && (
                <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden min-w-[90px]">
                  <button onClick={() => setQualityLevel(-1)} className={`w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-800 ${quality === -1 ? 'text-teal-400' : ''}`}>Auto</button>
                  {levels.map((l, i) => (
                    <button key={i} onClick={() => setQualityLevel(i)} className={`w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-800 ${quality === i ? 'text-teal-400' : ''}`}>
                      {l.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={toggleFullscreen} className="text-white hover:text-teal-300 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HlsPlayer;

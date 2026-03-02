import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface WaveformPlayerProps {
  src: string;
}

export function WaveformPlayer({ src }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Generate static waveform bars as fallback / initial display
  useEffect(() => {
    const count = 60;
    const generated = Array.from({ length: count }, (_, i) => {
      const x = i / count;
      return 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(x * Math.PI * 2.5)) * (0.3 + Math.random() * 0.7);
    });
    setBars(generated);
  }, []);

  const setupAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // Audio context not available
    }
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const barCount = bars.length;
    if (barCount === 0) return;

    const gap = 2;
    const barW = Math.max(2, (w - gap * (barCount - 1)) / barCount);
    const progress = duration > 0 ? currentTime / duration : 0;

    // If we have a live analyser, use live data
    let liveData: number[] | null = null;
    if (analyserRef.current && playing) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const raw = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(raw);
      liveData = Array.from(raw);
    }

    for (let i = 0; i < barCount; i++) {
      const x = i * (barW + gap);
      let amplitude = bars[i];

      // Blend live analyser data when playing
      if (liveData && liveData.length > 0) {
        const dataIdx = Math.floor((i / barCount) * liveData.length);
        const live = liveData[dataIdx] / 255;
        amplitude = 0.3 * bars[i] + 0.7 * Math.max(0.08, live);
      }

      const barH = Math.max(3, amplitude * h * 0.85);
      const y = (h - barH) / 2;
      const fraction = i / barCount;

      if (fraction <= progress) {
        ctx.fillStyle = "#f97316"; // orange-500
      } else {
        ctx.fillStyle = "rgba(148,163,184,0.35)"; // slate-400/35
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 1.5);
      ctx.fill();
    }

    if (playing) {
      animFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  }, [bars, currentTime, duration, playing]);

  useEffect(() => {
    drawWaveform();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawWaveform]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setupAudioContext();

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setError(true);
      }
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrent(0);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = x / rect.width;
    audio.currentTime = fraction * duration;
    setCurrent(fraction * duration);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />

      {error ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Unable to load audio. The recording may still be processing.</p>
          <audio controls className="w-full mt-3 rounded-lg" preload="metadata">
            <source src={src} type="audio/mpeg" />
          </audio>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white hover:text-white shrink-0"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            <div className="flex-1 min-w-0">
              <canvas
                ref={canvasRef}
                className="w-full h-12 cursor-pointer rounded-lg"
                onClick={handleCanvasClick}
              />
            </div>

            <Button variant="ghost" size="icon" onClick={restart} className="h-8 w-8 shrink-0 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex justify-between text-[11px] text-muted-foreground font-mono px-1">
            <span>{fmt(currentTime)}</span>
            <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
          </div>
        </>
      )}
    </div>
  );
}

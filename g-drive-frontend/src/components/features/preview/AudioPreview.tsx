import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/slider';

interface AudioPreviewProps {
    src: string;
}

export function AudioPreview({ src }: AudioPreviewProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [waveformHeights, setWaveformHeights] = useState<number[]>([]);

    useEffect(() => {
        setTimeout(() => {
            setWaveformHeights(Array.from({ length: 40 }).map(() => Math.random() * 100));
        }, 0);
    }, []);

    const togglePlay = useCallback(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    }, []);

    const handleSeek = useCallback((value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    }, []);

    const handleVolumeChange = useCallback((value: number[]) => {
        if (audioRef.current) {
            const newVolume = value[0];
            audioRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    }, []);

    const handleSkip = useCallback((seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(
                0,
                Math.min(duration, audioRef.current.currentTime + seconds)
            );
        }
    }, [duration]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="w-full max-w-md bg-card rounded-xl p-6 shadow-lg border">
                { }
                <div className="h-24 bg-muted rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                    <div className="flex items-end gap-1 h-16">
                        {waveformHeights.map((height, i) => (
                            <div
                                key={i}
                                className={`w-1 bg-primary rounded-full transition-all ${isPlaying ? 'animate-pulse' : ''
                                    }`}
                                style={{
                                    height: `${height}%`,
                                    animationDelay: `${i * 50}ms`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                { }
                <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="mb-4"
                />

                { }
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                { }
                <div className="flex items-center justify-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => handleSkip(-10)}>
                        <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="rounded-full w-14 h-14"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSkip(10)}>
                        <SkipForward className="w-5 h-5" />
                    </Button>
                </div>

                { }
                <div className="flex items-center justify-center gap-2 mt-6">
                    <Button variant="ghost" size="icon" onClick={toggleMute}>
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-32"
                    />
                </div>
            </div>
        </div>
    );
}

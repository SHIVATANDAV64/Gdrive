import { useRef, useState, useCallback, useEffect } from 'react';

interface ImagePreviewProps {
    src: string;
    alt: string;
    zoom: number;
    rotation: number;
}

export function ImagePreview({ src, alt, zoom, rotation }: ImagePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(true);

    
    useEffect(() => {
        if (zoom === 1) {
            setTimeout(() => {
                setPosition((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }));
            }, 0);
        }
    }, [zoom]);

    
    useEffect(() => {
        
        setTimeout(() => {
            setPosition({ x: 0, y: 0 });
            setIsLoading(true);
        }, 0);
    }, [src]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (zoom > 1) {
                setIsDragging(true);
                setStartPosition({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                });
            }
        },
        [zoom, position]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isDragging && zoom > 1) {
                setPosition({
                    x: e.clientX - startPosition.x,
                    y: e.clientY - startPosition.y,
                });
            }
        },
        [isDragging, startPosition, zoom]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (zoom > 1) {
                e.preventDefault();
                setPosition((prev) => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY,
                }));
            }
        },
        [zoom]
    );

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className="max-w-none transition-transform duration-200 ease-out select-none"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    opacity: isLoading ? 0 : 1,
                }}
                onLoad={() => setIsLoading(false)}
                draggable={false}
            />
        </div>
    );
}

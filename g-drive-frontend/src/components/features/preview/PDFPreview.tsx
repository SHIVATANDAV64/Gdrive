import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';


pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
    src: string;
}

export function PDFPreview({ src }: PDFPreviewProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('PDF load error:', error);
        setError('Failed to load PDF. The file may be corrupted or inaccessible.');
        setIsLoading(false);
    }, []);

    const goToPrevPage = useCallback(() => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
    }, []);

    const goToNextPage = useCallback(() => {
        setPageNumber((prev) => Math.min(prev + 1, numPages));
    }, [numPages]);

    const zoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    }, []);

    const zoomOut = useCallback(() => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-destructive">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            { }
            <div className="flex items-center justify-center gap-4 p-2 bg-transparent shrink-0 z-10 relative">
                <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-1.5 border border-white/10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="w-8 h-8 text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30"
                        title="Previous page"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-medium text-white min-w-[6ch] text-center select-none">
                        {pageNumber} / {numPages || '--'}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="w-8 h-8 text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30"
                        title="Next page"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>

                    <div className="w-px h-5 bg-white/20 mx-2" />

                    <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom out" className="w-8 h-8 text-white/80 hover:text-white hover:bg-white/10">
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-white min-w-[4ch] text-center select-none">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom in" className="w-8 h-8 text-white/80 hover:text-white hover:bg-white/10">
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            { }
            <div className="flex-1 overflow-auto flex justify-center p-4">
                {isLoading && (
                    <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <Document
                    file={src}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    className="shadow-lg"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        loading={null}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>
        </div>
    );
}

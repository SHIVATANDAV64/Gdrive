import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';


import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';

interface TextPreviewProps {
    src: string;
    language: string;
}

export function TextPreview({ src, language }: TextPreviewProps) {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(src);
                if (!response.ok) {
                    throw new Error('Failed to load file');
                }
                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('Text preview error:', err);
                setError('Failed to load file content');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [src]);

    useEffect(() => {
        if (content && !isLoading) {
            // Give DOM time to update
            setTimeout(() => {
                Prism.highlightAll();
            }, 0);
        }
    }, [content, isLoading, language]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-destructive">
                <p>{error}</p>
            </div>
        );
    }

    const lines = content.split('\n');

    return (
        <div className="relative w-full h-full bg-[#2d2d2d] rounded-lg overflow-hidden">
            { }
            <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-[#2d2d2d] border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={handleCopy}
            >
                {copied ? (
                    <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                    </>
                ) : (
                    <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                    </>
                )}
            </Button>

            { }
            <div className="h-full overflow-auto">
                <div className="flex">
                    { }
                    <div className="sticky left-0 bg-[#2d2d2d] text-gray-500 text-right px-3 py-4 select-none border-r border-gray-700 font-mono text-sm flex-shrink-0">
                        {lines.map((_, i) => (
                            <div key={i} className="leading-6">
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    { }
                    <pre className="flex-1 m-0 p-4 overflow-x-auto bg-[#2d2d2d] whitespace-pre">
                        <code className={`language-${language}`}>{content}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}

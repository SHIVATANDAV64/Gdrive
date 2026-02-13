 

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';





interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}





 
export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav
            className={cn('flex items-center gap-1 overflow-x-auto snap-x snap-mandatory pb-2', className)}
            aria-label="Breadcrumb"
        >
            <ol className="flex items-center gap-1 whitespace-nowrap">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const path = item.id ? `/folder/${item.id}` : '/';

                    return (
                        <li key={item.id ?? 'root'} className="flex items-center">
                            { }
                            {index > 0 && (
                                <ChevronRight
                                    className="h-4 w-4 text-[var(--color-text-muted)] mx-1 flex-shrink-0"
                                    aria-hidden
                                />
                            )}

                            { }
                            {isLast ? (
                                <span
                                    className="px-2 py-1 text-sm font-medium text-[var(--color-text)] truncate max-w-[200px]"
                                    aria-current="page"
                                >
                                    {index === 0 && items.length === 1 ? (
                                        <span className="flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            {item.name}
                                        </span>
                                    ) : (
                                        item.name
                                    )}
                                </span>
                            ) : (
                                <Link
                                    to={path}
                                    className={cn(
                                        'px-2 py-1 rounded text-sm',
                                        'text-[var(--color-text-secondary)]',
                                        'hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
                                        'transition-colors duration-150',
                                        'truncate max-w-[200px]'
                                    )}
                                >
                                    {index === 0 ? (
                                        <span className="flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            <span className="hidden sm:inline">{item.name}</span>
                                        </span>
                                    ) : (
                                        item.name
                                    )}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default Breadcrumb;

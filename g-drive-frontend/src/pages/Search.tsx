

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Filter, X, FileText, Folder, SortAsc, SortDesc } from 'lucide-react';
import { search } from '@/services/search.service';
import { MainLayout } from '@/components/layout/MainLayout';
import { FileCard } from '@/components/features/FileCard';
import { FolderCard } from '@/components/features/FolderCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@/types';





type SortField = 'name' | 'updatedAt' | 'sizeBytes';
type SortOrder = 'asc' | 'desc';





interface FilterSidebarProps {
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    onClose: () => void;
}

function FilterSidebar({ filters, onFiltersChange, onClose }: FilterSidebarProps) {
    const fileTypes = [
        { value: 'image', label: 'Images' },
        { value: 'document', label: 'Documents' },
        { value: 'video', label: 'Videos' },
        { value: 'audio', label: 'Audio' },
        { value: 'other', label: 'Other' },
    ];

    const dateRanges: { value: 'today' | 'week' | 'month' | 'year'; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
    ];

    return (
        <aside className="w-64 border-r border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--color-text)]">Filters</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-[var(--color-surface-muted)] rounded"
                    aria-label="Close filters"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            { }
            <div className="mb-6">
                <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">File Type</h4>
                <div className="space-y-2">
                    {fileTypes.map(type => (
                        <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.type === type.value}
                                onChange={(e) => {
                                    onFiltersChange({
                                        ...filters,
                                        type: e.target.checked ? type.value as 'file' | 'folder' | 'all' : undefined
                                    });
                                }}
                                className="rounded border-[var(--color-border)]"
                            />
                            <span className="text-sm text-[var(--color-text)]">{type.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            { }
            <div className="mb-6">
                <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Modified Date</h4>
                <div className="space-y-2">
                    {dateRanges.map(range => (
                        <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="dateRange"
                                checked={filters.dateRange === range.value}
                                onChange={() => onFiltersChange({ ...filters, dateRange: range.value })}
                                className="border-[var(--color-border)]"
                            />
                            <span className="text-sm text-[var(--color-text)]">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            { }
            <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ query: filters.query })}
                className="w-full"
            >
                Clear All Filters
            </Button>
        </aside>
    );
}





export function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') ?? '';

    const [query, setQuery] = useState(initialQuery);
    const [filters, setFilters] = useState<SearchFilters>({ query: initialQuery });
    const [showFilters, setShowFilters] = useState(false);
    const [sortField, setSortField] = useState<SortField>('updatedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');


    useEffect(() => {
        if (query) {
            setSearchParams({ q: query });
        } else {
            setSearchParams({});
        }
    }, [query, setSearchParams]);


    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['search', query, filters],
        queryFn: () => search({ query, filters }),
        enabled: query.length >= 2,
        staleTime: 30 * 1000,
    });


    const sortedResults = useMemo(() => {
        if (!data) return { files: [], folders: [] };

        type SortableItem = { name: string; $updatedAt: string; sizeBytes?: number };
        const sortFn = (a: SortableItem, b: SortableItem) => {
            let comparison = 0;
            if (sortField === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortField === 'updatedAt') {
                comparison = new Date(a.$updatedAt).getTime() - new Date(b.$updatedAt).getTime();
            } else if (sortField === 'sizeBytes') {
                comparison = (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        };

        return {
            files: [...data.files].sort(sortFn),
            folders: [...data.folders].sort(sortFn),
        };
    }, [data, sortField, sortOrder]);

    const totalResults = (data?.files.length ?? 0) + (data?.folders.length ?? 0);

    return (
        <MainLayout>
            <div className="flex flex-col h-full">
                { }
                <header className="flex items-center gap-4 p-4 border-b border-[var(--color-border)]">
                    <div className="flex-1 max-w-2xl relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
                        <Input
                            type="search"
                            placeholder="Search files and folders..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10"
                            aria-label="Search query"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(showFilters && 'bg-[var(--color-primary)]/10')}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>

                    { }
                    <div className="flex items-center gap-2">
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as SortField)}
                            className="px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
                            aria-label="Sort by"
                        >
                            <option value="updatedAt">Date Modified</option>
                            <option value="name">Name</option>
                            <option value="sizeBytes">Size</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2 hover:bg-[var(--color-surface-muted)] rounded"
                            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        >
                            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </button>
                    </div>
                </header>

                { }
                <div className="flex flex-1 overflow-hidden">
                    {showFilters && (
                        <FilterSidebar
                            filters={filters}
                            onFiltersChange={setFilters}
                            onClose={() => setShowFilters(false)}
                        />
                    )}

                    <main className="flex-1 overflow-auto p-6">
                        { }
                        {!query && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <SearchIcon className="h-16 w-16 text-[var(--color-text-muted)] mb-4" />
                                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    Search your files
                                </h2>
                                <p className="text-[var(--color-text-muted)]">
                                    Enter a search term to find files and folders
                                </p>
                            </div>
                        )}

                        { }
                        {isLoading && (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
                            </div>
                        )}

                        { }
                        {isError && (
                            <div className="text-center py-8 text-red-500">
                                <p>Search failed: {(error as Error).message}</p>
                            </div>
                        )}

                        { }
                        {query && data && !isLoading && (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                                    </p>
                                </div>

                                { }
                                {sortedResults.folders.length > 0 && (
                                    <section className="mb-8">
                                        <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] mb-3">
                                            <Folder className="h-4 w-4" />
                                            Folders ({sortedResults.folders.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {sortedResults.folders.map(folder => (
                                                <FolderCard
                                                    key={folder.$id}
                                                    folder={folder}
                                                    viewMode="grid"
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                { }
                                {sortedResults.files.length > 0 && (
                                    <section>
                                        <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] mb-3">
                                            <FileText className="h-4 w-4" />
                                            Files ({sortedResults.files.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {sortedResults.files.map(file => (
                                                <FileCard
                                                    key={file.$id}
                                                    file={file}
                                                    viewMode="grid"
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                { }
                                {totalResults === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <SearchIcon className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
                                        <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
                                            No results found
                                        </h3>
                                        <p className="text-[var(--color-text-muted)]">
                                            Try different keywords or remove some filters
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </MainLayout>
    );
}

export default SearchPage;

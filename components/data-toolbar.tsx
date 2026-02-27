'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X, ChevronLeft, ChevronRight, FileDown, Printer, Trash2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Search + Filters Toolbar                                          */
/* ------------------------------------------------------------------ */

export type FilterOption = {
    label: string;
    value: string;
};

export type FilterConfig = {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
};

type DataToolbarProps = {
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filters?: FilterConfig[];
    onClearAll?: () => void;
    totalResults?: number;
    resultLabel?: string;

    // Bulk Actions
    selectedCount?: number;
    onBulkDelete?: () => void;

    // Export / Print
    onExport?: () => void;
    onPrint?: () => void;

    // Extra Actions
    actions?: React.ReactNode;
};

export function DataToolbar({
    searchPlaceholder = 'Search...',
    searchValue,
    onSearchChange,
    filters = [],
    onClearAll,
    totalResults,
    resultLabel = 'results',
    selectedCount = 0,
    onBulkDelete,
    onExport,
    onPrint,
    actions,
}: DataToolbarProps) {
    const hasActiveFilters =
        searchValue.trim() !== '' ||
        filters.some((f) => f.value !== '' && f.value !== 'all');

    return (
        <div className="space-y-4 print:hidden">
            <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full xl:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-card"
                    />
                    {searchValue && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    {filters.map((filter) => (
                        <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                            <SelectTrigger className="w-full sm:w-[160px] bg-card">
                                <SelectValue placeholder={filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {/* Clear All */}
                    {hasActiveFilters && onClearAll && (
                        <Button variant="ghost" size="sm" onClick={onClearAll} className="gap-1 text-muted-foreground">
                            <X className="w-4 h-4" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Tools (Export, Print, Actions) */}
                <div className="flex gap-2 w-full xl:w-auto justify-end">
                    {onExport && (
                        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                            <FileDown className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    )}
                    {onPrint && (
                        <Button variant="outline" size="sm" onClick={onPrint} className="gap-2">
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                    )}
                    {actions}
                </div>
            </div>

            <div className="flex items-center justify-between min-h-[40px]">
                {/* Result count */}
                {totalResults !== undefined && (
                    <p className="text-sm text-muted-foreground">
                        {totalResults} {totalResults === 1 ? resultLabel.replace(/s$/, '') : resultLabel}
                        {hasActiveFilters && ' (filtered)'}
                    </p>
                )}

                {/* Bulk Selection Bar */}
                {selectedCount > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <span className="text-sm font-medium text-primary">
                            {selectedCount}
                        </span>
                        {onBulkDelete && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={onBulkDelete}
                                className="h-8 w-8"
                                title="Delete Selected"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Pagination Controls                                               */
/* ------------------------------------------------------------------ */

type DataPaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    totalItems: number;
};

export function DataPagination({
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    totalItems,
}: DataPaginationProps) {
    if (totalPages <= 1) return null;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
                Showing {start}–{end} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                    })
                    .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                            <span key={page} className="flex items-center gap-1">
                                {showEllipsis && (
                                    <span className="px-1 text-sm text-muted-foreground">…</span>
                                )}
                                <Button
                                    variant={page === currentPage ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange(page)}
                                    className="min-w-[36px]"
                                >
                                    {page}
                                </Button>
                            </span>
                        );
                    })}

                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Hook: usePaginatedData                                            */
/* ------------------------------------------------------------------ */

export function usePaginatedData<T>(data: T[], pageSize: number, currentPage: number) {
    const totalItems = data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const paginatedData = data.slice((safePage - 1) * pageSize, safePage * pageSize);

    return { paginatedData, totalItems, totalPages, safePage };
}

/* ------------------------------------------------------------------ */
/*  CSV Export Utility                                                */
/* ------------------------------------------------------------------ */

export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let val = row[header];
                if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
                return val;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

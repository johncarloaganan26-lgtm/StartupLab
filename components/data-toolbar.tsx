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
    defaultValue?: string;
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
        filters.some((f) => f.value !== (f.defaultValue ?? 'all'));

    return (
        <div className="space-y-3 rounded-sm border border-[#dde2e8] bg-white p-3 print:hidden dark:border-[#334155] dark:bg-[#111827]">
            <div className="flex flex-col items-start gap-3 xl:flex-row xl:items-center">
                {/* Search */}
                <div className="relative w-full flex-1 xl:w-auto">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a99ad] dark:text-[#7f8ea6]" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-10 rounded-sm border-[#d7dde6] bg-white pl-9 pr-9 text-[#1f2d3d] placeholder:text-[#8a99ad] focus-visible:border-[#c4d2e1] focus-visible:ring-1 focus-visible:ring-[#2f5f94]/20 dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#e5edf7] dark:placeholder:text-[#8da0b8]"
                    />
                    {searchValue && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a99ad] hover:text-[#2f5f94] dark:text-[#8da0b8] dark:hover:text-[#cfe2fb]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex w-full flex-wrap gap-2 xl:w-auto">
                    {filters.map((filter) => (
                        <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                            <SelectTrigger className="h-10 w-full rounded-none border-[#ced4da] bg-gradient-to-b from-[#fdfdfd] via-[#f8f9fa] to-[#f1f3f5] text-[#495057] shadow-[0_2px_0_0_#dee2e6] hover:from-[#f8f9fa] hover:to-[#e9ecef] hover:border-[#adb5bd] active:shadow-none active:translate-y-[1px] sm:w-[170px] dark:border-[#334155] dark:from-[#111827] dark:to-[#0f172a] dark:text-[#9fb0c7] dark:shadow-[0_2px_0_0_#1e293b]">
                                <SelectValue placeholder={filter.label} />
                            </SelectTrigger>
                            <SelectContent className="rounded-sm border-[#d7dde6] bg-white text-[#1f2d3d] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#e5edf7]">
                                {filter.options.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="focus:bg-[#eef4fb] focus:text-[#1f2d3d] dark:focus:bg-[#1e293b] dark:focus:text-[#e5edf7]"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {/* Clear All */}
                    {hasActiveFilters && onClearAll && (
                        <Button
                            variant="excel"
                            size="sm"
                            onClick={onClearAll}
                            className="h-10 gap-1.5 px-3"
                        >
                            <X className="h-4 w-4 text-[#616e7c] dark:text-[#9fb0c7]" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Tools (Export, Print, Actions) */}
                <div className="flex w-full justify-end gap-2 xl:w-auto">
                    {onExport && (
                        <Button
                            variant="excel"
                            size="sm"
                            onClick={onExport}
                            className="h-10 gap-2 px-3"
                        >
                            <FileDown className="h-4 w-4 text-[#616e7c] dark:text-[#9fb0c7]" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    )}
                    {onPrint && (
                        <Button
                            variant="excel"
                            size="sm"
                            onClick={onPrint}
                            className="h-10 gap-2 px-3"
                        >
                            <Printer className="h-4 w-4 text-[#616e7c] dark:text-[#9fb0c7]" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                    )}
                    {actions && (
                        <div className="flex items-center gap-2 [&_button]:h-10 [&_button]:rounded-none [&_button]:border [&_button]:border-[#ced4da] [&_button]:bg-gradient-to-b [&_button]:from-[#fdfdfd] [&_button]:via-[#f8f9fa] [&_button]:to-[#f1f3f5] [&_button]:px-3 [&_button]:text-[#495057] [&_button]:shadow-[0_2px_0_0_#dee2e6] [&_button:hover]:from-[#f8f9fa] [&_button:hover]:to-[#e9ecef] [&_button:hover]:text-[#2f5f94] [&_button:active]:translate-y-[1px] [&_button:active]:shadow-none dark:[&_button]:border-[#334155] dark:[&_button]:bg-gradient-to-b dark:[&_button]:from-[#111827] dark:[&_button]:to-[#0f172a] dark:[&_button]:text-[#9fb0c7] dark:[&_button]:shadow-[0_2px_0_0_#1e293b] dark:[&_button:hover]:from-[#1e293b] dark:[&_button:hover]:to-[#0f172a]">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex min-h-[40px] items-center justify-between border-t border-[#e3e8ef] pt-2 dark:border-[#334155]">
                {/* Result count */}
                {totalResults !== undefined && (
                    <p className="text-sm text-[#72849b] dark:text-[#94a3b8]">
                        {totalResults} {totalResults === 1 ? resultLabel.replace(/s$/, '') : resultLabel}
                        {hasActiveFilters && ' (filtered)'}
                    </p>
                )}

                {/* Bulk Selection Bar */}
                {selectedCount > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-[#2f5f94] dark:text-[#78b2f4]">
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
                                <Trash2 className="h-4 w-4" />
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
            <p className="text-sm text-[#72849b] dark:text-[#94a3b8]">
                Showing {start}-{end} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="excel"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-9 px-2"
                >
                    <ChevronLeft className="h-4 w-4 text-[#616e7c] dark:text-[#9fb0c7]" />
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
                                    <span className="px-1 text-sm text-[#8a99ad] dark:text-[#8da0b8]">...</span>
                                )}
                                <Button
                                    variant={page === currentPage ? 'default' : 'excel'}
                                    size="sm"
                                    onClick={() => onPageChange(page)}
                                    className={`min-w-[36px] h-9 ${page === currentPage
                                        ? ''
                                        : 'px-2'
                                        }`}
                                >
                                    {page}
                                </Button>
                            </span>
                        );
                    })}

                <Button
                    variant="excel"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-9 px-2"
                >
                    <ChevronRight className="h-4 w-4 text-[#616e7c] dark:text-[#9fb0c7]" />
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

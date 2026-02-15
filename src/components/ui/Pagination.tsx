'use client';

import React, { Fragment } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = '',
}: PaginationProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = Math.min(totalPages - 1, 4);
            }
            if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - 3);
            }
            if (start > 2) {
                pages.push('...');
            }
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (end < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div className={`flex items-center justify-between py-3 ${className}`}>
            <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span>{' '}
                to <span className="font-medium text-foreground">{endItem}</span> of{' '}
                <span className="font-medium text-foreground">{totalItems}</span>{' '}
                results
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="sr-only">Previous page</span>
                </Button>

                <div className="flex items-center gap-0.5 mx-1">
                    {getPageNumbers().map((page, index) => (
                        <Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-2 text-muted-foreground text-xs">...</span>
                            ) : (
                                <Button
                                    variant={currentPage === page ? 'primary' : 'ghost'}
                                    size="sm"
                                    className={`h-7 w-7 p-0 text-xs ${currentPage === page ? 'pointer-events-none' : ''}`}
                                    onClick={() =>
                                        typeof page === 'number' && onPageChange(page)
                                    }
                                >
                                    {page}
                                </Button>
                            )}
                        </Fragment>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="sr-only">Next page</span>
                </Button>
            </div>
        </div>
    );
}

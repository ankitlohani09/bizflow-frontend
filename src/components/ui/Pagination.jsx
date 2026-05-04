import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

/**
 * Premium Pagination Component
 * 
 * @param {number} currentPage - Current active page
 * @param {number} totalItems - Total records across all pages
 * @param {number} itemsPerPage - Number of records per page
 * @param {function} onPageChange - Callback when page is switched
 */
export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  if (totalPages <= 1 && totalItems > 0) {
    return (
      <div className="flex items-center justify-between px-8 py-4 bg-slate-50/30 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900 dark:text-slate-200">{totalItems}</span> items
        </p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 1 of 1</p>
      </div>
    );
  }

  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 bg-slate-50/30 border-t border-slate-100 dark:border-slate-800">
      <div className="flex flex-col">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
          Data Range
        </p>
        <p className="text-xs font-bold text-slate-500 mt-1">
          Showing <span className="text-slate-900 dark:text-white">{startIdx}-{endIdx}</span> of <span className="text-slate-900 dark:text-white">{totalItems}</span> assets
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft size={16} className={cn(currentPage === 1 ? "text-slate-200" : "text-slate-400")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} className={cn(currentPage === 1 ? "text-slate-200" : "text-slate-400")} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "h-9 w-9 rounded-xl text-xs font-black transition-all border",
                currentPage === page
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-110 z-10"
                  : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:text-blue-500"
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} className={cn(currentPage === totalPages ? "text-slate-200" : "text-slate-400")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight size={16} className={cn(currentPage === totalPages ? "text-slate-200" : "text-slate-400")} />
          </Button>
        </div>
      </div>
    </div>
  );
}

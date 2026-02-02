"use client";

// External library imports
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";

// Internal component imports
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Utility imports
import { cn } from "@/lib/utils";

// ============================================================================
// Type Definitions
// ============================================================================

export interface MonthSelectorProps {
  /** Currently selected month (Date object representing the first day of the month) */
  selectedMonth: Date;
  /** Callback when month changes */
  onMonthChange: (month: Date) => void;
  /** Current year - limits navigation to this year only */
  currentYear: number;
  /** Optional className for the container */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MonthSelector component
 * Provides month navigation with previous/next arrows and a clickable month button
 * that opens a popover showing only month options (no date selection).
 * 
 * @param selectedMonth - Currently selected month (first day of month)
 * @param onMonthChange - Callback when month is changed
 * @param currentYear - Current year to limit navigation
 * @param className - Optional className for styling
 */
export default function MonthSelector({
  selectedMonth,
  onMonthChange,
  currentYear,
  className,
}: MonthSelectorProps) {
  // Format month display as full month name + year (e.g., "February 2026")
  const monthDisplay = useMemo(() => {
    return format(selectedMonth, "MMMM yyyy");
  }, [selectedMonth]);

  // Get current month index (0-11)
  const selectedMonthIndex = useMemo(() => {
    return selectedMonth.getMonth();
  }, [selectedMonth]);

  // Check if selected month is the current month
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedMonth.getMonth() === now.getMonth() &&
      selectedMonth.getFullYear() === now.getFullYear()
    );
  }, [selectedMonth]);

  // Get current month index for highlighting in popover
  const currentMonthIndex = useMemo(() => {
    const now = new Date();
    return now.getMonth();
  }, []);

  // Generate array of all 12 months for the current year
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(currentYear, i, 1);
      return {
        index: i,
        name: format(monthDate, "MMMM"),
        date: startOfMonth(monthDate),
      };
    });
  }, [currentYear]);

  // Check if we're at year boundaries
  const isFirstMonth = useMemo(() => {
    return selectedMonth.getMonth() === 0 && selectedMonth.getFullYear() === currentYear;
  }, [selectedMonth, currentYear]);

  const isLastMonth = useMemo(() => {
    return selectedMonth.getMonth() === 11 && selectedMonth.getFullYear() === currentYear;
  }, [selectedMonth, currentYear]);

  /**
   * Navigate to previous month
   */
  const handlePreviousMonth = () => {
    if (!isFirstMonth) {
      const newMonth = subMonths(selectedMonth, 1);
      // Ensure we don't go before January of current year
      if (newMonth.getFullYear() >= currentYear) {
        onMonthChange(startOfMonth(newMonth));
      }
    }
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    if (!isLastMonth) {
      const newMonth = addMonths(selectedMonth, 1);
      // Ensure we don't go past December of current year
      if (newMonth.getFullYear() === currentYear) {
        onMonthChange(startOfMonth(newMonth));
      }
    }
  };

  /**
   * Handle month selection from popover
   */
  const handleMonthSelect = (monthIndex: number) => {
    const monthDate = new Date(currentYear, monthIndex, 1);
    onMonthChange(startOfMonth(monthDate));
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Previous Month Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        disabled={isFirstMonth}
        className="h-8 w-8"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Month Display Button (opens month picker popover) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isCurrentMonth ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 px-3 font-normal min-w-[120px] justify-center",
              isCurrentMonth && "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
            )}
            aria-label="Select month"
          >
            {monthDisplay}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-2">
            {/* Year Display */}
            <div className="text-sm font-semibold text-center pb-2 border-b">
              {currentYear}
            </div>
            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-1">
              {months.map((month) => {
                const isSelected = month.index === selectedMonthIndex;
                const isCurrent = month.index === currentMonthIndex && !isSelected;
                return (
                  <Button
                    key={month.index}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 text-xs font-normal",
                      isSelected && "bg-primary text-primary-foreground",
                      isCurrent && "border-2 border-gray-400"
                    )}
                    onClick={() => handleMonthSelect(month.index)}
                  >
                    {month.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Next Month Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        disabled={isLastMonth}
        className="h-8 w-8"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

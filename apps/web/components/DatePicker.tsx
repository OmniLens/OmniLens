"use client"

// External library imports
import * as React from "react"
import { format, isAfter, startOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

// Internal component imports
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Utility imports
import { cn } from "@/lib/utils"

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for the DatePicker component
 */
interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  iconOnly?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * DatePicker component
 * Provides a date selection interface using a popover calendar
 * Displays selected date in formatted text or placeholder
 * @param date - Currently selected date (optional)
 * @param onDateChange - Callback function when date is selected/changed
 * @param placeholder - Placeholder text when no date is selected (default: "Pick a date")
 * @param iconOnly - If true, shows only the calendar icon (default: false)
 */
export function DatePicker({ date, onDateChange, placeholder = "Pick a date", iconOnly = false }: DatePickerProps) {
  // Memoize today's date to avoid recreating on every disabled check
  const today = React.useMemo(() => startOfDay(new Date()), [])

  return (
    <Popover>
      {/* Trigger Button - Shows selected date or placeholder */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            iconOnly 
              ? "w-auto px-2" 
              : "w-auto justify-start text-left font-normal flex items-center gap-2 px-3 py-2",
            !date && !iconOnly && "text-muted-foreground"
          )}
          aria-label={iconOnly ? (date ? format(date, "MMM d, yyyy") : placeholder) : undefined}
        >
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          {!iconOnly && (
            <span className="truncate">
              {date ? format(date, "MMM d, yyyy") : placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      {/* Calendar Popover - Date selection interface */}
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          disabled={(date) => isAfter(startOfDay(date), today)}
        />
      </PopoverContent>
    </Popover>
  )
} 
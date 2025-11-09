"use client"

// External library imports
import * as React from "react"
import { format } from "date-fns"
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
 */
export function DatePicker({ date, onDateChange, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <Popover>
      {/* Trigger Button - Shows selected date or placeholder */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start text-left font-normal",
            "flex items-center gap-2 px-3 py-2",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      {/* Calendar Popover - Date selection interface */}
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 
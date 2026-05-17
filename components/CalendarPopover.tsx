"use client"

import { parseDateKey, toDateKey } from "../lib/date"
import { formatJapaneseEraYear } from "../lib/japaneseCalendar"

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

type CalendarDay = {
    dateKey: string
    day: number
    inMonth: boolean
}

export function getMonthLabel(dateKey: string) {
    const date = parseDateKey(dateKey)
    const monthName = date.toLocaleString("en-US", { month: "long" })
    return `${monthName} ${date.getFullYear()} (${formatJapaneseEraYear(dateKey)})`
}

function addMonths(dateKey: string, delta: number) {
    const date = parseDateKey(dateKey)
    const day = date.getDate()
    const next = new Date(date.getFullYear(), date.getMonth() + delta, 1)
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
    next.setDate(Math.min(day, lastDay))
    return toDateKey(next)
}

function getMonthCalendarDays(monthDateKey: string): CalendarDay[] {
    const monthDate = parseDateKey(monthDateKey)
    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const firstGridDate = new Date(firstOfMonth)
    firstGridDate.setDate(firstGridDate.getDate() - ((firstGridDate.getDay() + 6) % 7))

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstGridDate)
        date.setDate(firstGridDate.getDate() + index)
        return {
            dateKey: toDateKey(date),
            day: date.getDate(),
            inMonth: date.getMonth() === monthDate.getMonth(),
        }
    })
}

export function CalendarPopover({
    open,
    monthDateKey,
    centerDateKey,
    todayDateKey,
    onOpenChange,
    onMonthChange,
    onToday,
    onSelectDate,
}: {
    open: boolean
    monthDateKey: string
    centerDateKey: string
    todayDateKey: string
    onOpenChange: (open: boolean) => void
    onMonthChange: (dateKey: string) => void
    onToday: () => void
    onSelectDate: (dateKey: string) => void
}) {
    const calendarDays = getMonthCalendarDays(monthDateKey)

    return (
        <div className="fixed right-3 top-16 z-50 sm:right-4 sm:top-[4.25rem]" data-calendar-root="1">
            <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:bg-white"
                type="button"
                aria-label="Open calendar"
                onClick={() => onOpenChange(!open)}
            >
                <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <path d="M3 10h18" />
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                </svg>
            </button>

            {open ? (
                <div
                    className="mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl shadow-gray-900/15"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50"
                            type="button"
                            aria-label="Previous month"
                            onClick={() => onMonthChange(addMonths(monthDateKey, -1))}
                        >
                            <ChevronLeftIcon />
                        </button>
                        <div className="flex-1 text-center text-sm font-semibold text-gray-900">
                            {getMonthLabel(monthDateKey)}
                        </div>
                        <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50"
                            type="button"
                            aria-label="Next month"
                            onClick={() => onMonthChange(addMonths(monthDateKey, 1))}
                        >
                            <ChevronRightIcon />
                        </button>
                    </div>
                    <button
                        className="mb-3 h-9 w-full rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                        type="button"
                        onClick={onToday}
                    >
                        Today
                    </button>

                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-gray-500">
                        {WEEKDAY_LABELS.map((label) => (
                            <div key={label} className="py-1">
                                {label}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day) => {
                            const isSelected = day.dateKey === centerDateKey
                            const isToday = day.dateKey === todayDateKey
                            return (
                                <button
                                    key={day.dateKey}
                                    className={`h-9 rounded-lg text-sm font-medium transition ${
                                        isSelected
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : isToday
                                              ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                              : day.inMonth
                                                ? "text-gray-800 hover:bg-gray-100"
                                                : "text-gray-400 hover:bg-gray-50"
                                    }`}
                                    type="button"
                                    onClick={() => onSelectDate(day.dateKey)}
                                >
                                    {day.day}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function ChevronLeftIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m15 18-6-6 6-6" />
        </svg>
    )
}

function ChevronRightIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}

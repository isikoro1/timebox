"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { QuickAddModal, type QuickAddState } from "../components/QuickAddModal"
import { EventDetailsPopover } from "../components/EventDetailsPopover"
import { type EventItem, WeekGrid } from "../components/WeekGrid"
import { useAlarm } from "../hooks/useAlarm"
import { useNowMin } from "../hooks/useNowMin"
import { useSelection } from "../hooks/useSelection"
import { useTimeboxingItems } from "../hooks/useTimeboxingItems"
import { type ViewMode, type ZoomLevel, useViewOptions } from "../hooks/useViewOptions"
import { formatDateHeader, getTodayDateKey, parseDateKey, toDateKey } from "../lib/date"
import { parseEventItems } from "../lib/storage"

const STORAGE_KEY = "timeboxing-tool:v1:week-items"
const GRID_MIN = 15
const DEFAULT_DURATION = 30
const VIEW_MODE_LABELS: Record<ViewMode, string> = {
    day: "1 day",
    "3days": "3 days",
    week: "Week",
}
const ZOOM_OPTIONS: ZoomLevel[] = [75, 100, 150, 200]
const BUTTON_CLASS =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
const ACTIVE_BUTTON_CLASS =
    "rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
const SETTINGS_SECTION_CLASS = "space-y-3 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

function buildExportFilename() {
    const stamp = new Date().toISOString().slice(0, 10)
    return `timebox-events-${stamp}.json`
}

function downloadJson(items: EventItem[]) {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
        type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = buildExportFilename()
    anchor.click()
    URL.revokeObjectURL(url)
}

function getMonthLabel(dateKey: string) {
    const date = parseDateKey(dateKey)
    return `${date.getFullYear()} / ${date.getMonth() + 1}`
}

function addMonths(dateKey: string, delta: number) {
    const date = parseDateKey(dateKey)
    const day = date.getDate()
    const next = new Date(date.getFullYear(), date.getMonth() + delta, 1)
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
    next.setDate(Math.min(day, lastDay))
    return toDateKey(next)
}

function getMonthCalendarDays(monthDateKey: string) {
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

export default function Home() {
    const { items, setItems, loaded } = useTimeboxingItems(STORAGE_KEY)
    const nowMin = useNowMin(15000)
    const [alarmEnabled, setAlarmEnabled] = useState(false)
    const [alarmLeadMin, setAlarmLeadMin] = useState(0)
    const [transferMessage, setTransferMessage] = useState<string | null>(null)
    const [transferState, setTransferState] = useState<"success" | "error" | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [calendarMonthKey, setCalendarMonthKey] = useState(getTodayDateKey)

    const {
        startAtMidnight,
        setStartAtMidnight,
        viewMode,
        setViewMode,
        zoom,
        setZoom,
        centerDateKey,
        setCenterDateKey,
        shiftCenter,
        goToday,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDateKeys,
    } = useViewOptions()

    const { selectedId, selectedAnchor, selectedItem, open, close } = useSelection(items)
    const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)
    const clipboardRef = useRef<EventItem | null>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)

    const alarmItems = useMemo(
        () =>
            items.map((item) => ({
                id: item.id,
                dateKey: item.dateKey,
                startMin: item.startMin,
                endMin: item.endMin,
                label: item.label,
            })),
        [items]
    )

    const alarm = useAlarm({
        items: alarmItems,
        enabled: alarmEnabled,
        leadMin: alarmLeadMin,
    })

    useEffect(() => {
        const isTyping = () => {
            const element = document.activeElement as HTMLElement | null
            if (!element) return false
            const tagName = element.tagName?.toLowerCase()
            return tagName === "input" || tagName === "textarea" || element.isContentEditable
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (!event.ctrlKey || isTyping()) return

            const key = event.key.toLowerCase()

            if (key === "c") {
                if (!selectedItem) return
                clipboardRef.current = selectedItem
                event.preventDefault()
            }

            if (key === "v") {
                const source = clipboardRef.current
                if (!source) return

                const duration = source.endMin - source.startMin
                const startMin = Math.min(1440 - duration, source.startMin + GRID_MIN)

                const next: EventItem = {
                    ...source,
                    id: crypto.randomUUID(),
                    startMin,
                    endMin: startMin + duration,
                }

                setItems((previous: EventItem[]) => [...previous, next])
                event.preventDefault()
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [selectedItem, setItems])

    useEffect(() => {
        if (!settingsOpen && !calendarOpen) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return
            setSettingsOpen(false)
            setCalendarOpen(false)
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [settingsOpen, calendarOpen])

    const updateSelected = (next: EventItem) => {
        setItems((previous: EventItem[]) => previous.map((item) => (item.id === next.id ? next : item)))
    }

    const deleteItem = (id: string) => {
        setItems((previous: EventItem[]) => previous.filter((item) => item.id !== id))
        close()
    }

    const onAddQuick = (dateKey: string, startMin: number, endMin: number) => {
        setQuickAdd({
            dateKey,
            startMin,
            endMin,
            label: "",
        })
    }

    const confirmQuickAdd = () => {
        if (!quickAdd) return
        const label = quickAdd.label.trim()
        if (!label) return

        const item: EventItem = {
            id: crypto.randomUUID(),
            dateKey: quickAdd.dateKey,
            startMin: quickAdd.startMin,
            endMin: quickAdd.endMin,
            label,
            description: "",
            urls: [],
        }

        setItems((previous: EventItem[]) => [...previous, item])
        setQuickAdd(null)
    }

    const handleExport = () => {
        downloadJson(items)
        setTransferMessage(`Exported ${items.length} event${items.length === 1 ? "" : "s"} to JSON.`)
        setTransferState("success")
    }

    const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const raw = await file.text()
            const parsed = parseEventItems(raw)

            if (!parsed) {
                setTransferMessage("Import failed. The JSON file is invalid or missing required fields.")
                setTransferState("error")
                return
            }

            setItems(parsed)
            close()
            setTransferMessage(`Imported ${parsed.length} event${parsed.length === 1 ? "" : "s"} from ${file.name}.`)
            setTransferState("success")
        } catch {
            setTransferMessage("Import failed. The file could not be read.")
            setTransferState("error")
        } finally {
            event.target.value = ""
        }
    }

    const showDayNavigator = viewMode !== "week"
    const dayLabel = formatDateHeader(centerDateKey)
    const todayKey = getTodayDateKey()
    const calendarDays = getMonthCalendarDays(calendarMonthKey)
    const moveDate = (direction: -1 | 1) => shiftCenter(direction)
    const jumpToDate = (dateKey: string) => {
        setCenterDateKey(dateKey)
        setCalendarMonthKey(dateKey)
        setCalendarOpen(false)
    }

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
            <div className="fixed left-1/2 top-3 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg shadow-gray-900/10 backdrop-blur sm:top-4">
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
                    type="button"
                    aria-label="Previous dates"
                    onClick={() => moveDate(-1)}
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
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <button
                    className="h-9 rounded-full px-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                    type="button"
                    onClick={goToday}
                >
                    Today
                </button>
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
                    type="button"
                    aria-label="Next dates"
                    onClick={() => moveDate(1)}
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
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>

            <button
                className="fixed right-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:bg-white sm:right-4 sm:top-4"
                type="button"
                aria-label="Open settings"
                onClick={() => setSettingsOpen(true)}
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
                    <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7.1 4.3l.1.1A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
                </svg>
            </button>
            <div className="fixed right-3 top-16 z-40 sm:right-4 sm:top-[4.25rem]">
                <button
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:bg-white"
                    type="button"
                    aria-label="Open calendar"
                    onClick={() => {
                        setCalendarMonthKey(centerDateKey)
                        setCalendarOpen((open) => !open)
                    }}
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

                {calendarOpen ? (
                    <div
                        className="mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl shadow-gray-900/15"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50"
                                type="button"
                                aria-label="Previous month"
                                onClick={() => setCalendarMonthKey((current) => addMonths(current, -1))}
                            >
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
                            </button>
                            <div className="flex-1 text-center text-sm font-semibold text-gray-900">
                                {getMonthLabel(calendarMonthKey)}
                            </div>
                            <button
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50"
                                type="button"
                                aria-label="Next month"
                                onClick={() => setCalendarMonthKey((current) => addMonths(current, 1))}
                            >
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
                            </button>
                        </div>

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
                                const isToday = day.dateKey === todayKey
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
                                        onClick={() => jumpToDate(day.dateKey)}
                                    >
                                        {day.day}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ) : null}
            </div>

            {transferMessage ? (
                <div
                    className={`fixed left-3 right-16 top-3 z-30 rounded-lg px-3 py-2 text-sm shadow-lg sm:left-auto sm:right-20 sm:top-4 sm:w-96 ${
                        transferState === "error"
                            ? "border border-rose-200 bg-rose-50 text-rose-700"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                >
                    {transferMessage}
                </div>
            ) : null}

            <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                    void handleImport(event)
                }}
            />

            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col p-2 pt-16 sm:p-4 sm:pt-16">
                <div className="min-h-0 flex-1">
                    <WeekGrid
                        items={items}
                        visibleDateKeys={visibleDateKeys}
                        gridMin={GRID_MIN}
                        defaultDurationMin={DEFAULT_DURATION}
                        pxPerMin={pxPerMin}
                        viewStartMin={viewStartMin}
                        viewEndMin={viewEndMin}
                        nowMin={nowMin}
                        onAddQuick={onAddQuick}
                        onMoveEvent={(id, next) => {
                            setItems((previous: EventItem[]) =>
                                previous.map((item) => (item.id === id ? { ...item, ...next } : item))
                            )
                        }}
                        onSelectEvent={(id, rect) => open(id, rect)}
                        onDeselect={close}
                        selectedId={selectedId}
                    />
                </div>
            </div>

            {quickAdd ? (
                <QuickAddModal
                    value={quickAdd}
                    onChange={(next) => setQuickAdd(next)}
                    onCancel={() => setQuickAdd(null)}
                    onConfirm={confirmQuickAdd}
                />
            ) : null}

            {selectedItem && selectedAnchor ? (
                <EventDetailsPopover
                    item={selectedItem}
                    anchorRect={selectedAnchor}
                    onClose={close}
                    onChange={(patch) => updateSelected({ ...selectedItem, ...patch })}
                    onDelete={() => deleteItem(selectedItem.id)}
                />
            ) : null}

            {settingsOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/35 px-3 py-4 sm:items-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="settings-title"
                    onMouseDown={() => setSettingsOpen(false)}
                >
                    <div
                        className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
                            <h2 id="settings-title" className="text-base font-semibold text-gray-900">
                                Settings
                            </h2>
                            <button
                                className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-5 overflow-y-auto px-4 py-4">
                            <section className={SETTINGS_SECTION_CLASS}>
                                <h3 className="text-sm font-semibold text-gray-900">View</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((mode) => (
                                        <button
                                            key={mode}
                                            className={viewMode === mode ? ACTIVE_BUTTON_CLASS : BUTTON_CLASS}
                                            type="button"
                                            onClick={() => setViewMode(mode)}
                                        >
                                            {VIEW_MODE_LABELS[mode]}
                                        </button>
                                    ))}
                                </div>

                                {showDayNavigator ? (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        <button className={BUTTON_CLASS} type="button" onClick={() => moveDate(-1)}>
                                            Prev
                                        </button>
                                        <button className={BUTTON_CLASS} type="button" onClick={goToday}>
                                            Today
                                        </button>
                                        <button className={BUTTON_CLASS} type="button" onClick={() => moveDate(1)}>
                                            Next
                                        </button>
                                        <div className="col-span-3 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
                                            Focus: {dayLabel}
                                        </div>
                                    </div>
                                ) : null}
                            </section>

                            <section className={SETTINGS_SECTION_CLASS}>
                                <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {ZOOM_OPTIONS.map((option) => (
                                        <button
                                            key={option}
                                            className={zoom === option ? ACTIVE_BUTTON_CLASS : BUTTON_CLASS}
                                            type="button"
                                            onClick={() => setZoom(option)}
                                        >
                                            {option}%
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className={`${BUTTON_CLASS} mt-3 w-full`}
                                    type="button"
                                    onClick={() => setStartAtMidnight(!startAtMidnight)}
                                >
                                    {startAtMidnight ? "Start timeline at 6:00" : "Start timeline at 0:00"}
                                </button>
                            </section>

                            <section className={SETTINGS_SECTION_CLASS}>
                                <h3 className="text-sm font-semibold text-gray-900">Backup</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className={BUTTON_CLASS} type="button" onClick={handleExport} disabled={!loaded}>
                                        Export JSON
                                    </button>
                                    <button
                                        className={BUTTON_CLASS}
                                        type="button"
                                        onClick={() => importInputRef.current?.click()}
                                        disabled={!loaded}
                                    >
                                        Import JSON
                                    </button>
                                </div>
                            </section>

                            <section className={SETTINGS_SECTION_CLASS}>
                                <h3 className="text-sm font-semibold text-gray-900">Alarm</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={alarmEnabled}
                                            onChange={(event) => {
                                                const checked = event.target.checked
                                                setAlarmEnabled(checked)
                                                if (checked) void alarm.primeAudio()
                                            }}
                                        />
                                        Alarm
                                    </label>

                                    <label className="ml-auto flex items-center gap-2">
                                        Lead min
                                        <input
                                            type="number"
                                            min={0}
                                            max={120}
                                            value={alarmLeadMin}
                                            onChange={(event) => setAlarmLeadMin(Number(event.target.value || 0))}
                                            className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                                        />
                                    </label>
                                </div>

                                <button
                                    className={`${BUTTON_CLASS} mt-3 w-full`}
                                    type="button"
                                    onClick={() => alarm.requestNotificationPermission()}
                                >
                                    Notification permission
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    )
}

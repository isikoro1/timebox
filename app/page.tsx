"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { QuickAddModal, type QuickAddState } from "../components/QuickAddModal"
import { EventDetailsPopover } from "../components/EventDetailsPopover"
import { type EventItem, WeekGrid } from "../components/WeekGrid"
import { useAlarm } from "../hooks/useAlarm"
import { useNowMin } from "../hooks/useNowMin"
import { useSelection } from "../hooks/useSelection"
import { useTimeboxingItems } from "../hooks/useTimeboxingItems"
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP, useViewOptions } from "../hooks/useViewOptions"
import { formatDateHeader, getTodayDateKey, parseDateKey, toDateKey } from "../lib/date"
import { formatJapaneseEraYear } from "../lib/japaneseCalendar"
import { parseEventItems } from "../lib/storage"

const STORAGE_KEY = "timeboxing-tool:v1:week-items"
const GRID_MIN = 15
const DEFAULT_DURATION = 30
const BUTTON_CLASS =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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
        startHour,
        setStartHour,
        visibleDayCount,
        setVisibleDayCount,
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

    useEffect(() => {
        if (!calendarOpen) return

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null
            if (target?.closest('[data-calendar-root="1"]')) return
            setCalendarOpen(false)
        }

        window.addEventListener("pointerdown", onPointerDown)
        return () => window.removeEventListener("pointerdown", onPointerDown)
    }, [calendarOpen])

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

    const dayLabel = formatDateHeader(centerDateKey)
    const visibleMonthLabel = getMonthLabel(visibleDateKeys[0] ?? centerDateKey)
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
            <div className="fixed left-3 top-3 z-40 rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-sm font-semibold text-gray-800 shadow-lg shadow-gray-900/10 backdrop-blur sm:left-4 sm:top-4">
                {visibleMonthLabel}
            </div>

            <div className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg shadow-gray-900/10 backdrop-blur sm:bottom-4">
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
            <div className="fixed right-3 top-16 z-40 sm:right-4 sm:top-[4.25rem]" data-calendar-root="1">
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

            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col p-2 pb-16 pt-16 sm:p-4 sm:pb-16 sm:pt-16">
                <div className="min-h-0 flex-1">
                    <WeekGrid
                        items={items}
                        visibleDateKeys={visibleDateKeys}
                        visibleDayCount={visibleDayCount}
                        onChangeVisibleDayCount={setVisibleDayCount}
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
                                <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
                                    Focus: {dayLabel}
                                </div>
                            </section>

                            <section className={SETTINGS_SECTION_CLASS}>
                                <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
                                <label className="block text-sm text-gray-700">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span>Scale</span>
                                        <span className="font-semibold tabular-nums text-gray-900">{zoom}%</span>
                                    </div>
                                    <input
                                        className="w-full accent-blue-600"
                                        type="range"
                                        min={MIN_ZOOM}
                                        max={MAX_ZOOM}
                                        step={ZOOM_STEP}
                                        value={zoom}
                                        onChange={(event) => setZoom(Number(event.target.value))}
                                    />
                                </label>
                                <label className="mt-4 block text-sm text-gray-700">
                                    <div className="mb-2">Start hour</div>
                                    <select
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                                        value={startHour}
                                        onChange={(event) => setStartHour(Number(event.target.value))}
                                    >
                                        {Array.from({ length: 13 }, (_, hour) => (
                                            <option key={hour} value={hour}>
                                                {hour}:00
                                            </option>
                                        ))}
                                    </select>
                                </label>
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

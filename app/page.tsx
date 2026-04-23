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
import { parseEventItems } from "../lib/storage"

const STORAGE_KEY = "timeboxing-tool:v1:week-items"
const GRID_MIN = 15
const DEFAULT_DURATION = 30
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const VIEW_MODE_LABELS: Record<ViewMode, string> = {
    day: "1 day",
    "3days": "3 days",
    week: "Week",
}
const ZOOM_OPTIONS: ZoomLevel[] = [100, 150, 200]
const BUTTON_CLASS =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
const ACTIVE_BUTTON_CLASS =
    "rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"

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

export default function Home() {
    const { items, setItems, loaded } = useTimeboxingItems(STORAGE_KEY)
    const nowMin = useNowMin(15000)
    const [alarmEnabled, setAlarmEnabled] = useState(false)
    const [alarmLeadMin, setAlarmLeadMin] = useState(0)
    const [transferMessage, setTransferMessage] = useState<string | null>(null)
    const [transferState, setTransferState] = useState<"success" | "error" | null>(null)

    const {
        startAtMidnight,
        setStartAtMidnight,
        viewMode,
        setViewMode,
        zoom,
        setZoom,
        centerDay,
        shiftCenter,
        goToday,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDays,
    } = useViewOptions()

    const { selectedId, selectedAnchor, selectedItem, open, close } = useSelection(items)
    const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)
    const clipboardRef = useRef<EventItem | null>(null)
    const importInputRef = useRef<HTMLInputElement | null>(null)

    const alarmItems = useMemo(
        () =>
            items.map((item) => ({
                id: item.id,
                dayIndex: item.dayIndex,
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

    const updateSelected = (next: EventItem) => {
        setItems((previous: EventItem[]) => previous.map((item) => (item.id === next.id ? next : item)))
    }

    const deleteItem = (id: string) => {
        setItems((previous: EventItem[]) => previous.filter((item) => item.id !== id))
        close()
    }

    const onAddQuick = (dayIndex: number, startMin: number, endMin: number) => {
        setQuickAdd({
            dayIndex,
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
            dayIndex: quickAdd.dayIndex,
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
    const dayLabel = DAY_NAMES[centerDay]

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
            <header className="border-b border-gray-200 bg-gray-50/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Timebox</h1>
                            <p className="text-sm text-gray-600">
                                Weekly planner with JSON backup, zoom levels, and mobile-friendly views.
                            </p>
                        </div>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    className={viewMode === mode ? ACTIVE_BUTTON_CLASS : BUTTON_CLASS}
                                    onClick={() => setViewMode(mode)}
                                >
                                    {VIEW_MODE_LABELS[mode]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {showDayNavigator ? (
                            <>
                                <button className={BUTTON_CLASS} onClick={() => shiftCenter(-1)}>
                                    Prev
                                </button>
                                <button className={BUTTON_CLASS} onClick={goToday}>
                                    Today
                                </button>
                                <button className={BUTTON_CLASS} onClick={() => shiftCenter(1)}>
                                    Next
                                </button>
                                <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
                                    Focus: {dayLabel}
                                </div>
                            </>
                        ) : null}

                        <label className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                            Zoom
                            <select
                                className="rounded border border-gray-200 bg-white px-2 py-1"
                                value={zoom}
                                onChange={(event) => setZoom(Number(event.target.value) as ZoomLevel)}
                            >
                                {ZOOM_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}%
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            className={BUTTON_CLASS}
                            onClick={() => setStartAtMidnight(!startAtMidnight)}
                        >
                            {startAtMidnight ? "Start 6:00" : "Start 0:00"}
                        </button>

                        <button className={BUTTON_CLASS} onClick={handleExport} disabled={!loaded}>
                            Export JSON
                        </button>

                        <button
                            className={BUTTON_CLASS}
                            onClick={() => importInputRef.current?.click()}
                            disabled={!loaded}
                        >
                            Import JSON
                        </button>

                        <input
                            ref={importInputRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={(event) => {
                                void handleImport(event)
                            }}
                        />
                    </div>

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

                        <label className="flex items-center gap-2">
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

                        <button
                            className={BUTTON_CLASS}
                            onClick={() => alarm.requestNotificationPermission()}
                        >
                            Notification permission
                        </button>

                        <div className="text-xs text-gray-500">
                            Double-click empty time to add. Ctrl+C / Ctrl+V duplicates the selected event.
                        </div>
                    </div>

                    {transferMessage ? (
                        <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                                transferState === "error"
                                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                        >
                            {transferMessage}
                        </div>
                    ) : null}
                </div>
            </header>

            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4">
                <div className="min-h-0 flex-1">
                    <WeekGrid
                        items={items}
                        visibleDays={visibleDays}
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

                <div className="mt-3 text-xs text-gray-600">
                    Data still saves to browser localStorage by default. JSON export/import is optional for backup or migration.
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
        </main>
    )
}

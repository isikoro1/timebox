"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarPopover, getMonthLabel } from "../components/CalendarPopover"
import { EventDetailsPopover } from "../components/EventDetailsPopover"
import { FloatingControls } from "../components/FloatingControls"
import { QuickAddModal, type QuickAddState } from "../components/QuickAddModal"
import { TransferToast } from "../components/TransferToast"
import { type EventItem, WeekGrid } from "../components/WeekGrid"
import { SettingsDialog } from "../components/SettingsDialog"
import { useAlarm } from "../hooks/useAlarm"
import { useJsonTransfer } from "../hooks/useJsonTransfer"
import { useNowMin } from "../hooks/useNowMin"
import { useSelection } from "../hooks/useSelection"
import { useSwipeNavigation } from "../hooks/useSwipeNavigation"
import { useTimeboxingItems } from "../hooks/useTimeboxingItems"
import { DAY_WIDTH_ZOOM_STEP, ZOOM_STEP, useViewOptions } from "../hooks/useViewOptions"
import { formatDateHeader, getTodayDateKey } from "../lib/date"

const STORAGE_KEY = "timeboxing-tool:v1:week-items"
const GRID_MIN = 15
const DEFAULT_DURATION = 30

export default function Home() {
    const { items, setItems, loaded } = useTimeboxingItems(STORAGE_KEY)
    const nowMin = useNowMin(15000)
    const [alarmEnabled, setAlarmEnabled] = useState(false)
    const [alarmLeadMin, setAlarmLeadMin] = useState(0)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [calendarMonthKey, setCalendarMonthKey] = useState(getTodayDateKey)

    const {
        startHour,
        setStartHour,
        zoom,
        setZoom,
        dayWidthZoom,
        setDayWidthZoom,
        dayColumnMinWidth,
        centerDateKey,
        setCenterDateKey,
        shiftCenter,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDateKeys,
    } = useViewOptions()

    const { selectedId, selectedAnchor, selectedItem, open, close } = useSelection(items)
    const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)
    const clipboardRef = useRef<EventItem | null>(null)

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

    const { importInputRef, transferMessage, transferState, exportJson, importJson, openImportPicker } =
        useJsonTransfer({
            items,
            setItems,
            onImportSuccess: close,
        })

    const moveDate = (direction: -1 | 1) => shiftCenter(direction)
    const zoomTimeline = (direction: -1 | 1) => setZoom((current) => current + direction * ZOOM_STEP)
    const zoomDayWidth = (direction: -1 | 1) =>
        setDayWidthZoom((current) => current + direction * DAY_WIDTH_ZOOM_STEP)

    const { startSwipe, trackSwipe, finishSwipe, cancelSwipe } = useSwipeNavigation({
        zoom,
        dayWidthZoom,
        setZoom,
        setDayWidthZoom,
        onMoveDate: moveDate,
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

    const jumpToDate = (dateKey: string) => {
        setCenterDateKey(dateKey)
        setCalendarMonthKey(dateKey)
        setCalendarOpen(false)
    }

    const todayKey = getTodayDateKey()
    const visibleMonthLabel = getMonthLabel(visibleDateKeys[0] ?? centerDateKey)

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
            <FloatingControls
                visibleMonthLabel={visibleMonthLabel}
                dayWidthZoom={dayWidthZoom}
                zoom={zoom}
                onMoveDate={moveDate}
                onOpenSettings={() => setSettingsOpen(true)}
                onZoomDayWidth={zoomDayWidth}
                onZoomTimeline={zoomTimeline}
            />

            <CalendarPopover
                open={calendarOpen}
                monthDateKey={calendarMonthKey}
                centerDateKey={centerDateKey}
                todayDateKey={todayKey}
                onOpenChange={(openNext) => {
                    setCalendarMonthKey(centerDateKey)
                    setCalendarOpen(openNext)
                }}
                onMonthChange={setCalendarMonthKey}
                onToday={() => jumpToDate(todayKey)}
                onSelectDate={jumpToDate}
            />

            <TransferToast message={transferMessage} state={transferState} />

            <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                    void importJson(event)
                }}
            />

            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col p-2 pb-16 pt-16 sm:p-4 sm:pb-16 sm:pt-16">
                <div
                    className="min-h-0 flex-1 touch-pan-y"
                    onPointerDown={startSwipe}
                    onPointerMove={trackSwipe}
                    onPointerUp={finishSwipe}
                    onPointerCancel={cancelSwipe}
                >
                    <WeekGrid
                        items={items}
                        visibleDateKeys={visibleDateKeys}
                        gridMin={GRID_MIN}
                        defaultDurationMin={DEFAULT_DURATION}
                        pxPerMin={pxPerMin}
                        viewStartMin={viewStartMin}
                        viewEndMin={viewEndMin}
                        dayColumnMinWidth={dayColumnMinWidth}
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

            <SettingsDialog
                open={settingsOpen}
                loaded={loaded}
                focusLabel={formatDateHeader(centerDateKey)}
                startHour={startHour}
                alarmEnabled={alarmEnabled}
                alarmLeadMin={alarmLeadMin}
                alarm={alarm}
                onClose={() => setSettingsOpen(false)}
                onStartHourChange={setStartHour}
                onExport={exportJson}
                onImport={openImportPicker}
                onAlarmEnabledChange={setAlarmEnabled}
                onAlarmLeadMinChange={setAlarmLeadMin}
            />
        </main>
    )
}

"use client"

import React from "react"
import { DayColumn } from "./week/DayColumn"
import { formatDateHeader, getTodayDateKey } from "../lib/date"

export type EventItem = {
    id: string
    dateKey: string
    startMin: number
    endMin: number
    label: string
    urls?: string[]
    description?: string
}

const TIME_COLUMN_WIDTH = 52

type LayoutInfo = { lane: 0 | 1; lanesCount: 1 | 2 }

function computeTwoLaneLayout(items: EventItem[]): Map<string, LayoutInfo> {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    const result = new Map<string, LayoutInfo>()

    let laneEnd0 = -1
    let laneEnd1 = -1

    for (const item of sorted) {
        const overlapsLane0 = item.startMin < laneEnd0
        const overlapsLane1 = item.startMin < laneEnd1

        if (!overlapsLane0) {
            result.set(item.id, { lane: 0, lanesCount: overlapsLane1 ? 2 : 1 })
            laneEnd0 = item.endMin
            continue
        }

        if (!overlapsLane1) {
            result.set(item.id, { lane: 1, lanesCount: 2 })
            laneEnd1 = item.endMin
            continue
        }

        result.set(item.id, { lane: 1, lanesCount: 2 })
        laneEnd1 = Math.max(laneEnd1, item.endMin)
    }

    for (let i = 0; i < sorted.length; i += 1) {
        for (let j = i + 1; j < sorted.length; j += 1) {
            const a = sorted[i]
            const b = sorted[j]
            const overlap = a.startMin < b.endMin && b.startMin < a.endMin
            if (!overlap) continue

            const layoutA = result.get(a.id)
            const layoutB = result.get(b.id)
            if (!layoutA || !layoutB || layoutA.lane === layoutB.lane) continue

            result.set(a.id, { ...layoutA, lanesCount: 2 })
            result.set(b.id, { ...layoutB, lanesCount: 2 })
        }
    }

    return result
}

export function WeekGrid({
    items,
    pxPerMin,
    gridMin,
    defaultDurationMin,
    nowMin,
    viewStartMin,
    viewEndMin,
    visibleDateKeys,
    selectedId,
    onAddQuick,
    onDoubleClickEmpty,
    onMoveEvent,
    onSelectEvent,
    onDeselect,
}: {
    items: EventItem[]
    pxPerMin: number
    gridMin: number
    defaultDurationMin: number
    nowMin: number | null
    viewStartMin: number
    viewEndMin: number
    visibleDateKeys: string[]
    selectedId: string | null
    onAddQuick?: (dateKey: string, startMin: number, endMin: number) => void
    onDoubleClickEmpty?: (dateKey: string, startMin: number, endMin: number) => void
    onMoveEvent: (id: string, next: { dateKey: string; startMin: number; endMin: number }) => void
    onSelectEvent: (id: string, rect: DOMRect) => void
    onDeselect?: () => void
}) {
    const rangeMin = viewEndMin - viewStartMin
    const gridHeightPx = rangeMin * pxPerMin

    const itemsByDate: Record<string, EventItem[]> = {}
    for (const dateKey of visibleDateKeys) itemsByDate[dateKey] = []
    for (const item of items) {
        if (itemsByDate[item.dateKey]) itemsByDate[item.dateKey].push(item)
    }
    for (const dateKey of visibleDateKeys) {
        itemsByDate[dateKey].sort((a, b) => a.startMin - b.startMin)
    }

    const layoutByDate: Record<string, Map<string, LayoutInfo>> = {}
    for (const dateKey of visibleDateKeys) {
        layoutByDate[dateKey] = computeTwoLaneLayout(itemsByDate[dateKey] ?? [])
    }

    const startHour = Math.floor(viewStartMin / 60)
    const endHour = Math.floor(viewEndMin / 60)
    const headerColumns = `${TIME_COLUMN_WIDTH}px repeat(${visibleDateKeys.length}, minmax(0, 1fr))`
    const handleEmpty = onAddQuick ?? onDoubleClickEmpty ?? (() => {})
    const todayKey = getTodayDateKey()

    return (
        <div
            className="h-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-gray-200 bg-white"
            onMouseDown={(event) => {
                if (!onDeselect) return
                const target = event.target as HTMLElement
                if (target.closest('[data-eventblock="1"]')) return
                onDeselect()
            }}
        >
            <div className="min-w-full">
                <div
                    className="sticky top-0 z-30 grid border-b border-gray-200 bg-gray-50/95 backdrop-blur"
                    style={{ gridTemplateColumns: headerColumns }}
                >
                    <div className="sticky left-0 z-40 border-r border-gray-200 bg-gray-50/95 p-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Time
                    </div>
                    {visibleDateKeys.map((dateKey) => {
                        const isToday = dateKey === todayKey
                        const [dayName, dateLabel] = formatDateHeader(dateKey).split(" ")
                        return (
                            <div
                                key={dateKey}
                                className={`min-w-0 border-r border-gray-200 px-1 py-1.5 text-center text-xs font-semibold last:border-r-0 ${
                                    isToday ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "text-gray-800"
                                }`}
                            >
                                <div className="truncate leading-4">{dayName}</div>
                                <div className="truncate leading-4">{dateLabel}</div>
                                {isToday ? (
                                    <div className="mt-0.5 inline-flex max-w-full rounded-full bg-red-100 px-1 py-0.5 text-[9px] font-semibold leading-none text-red-700">
                                        Today
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>

                <div className="flex">
                    <div
                        className="relative sticky left-0 z-20 shrink-0 border-r border-gray-200 bg-white"
                        style={{ width: TIME_COLUMN_WIDTH, height: gridHeightPx }}
                    >
                        {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
                            const hour = startHour + index
                            const top = (hour * 60 - viewStartMin) * pxPerMin
                            return (
                                <div key={hour} className="absolute left-0 right-0" style={{ top }}>
                                    <div className="px-2 text-[11px] text-gray-500">{hour}:00</div>
                                </div>
                            )
                        })}
                    </div>

                    <div
                        className="grid flex-1"
                        data-daygrid="1"
                        style={{ gridTemplateColumns: `repeat(${visibleDateKeys.length}, minmax(0, 1fr))` }}
                    >
                        {visibleDateKeys.map((dateKey, visibleIndex) => (
                            <DayColumn
                                key={dateKey}
                                dateKey={dateKey}
                                visibleIndex={visibleIndex}
                                visibleDateKeys={visibleDateKeys}
                                items={itemsByDate[dateKey] ?? []}
                                layout={layoutByDate[dateKey]}
                                pxPerMin={pxPerMin}
                                gridMin={gridMin}
                                defaultDurationMin={defaultDurationMin}
                                nowMin={dateKey === todayKey ? nowMin : null}
                                viewStartMin={viewStartMin}
                                viewEndMin={viewEndMin}
                                heightPx={gridHeightPx}
                                isToday={dateKey === todayKey}
                                selectedId={selectedId}
                                onDoubleClickEmpty={handleEmpty}
                                onMoveEvent={onMoveEvent}
                                onSelectEvent={onSelectEvent}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

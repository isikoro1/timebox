"use client"

import React from "react"
import { DayColumn } from "./week/DayColumn"

export type EventItem = {
    id: string
    dayIndex: number
    startMin: number
    endMin: number
    label: string
    urls?: string[]
    description?: string
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_COLUMN_WIDTH = 64
const DAY_COLUMN_MIN_WIDTH = 180

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
    visibleDays,
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
    visibleDays: number[]
    selectedId: string | null
    onAddQuick?: (dayIndex: number, startMin: number, endMin: number) => void
    onDoubleClickEmpty?: (dayIndex: number, startMin: number, endMin: number) => void
    onMoveEvent: (id: string, next: { dayIndex: number; startMin: number; endMin: number }) => void
    onSelectEvent: (id: string, rect: DOMRect) => void
    onDeselect?: () => void
}) {
    const rangeMin = viewEndMin - viewStartMin
    const gridHeightPx = rangeMin * pxPerMin

    const itemsByDay: Record<number, EventItem[]> = {}
    for (const day of visibleDays) itemsByDay[day] = []
    for (const item of items) {
        if (itemsByDay[item.dayIndex]) itemsByDay[item.dayIndex].push(item)
    }
    for (const day of visibleDays) {
        itemsByDay[day].sort((a, b) => a.startMin - b.startMin)
    }

    const layoutByDay: Record<number, Map<string, LayoutInfo>> = {}
    for (const day of visibleDays) {
        layoutByDay[day] = computeTwoLaneLayout(itemsByDay[day] ?? [])
    }

    const startHour = Math.floor(viewStartMin / 60)
    const endHour = Math.floor(viewEndMin / 60)
    const headerColumns = `${TIME_COLUMN_WIDTH}px repeat(${visibleDays.length}, minmax(${DAY_COLUMN_MIN_WIDTH}px, 1fr))`
    const contentWidth = TIME_COLUMN_WIDTH + DAY_COLUMN_MIN_WIDTH * visibleDays.length
    const handleEmpty = onAddQuick ?? onDoubleClickEmpty ?? (() => {})

    return (
        <div
            className="h-full overflow-auto overscroll-contain rounded-xl border border-gray-200 bg-white"
            onMouseDown={(event) => {
                if (!onDeselect) return
                const target = event.target as HTMLElement
                if (target.closest('[data-eventblock="1"]')) return
                onDeselect()
            }}
        >
            <div className="min-w-full" style={{ minWidth: `${contentWidth}px` }}>
                <div
                    className="sticky top-0 z-30 grid border-b border-gray-200 bg-gray-50/95 backdrop-blur"
                    style={{ gridTemplateColumns: headerColumns }}
                >
                    <div className="sticky left-0 z-40 border-r border-gray-200 bg-gray-50/95 p-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Time
                    </div>
                    {visibleDays.map((dayIndex) => (
                        <div
                            key={dayIndex}
                            className="border-r border-gray-200 p-2 text-sm font-semibold text-gray-800 last:border-r-0"
                        >
                            {DAY_NAMES[dayIndex]}
                        </div>
                    ))}
                </div>

                <div className="flex">
                    <div
                        className="relative sticky left-0 z-20 w-16 shrink-0 border-r border-gray-200 bg-white"
                        style={{ height: gridHeightPx }}
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
                        style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(${DAY_COLUMN_MIN_WIDTH}px, 1fr))` }}
                    >
                        {visibleDays.map((dayIndex, visibleIndex) => (
                            <DayColumn
                                key={dayIndex}
                                dayIndex={dayIndex}
                                visibleIndex={visibleIndex}
                                visibleDays={visibleDays}
                                items={itemsByDay[dayIndex] ?? []}
                                layout={layoutByDay[dayIndex]}
                                pxPerMin={pxPerMin}
                                gridMin={gridMin}
                                defaultDurationMin={defaultDurationMin}
                                nowMin={nowMin}
                                viewStartMin={viewStartMin}
                                viewEndMin={viewEndMin}
                                heightPx={gridHeightPx}
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

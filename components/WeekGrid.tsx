"use client"

import React from "react"
import { DayColumn } from "./week/DayColumn"
import { formatDateHeader, getTodayDateKey, parseDateKey } from "../lib/date"
import { getJapaneseHolidayName } from "../lib/japaneseCalendar"
import { minToHHMM } from "../lib/time"

export type EventItem = {
    id: string
    dateKey: string
    startMin: number
    endMin: number
    label: string
    urls?: string[]
    description?: string
}

const TIME_COLUMN_WIDTH = 56

type LayoutInfo = { lane: 0 | 1; lanesCount: 1 | 2 }
type DayTone = "weekday" | "saturday" | "rest"

function getDayTone(dateKey: string, holidayName: string | null): DayTone {
    const day = parseDateKey(dateKey).getDay()
    if (holidayName || day === 0) return "rest"
    if (day === 6) return "saturday"
    return "weekday"
}

function getHeaderClass(isToday: boolean, dayTone: DayTone) {
    if (isToday) return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
    if (dayTone === "rest") return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100"
    if (dayTone === "saturday") return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100"
    return "text-gray-800"
}

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
    dayColumnMinWidth,
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
    dayColumnMinWidth: number
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
    const dayColumnTemplate = `repeat(${visibleDateKeys.length}, minmax(${dayColumnMinWidth}px, 1fr))`
    const headerColumns = `${TIME_COLUMN_WIDTH}px ${dayColumnTemplate}`
    const contentMinWidth = TIME_COLUMN_WIDTH + dayColumnMinWidth * visibleDateKeys.length
    const handleEmpty = onAddQuick ?? onDoubleClickEmpty ?? (() => {})
    const todayKey = getTodayDateKey()
    const todayIndex = visibleDateKeys.indexOf(todayKey)
    const showNowLine = nowMin !== null && nowMin >= viewStartMin && nowMin <= viewEndMin
    const nowLineTop = showNowLine ? (nowMin - viewStartMin) * pxPerMin : 0

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
            <div className="min-w-full" style={{ minWidth: contentMinWidth }}>
                <div
                    className="sticky top-0 z-30 grid border-b border-gray-200 bg-gray-50/95 backdrop-blur"
                    style={{ gridTemplateColumns: headerColumns }}
                >
                    <div className="sticky left-0 z-40 border-r border-gray-200 bg-gray-50/95" aria-hidden="true" />
                    {visibleDateKeys.map((dateKey) => {
                        const isToday = dateKey === todayKey
                        const [dayName, dateLabel] = formatDateHeader(dateKey).split(" ")
                        const holidayName = getJapaneseHolidayName(dateKey)
                        const dayTone = getDayTone(dateKey, holidayName)
                        return (
                            <div
                                key={dateKey}
                                className={`min-w-0 border-r border-gray-200 px-1 py-1.5 text-center text-xs font-semibold last:border-r-0 ${getHeaderClass(
                                    isToday,
                                    dayTone
                                )}`}
                            >
                                <div className="truncate leading-4">{dayName}</div>
                                <div className="truncate leading-4">{dateLabel}</div>
                                {holidayName ? (
                                    <div className="mt-0.5 truncate text-[10px] font-semibold leading-3 text-rose-600">
                                        {holidayName}
                                    </div>
                                ) : null}
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
                        className="relative grid flex-1"
                        data-daygrid="1"
                        style={{ gridTemplateColumns: dayColumnTemplate }}
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
                                viewStartMin={viewStartMin}
                                viewEndMin={viewEndMin}
                                heightPx={gridHeightPx}
                                isToday={dateKey === todayKey}
                                dayTone={getDayTone(dateKey, getJapaneseHolidayName(dateKey))}
                                selectedId={selectedId}
                                onDoubleClickEmpty={handleEmpty}
                                onMoveEvent={onMoveEvent}
                                onSelectEvent={onSelectEvent}
                            />
                        ))}

                        {showNowLine ? (
                            <div
                                className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-gray-700/65"
                                style={{ top: nowLineTop }}
                                title={`now ${minToHHMM(nowMin)}`}
                                aria-hidden="true"
                            >
                                {todayIndex >= 0 ? (
                                    <div
                                        className="absolute -top-0.5 border-t-[3px] border-red-500"
                                        style={{
                                            left: `${(todayIndex / visibleDateKeys.length) * 100}%`,
                                            width: `${100 / visibleDateKeys.length}%`,
                                        }}
                                    />
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

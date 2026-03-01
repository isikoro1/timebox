"use client"

import React from "react"
import { DayColumn } from "./week/DayColumn"

export type EventItem = {
    id: string
    dayIndex: number // 0..6 (Mon..Sun)
    startMin: number // 0..1440
    endMin: number // 0..1440
    label: string
    urls?: string[]
    description?: string
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type LayoutInfo = { lane: 0 | 1; lanesCount: 1 | 2 }

function computeTwoLaneLayout(items: EventItem[]): Map<string, LayoutInfo> {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    const res = new Map<string, LayoutInfo>()

    let laneEnd0 = -1
    let laneEnd1 = -1

    for (const it of sorted) {
        const overlaps0 = it.startMin < laneEnd0
        const overlaps1 = it.startMin < laneEnd1

        if (!overlaps0) {
            const needTwo = overlaps1
            res.set(it.id, { lane: 0, lanesCount: needTwo ? 2 : 1 })
            laneEnd0 = it.endMin
            continue
        }

        if (!overlaps1) {
            res.set(it.id, { lane: 1, lanesCount: 2 })
            laneEnd1 = it.endMin
            continue
        }

        res.set(it.id, { lane: 1, lanesCount: 2 })
        laneEnd1 = Math.max(laneEnd1, it.endMin)
    }

    for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            const a = sorted[i],
                b = sorted[j]
            const overlap = a.startMin < b.endMin && b.startMin < a.endMin
            if (!overlap) continue
            const la = res.get(a.id)
            const lb = res.get(b.id)
            if (!la || !lb) continue
            if (la.lane !== lb.lane) {
                res.set(a.id, { ...la, lanesCount: 2 })
                res.set(b.id, { ...lb, lanesCount: 2 })
            }
        }
    }

    return res
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

    // ✅ page.tsx から渡される
    onAddQuick,

    // 互換用（残ってても壊れない）
    onDoubleClickEmpty,

    onMoveEvent,
    onSelectEvent,

    // ✅ page.tsx から渡される（クリックで閉じる用）
    onDeselect,

    // ✅ page.tsx から渡される（今は見た目用のフラグ）
    compact,
}: {
    items: EventItem[]
    pxPerMin: number
    gridMin: number
    defaultDurationMin: number
    nowMin: number
    viewStartMin: number
    viewEndMin: number
    visibleDays: number[]
    selectedId: string | null

    onAddQuick?: (dayIndex: number, startMin: number, endMin: number) => void
    onDoubleClickEmpty?: (dayIndex: number, startMin: number, endMin: number) => void

    onMoveEvent: (id: string, next: { dayIndex: number; startMin: number; endMin: number }) => void
    onSelectEvent: (id: string, rect: DOMRect) => void

    onDeselect?: () => void
    compact?: boolean
}) {
    const rangeMin = viewEndMin - viewStartMin
    const gridHeightPx = rangeMin * pxPerMin

    const byDay: Record<number, EventItem[]> = {}
    for (const d of visibleDays) byDay[d] = []
    for (const it of items) if (byDay[it.dayIndex]) byDay[it.dayIndex].push(it)
    for (const d of visibleDays) byDay[d].sort((a, b) => a.startMin - b.startMin)

    const layoutByDay: Record<number, Map<string, LayoutInfo>> = {}
    for (const d of visibleDays) layoutByDay[d] = computeTwoLaneLayout(byDay[d] ?? [])

    const startHour = Math.floor(viewStartMin / 60)
    const endHour = Math.floor(viewEndMin / 60)

    const handleEmpty =
        onAddQuick ?? onDoubleClickEmpty ?? (() => { })

    return (
        <div
            className="rounded border bg-white overflow-hidden"
            data-compact={compact ? "1" : "0"}
            onMouseDown={(e) => {
                if (!onDeselect) return
                const target = e.target as HTMLElement
                // EventBlock 内をクリックしても閉じない
                if (target.closest('[data-eventblock="1"]')) return
                onDeselect()
            }}
        >
            <div
                className="grid border-b bg-gray-50"
                style={{ gridTemplateColumns: `64px repeat(${visibleDays.length}, 1fr)` }}
            >
                <div className="p-2 text-xs text-gray-500">Time</div>
                {visibleDays.map((dayIdx) => (
                    <div key={dayIdx} className="p-2 text-sm font-medium text-gray-800">
                        {DAY_NAMES[dayIdx]}
                    </div>
                ))}
            </div>

            <div className="flex">
                <div className="relative w-16 border-r bg-white" style={{ height: gridHeightPx }}>
                    {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                        const h = startHour + i
                        const top = (h * 60 - viewStartMin) * pxPerMin
                        return (
                            <div key={h} className="absolute left-0 right-0" style={{ top }}>
                                <div className="px-2 text-[11px] text-gray-500">{h}:00</div>
                            </div>
                        )
                    })}
                </div>

                <div
                    className="grid flex-1"
                    data-daygrid="1"
                    style={{ gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}
                >
                    {visibleDays.map((dayIndex, visibleIndex) => (
                        <DayColumn
                            key={dayIndex}
                            dayIndex={dayIndex}
                            visibleIndex={visibleIndex}
                            visibleDays={visibleDays}
                            items={byDay[dayIndex] ?? []}
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
    )
}
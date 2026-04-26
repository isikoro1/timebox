"use client"

import React from "react"
import { clamp, minToHHMM, snap } from "@/lib/time"
import type { EventItem } from "@/components/WeekGrid"
import type { LayoutInfo } from "./layout"
import { EventBlock } from "./EventBlock"

export function DayColumn({
    dateKey,
    visibleIndex,
    visibleDateKeys,
    items,
    layout,
    pxPerMin,
    gridMin,
    defaultDurationMin,
    nowMin,
    viewStartMin,
    viewEndMin,
    heightPx,
    isToday,
    selectedId,
    onDoubleClickEmpty,
    onMoveEvent,
    onSelectEvent,
}: {
    dateKey: string
    visibleIndex: number
    visibleDateKeys: string[]
    items: EventItem[]
    layout: Map<string, LayoutInfo>
    pxPerMin: number
    gridMin: number
    defaultDurationMin: number
    nowMin: number | null
    viewStartMin: number
    viewEndMin: number
    heightPx: number
    isToday: boolean
    selectedId: string | null
    onDoubleClickEmpty: (dateKey: string, startMin: number, endMin: number) => void
    onMoveEvent: (id: string, next: { dateKey: string; startMin: number; endMin: number }) => void
    onSelectEvent: (id: string, rect: DOMRect) => void
}) {
    const startHour = Math.floor(viewStartMin / 60)
    const endHour = Math.floor(viewEndMin / 60)

    return (
        <div
            className={`relative border-r last:border-r-0 select-none ${
                isToday ? "bg-red-50/40 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]" : ""
            }`}
            data-daycol="1"
            data-visible-index={visibleIndex}
            style={{ height: heightPx }}
            onDoubleClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const y = e.clientY - rect.top
                const rawMin = viewStartMin + y / pxPerMin
                const startMin = clamp(snap(rawMin, gridMin), 0, 1440 - defaultDurationMin)
                const endMin = startMin + defaultDurationMin
                onDoubleClickEmpty(dateKey, startMin, endMin)
            }}
        >
            {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                const h = startHour + i
                const top = (h * 60 - viewStartMin) * pxPerMin
                return (
                    <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-gray-200"
                        style={{ top }}
                    />
                )
            })}

            {items.map((it) => (
                <EventBlock
                    key={it.id}
                    item={it}
                    layout={layout.get(it.id) ?? { lane: 0, lanesCount: 1 }}
                    pxPerMin={pxPerMin}
                    gridMin={gridMin}
                    viewStartMin={viewStartMin}
                    viewEndMin={viewEndMin}
                    visibleDateKeys={visibleDateKeys}
                    selected={selectedId === it.id}
                    onMoveEvent={onMoveEvent}
                    onSelectEvent={onSelectEvent}
                />
            ))}

            {nowMin !== null && nowMin >= viewStartMin && nowMin <= viewEndMin && (
                <div
                    className="pointer-events-none absolute left-0 right-0 z-30 border-t-2 border-red-500"
                    style={{ top: (nowMin - viewStartMin) * pxPerMin }}
                    title={`now ${minToHHMM(nowMin)}`}
                    aria-hidden="true"
                />
            )}
        </div>
    )
}

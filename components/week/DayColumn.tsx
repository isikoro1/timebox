"use client"

import React from "react"
import { clamp, snap } from "@/lib/time"
import type { EventItem } from "@/components/WeekGrid"
import type { LayoutInfo } from "./layout"
import { EventBlock } from "./EventBlock"

type DayTone = "weekday" | "saturday" | "rest"

function getColumnClass(isToday: boolean, dayTone: DayTone) {
    if (isToday) return "bg-red-50/40 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]"
    if (dayTone === "rest") return "bg-rose-50/30"
    if (dayTone === "saturday") return "bg-sky-50/25"
    return ""
}

function shouldIgnoreEmptyAction(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest('[data-eventblock="1"], button, input, textarea, select, a'))
}

export function DayColumn({
    dateKey,
    visibleIndex,
    visibleDateKeys,
    items,
    layout,
    pxPerMin,
    gridMin,
    defaultDurationMin,
    viewStartMin,
    viewEndMin,
    heightPx,
    isToday,
    dayTone,
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
    viewStartMin: number
    viewEndMin: number
    heightPx: number
    isToday: boolean
    dayTone: DayTone
    selectedId: string | null
    onDoubleClickEmpty: (dateKey: string, startMin: number, endMin: number) => void
    onMoveEvent: (id: string, next: { dateKey: string; startMin: number; endMin: number }) => void
    onSelectEvent: (id: string, rect: DOMRect) => void
}) {
    const startHour = Math.floor(viewStartMin / 60)
    const endHour = Math.floor(viewEndMin / 60)
    const addEventAtClientY = (element: HTMLDivElement, clientY: number) => {
        const rect = element.getBoundingClientRect()
        const y = clientY - rect.top
        const rawMin = viewStartMin + y / pxPerMin
        const startMin = clamp(snap(rawMin, gridMin), 0, 1440 - defaultDurationMin)
        const endMin = startMin + defaultDurationMin
        onDoubleClickEmpty(dateKey, startMin, endMin)
    }

    return (
        <div
            className={`relative border-r last:border-r-0 select-none ${getColumnClass(isToday, dayTone)}`}
            data-daycol="1"
            data-visible-index={visibleIndex}
            style={{ height: heightPx }}
            onDoubleClick={(e) => {
                if (shouldIgnoreEmptyAction(e.target)) return
                addEventAtClientY(e.currentTarget, e.clientY)
            }}
            onClick={(e) => {
                if (e.detail !== 2 || shouldIgnoreEmptyAction(e.target)) return
                addEventAtClientY(e.currentTarget, e.clientY)
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

        </div>
    )
}

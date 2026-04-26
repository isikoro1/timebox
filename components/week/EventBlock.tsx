"use client"

import React from "react"
import { clamp, minToHHMM, snap } from "@/lib/time"
import type { EventItem } from "@/components/WeekGrid"
import type { LayoutInfo } from "./layout"

export function EventBlock({
    item,
    layout,
    pxPerMin,
    gridMin,
    viewStartMin,
    viewEndMin,
    visibleDateKeys,
    selected,
    onMoveEvent,
    onSelectEvent,
}: {
    item: EventItem
    layout: LayoutInfo
    pxPerMin: number
    gridMin: number
    viewStartMin: number
    viewEndMin: number
    visibleDateKeys: string[]
    selected: boolean
    onMoveEvent: (id: string, next: { dateKey: string; startMin: number; endMin: number }) => void
    onSelectEvent: (id: string, rect: DOMRect) => void
}) {
    const visibleTopMin = Math.max(item.startMin, viewStartMin)
    const visibleBottomMin = Math.min(item.endMin, viewEndMin)
    if (visibleBottomMin <= viewStartMin || visibleTopMin >= viewEndMin) return null

    const top = (visibleTopMin - viewStartMin) * pxPerMin
    const height = Math.max((visibleBottomMin - visibleTopMin) * pxPerMin, 18)
    const isShortBlock = height <= 20

    const startTxt = minToHHMM(item.startMin)
    const endTxt = minToHHMM(item.endMin)
    const firstUrl = (item.urls ?? []).find((u) => {
        try {
            const parsed = new URL(u)
            return parsed.protocol === "http:" || parsed.protocol === "https:"
        } catch {
            return false
        }
    })

    // Split overlapping events into up to two lanes.
    const laneGap = 4
    const lanesCount = layout.lanesCount
    const lane = layout.lane
    const widthStyle =
        lanesCount === 1
            ? { left: 4, right: 4 }
            : lane === 0
                ? { left: 4, right: `calc(50% + ${laneGap / 2}px)` }
                : { left: `calc(50% - ${laneGap / 2}px)`, right: 4 }

    const MIN_DURATION = gridMin
    const resizeHandleRight = firstUrl ? 36 : 16

    const startResize =
        (edge: "top" | "bottom") => (e: React.PointerEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()

            const target = e.currentTarget as HTMLElement
            target.setPointerCapture(e.pointerId)

            const startClientY = e.clientY
            const origStart = item.startMin
            const origEnd = item.endMin

            const move = (ev: PointerEvent) => {
                const dy = ev.clientY - startClientY
                const deltaMin = dy / pxPerMin

                if (edge === "bottom") {
                    let nextEnd = origEnd + deltaMin
                    nextEnd = snap(nextEnd, gridMin)
                    nextEnd = clamp(nextEnd, origStart + MIN_DURATION, 1440)
                    onMoveEvent(item.id, { dateKey: item.dateKey, startMin: origStart, endMin: nextEnd })
                } else {
                    let nextStart = origStart + deltaMin
                    nextStart = snap(nextStart, gridMin)
                    nextStart = clamp(nextStart, 0, origEnd - MIN_DURATION)
                    onMoveEvent(item.id, { dateKey: item.dateKey, startMin: nextStart, endMin: origEnd })
                }
            }

            const up = () => {
                window.removeEventListener("pointermove", move)
                window.removeEventListener("pointerup", up)
            }

            window.addEventListener("pointermove", move)
            window.addEventListener("pointerup", up)
        }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault()

        const target = e.currentTarget as HTMLElement
        target.setPointerCapture(e.pointerId)

        const startClientX = e.clientX
        const startClientY = e.clientY

        const dayCol = target.closest('[data-daycol="1"]') as HTMLElement | null
        const grid = target.closest('[data-daygrid="1"]') as HTMLElement | null
        if (!dayCol || !grid) return

        const gridRect = grid.getBoundingClientRect()
        const colWidth = gridRect.width / visibleDateKeys.length
        const origVisibleIndex = Number(dayCol.dataset.visibleIndex ?? "0")

        const orig = {
            startMin: item.startMin,
            endMin: item.endMin,
            duration: item.endMin - item.startMin,
        }

        let moved = false

        const move = (ev: PointerEvent) => {
            const dx = ev.clientX - startClientX
            const dy = ev.clientY - startClientY
            if (Math.abs(dx) + Math.abs(dy) > 6) moved = true

            const deltaMin = dy / pxPerMin
            const rawStart = orig.startMin + deltaMin
            const nextStart = clamp(snap(rawStart, gridMin), 0, 1440 - orig.duration)
            const nextEnd = nextStart + orig.duration

            const nextVisibleIndex = clamp(
                Math.round((origVisibleIndex * colWidth + dx) / colWidth),
                0,
                visibleDateKeys.length - 1
            )
            const nextDateKey = visibleDateKeys[nextVisibleIndex]

            onMoveEvent(item.id, { dateKey: nextDateKey, startMin: nextStart, endMin: nextEnd })
        }

        const up = () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)

            if (!moved) {
                const rect = target.getBoundingClientRect()
                onSelectEvent(item.id, rect)
            }
        }

        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
    }

    return (
        <div
            className={`absolute rounded border px-2 shadow-sm overflow-hidden
            ${selected ? "border-blue-400 bg-blue-200" : "border-blue-200 bg-blue-50 hover:bg-blue-100 hover:shadow-sm"}
            cursor-grab active:cursor-grabbing touch-none`}
            data-eventblock="1"
            style={{ top, height, ...widthStyle }}
            onPointerDown={onPointerDown}
            title={`${startTxt}-${endTxt}`}
        >
            <div
                className="absolute left-0 top-0 bottom-0 z-20 w-4 cursor-grab"
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onPointerDown(e)
                }}
                title="drag"
            />
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-400/60" />
            <div
                className="absolute right-0 top-0 bottom-0 z-20 w-4 cursor-grab"
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onPointerDown(e)
                }}
                title="drag"
            >
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-400/60" />
            </div>

            <div
                className="absolute left-4 top-0 z-10 h-2 cursor-ns-resize"
                style={{ right: resizeHandleRight }}
                onPointerDown={startResize("top")}
                title="resize start"
            />
            <div
                className="absolute left-4 bottom-0 z-10 h-2 cursor-ns-resize"
                style={{ right: resizeHandleRight }}
                onPointerDown={startResize("bottom")}
                title="resize end"
            />

            <div className={`flex gap-1 ${isShortBlock ? "h-full items-center py-0.5" : "items-start py-1"}`}>
                <div className={`flex-1 truncate text-xs font-medium text-gray-900 ${isShortBlock ? "leading-none" : "leading-4"}`}>
                    {item.label || "(untitled)"}
                </div>

                {firstUrl ? (
                    <a
                        href={firstUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-30 shrink-0 rounded border bg-white px-1 text-[11px] leading-4 hover:bg-gray-50"
                        title="open link"
                        aria-label="open link"
                    >
                        Link
                    </a>
                ) : null}
            </div>
        </div>
    )
}

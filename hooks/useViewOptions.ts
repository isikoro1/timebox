"use client"

import { useMemo, useState } from "react"

export type ViewMode = "day" | "3days" | "week"
export type ZoomLevel = 100 | 150 | 200

function getTodayMonBasedIndex(): number {
    const jsDay = new Date().getDay()
    return (jsDay + 6) % 7
}

export function useViewOptions() {
    const [startAtMidnight, setStartAtMidnight] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>("week")
    const [zoom, setZoom] = useState<ZoomLevel>(100)
    const [centerDay, setCenterDay] = useState<number>(getTodayMonBasedIndex)

    const pxPerMin = 0.96 * (zoom / 100)
    const viewStartMin = startAtMidnight ? 0 : 6 * 60
    const viewEndMin = 24 * 60

    const visibleDays = useMemo(() => {
        if (viewMode === "week") return [0, 1, 2, 3, 4, 5, 6]
        if (viewMode === "day") return [centerDay]
        if (centerDay <= 1) return [0, 1, 2]
        if (centerDay >= 5) return [4, 5, 6]
        return [centerDay - 1, centerDay, centerDay + 1]
    }, [centerDay, viewMode])

    const shiftCenter = (delta: number) => {
        setCenterDay((current) => Math.max(0, Math.min(6, current + delta)))
    }

    const goToday = () => setCenterDay(getTodayMonBasedIndex())

    return {
        startAtMidnight,
        setStartAtMidnight,
        viewMode,
        setViewMode,
        zoom,
        setZoom,
        centerDay,
        setCenterDay,
        shiftCenter,
        goToday,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDays,
    }
}

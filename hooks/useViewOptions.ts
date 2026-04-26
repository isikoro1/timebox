"use client"

import { useMemo, useState } from "react"
import { addDays, getTodayDateKey } from "../lib/date"

export type ViewMode = "day" | "3days" | "week"
export type ZoomLevel = 75 | 100 | 150 | 200

export function useViewOptions() {
    const [startAtMidnight, setStartAtMidnight] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>("week")
    const [zoom, setZoom] = useState<ZoomLevel>(100)
    const [centerDateKey, setCenterDateKey] = useState<string>(getTodayDateKey)

    const pxPerMin = 0.96 * (zoom / 100)
    const viewStartMin = startAtMidnight ? 0 : 6 * 60
    const viewEndMin = 24 * 60

    const visibleDateKeys = useMemo(() => {
        if (viewMode === "week") return Array.from({ length: 7 }, (_, index) => addDays(centerDateKey, index))
        if (viewMode === "day") return [centerDateKey]
        return Array.from({ length: 3 }, (_, index) => addDays(centerDateKey, index))
    }, [centerDateKey, viewMode])

    const shiftCenter = (delta: number) => {
        setCenterDateKey((current) => addDays(current, delta))
    }

    const goToday = () => setCenterDateKey(getTodayDateKey())

    return {
        startAtMidnight,
        setStartAtMidnight,
        viewMode,
        setViewMode,
        zoom,
        setZoom,
        centerDateKey,
        setCenterDateKey,
        shiftCenter,
        goToday,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDateKeys,
    }
}

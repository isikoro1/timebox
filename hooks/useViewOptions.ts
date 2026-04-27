"use client"

import { useMemo, useState } from "react"
import { addDays, getTodayDateKey } from "../lib/date"

export const MIN_VISIBLE_DAY_COUNT = 1
export const MAX_VISIBLE_DAY_COUNT = 31
export const MIN_ZOOM = 75
export const MAX_ZOOM = 200
export const ZOOM_STEP = 5

export function useViewOptions() {
    const [startHour, setStartHour] = useState(6)
    const [visibleDayCount, setVisibleDayCount] = useState(7)
    const [zoom, setZoom] = useState(100)
    const [centerDateKey, setCenterDateKey] = useState<string>(getTodayDateKey)

    const pxPerMin = 0.96 * (zoom / 100)
    const viewStartMin = startHour * 60
    const viewEndMin = 24 * 60

    const visibleDateKeys = useMemo(() => {
        return Array.from({ length: visibleDayCount }, (_, index) => addDays(centerDateKey, index))
    }, [centerDateKey, visibleDayCount])

    const shiftCenter = (delta: number) => {
        setCenterDateKey((current) => addDays(current, delta))
    }

    const goToday = () => setCenterDateKey(getTodayDateKey())
    const updateVisibleDayCount = (next: number | ((current: number) => number)) => {
        setVisibleDayCount((current) => {
            const value = typeof next === "function" ? next(current) : next
            return Math.min(MAX_VISIBLE_DAY_COUNT, Math.max(MIN_VISIBLE_DAY_COUNT, value))
        })
    }

    return {
        startHour,
        setStartHour,
        visibleDayCount,
        setVisibleDayCount: updateVisibleDayCount,
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

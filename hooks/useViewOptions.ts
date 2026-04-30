"use client"

import { useMemo, useState } from "react"
import { addDays, getTodayDateKey } from "../lib/date"

const VISIBLE_DAY_COUNT = 31
export const MIN_ZOOM = 75
export const MAX_ZOOM = 200
export const ZOOM_STEP = 5
export const MIN_DAY_WIDTH_ZOOM = 70
export const MAX_DAY_WIDTH_ZOOM = 180
export const DAY_WIDTH_ZOOM_STEP = 10
const BASE_DAY_COLUMN_WIDTH = 112

export function useViewOptions() {
    const [startHour, setStartHour] = useState(6)
    const [zoom, setZoom] = useState(100)
    const [dayWidthZoom, setDayWidthZoom] = useState(100)
    const [centerDateKey, setCenterDateKey] = useState<string>(getTodayDateKey)

    const pxPerMin = 0.96 * (zoom / 100)
    const dayColumnMinWidth = Math.round(BASE_DAY_COLUMN_WIDTH * (dayWidthZoom / 100))
    const viewStartMin = startHour * 60
    const viewEndMin = 24 * 60

    const visibleDateKeys = useMemo(() => {
        return Array.from({ length: VISIBLE_DAY_COUNT }, (_, index) => addDays(centerDateKey, index))
    }, [centerDateKey])

    const shiftCenter = (delta: number) => {
        setCenterDateKey((current) => addDays(current, delta))
    }

    const updateZoom = (next: number | ((current: number) => number)) => {
        setZoom((current) => {
            const value = typeof next === "function" ? next(current) : next
            return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
        })
    }
    const updateDayWidthZoom = (next: number | ((current: number) => number)) => {
        setDayWidthZoom((current) => {
            const value = typeof next === "function" ? next(current) : next
            return Math.min(MAX_DAY_WIDTH_ZOOM, Math.max(MIN_DAY_WIDTH_ZOOM, value))
        })
    }

    return {
        startHour,
        setStartHour,
        zoom,
        setZoom: updateZoom,
        dayWidthZoom,
        setDayWidthZoom: updateDayWidthZoom,
        dayColumnMinWidth,
        centerDateKey,
        setCenterDateKey,
        shiftCenter,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDateKeys,
    }
}

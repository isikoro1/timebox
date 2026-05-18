"use client"

import { useEffect, useMemo, useState } from "react"
import { addDays, getTodayDateKey } from "../lib/date"
import {
    clamp,
    DAY_WIDTH_ZOOM_STEP,
    MAX_DAY_WIDTH_ZOOM,
    MAX_START_HOUR,
    MAX_ZOOM,
    MIN_DAY_WIDTH_ZOOM,
    MIN_START_HOUR,
    MIN_ZOOM,
    parseStoredViewOptions,
    ZOOM_STEP,
} from "../lib/viewOptions"

const VISIBLE_DAY_COUNT = 31
const VIEW_OPTIONS_STORAGE_KEY = "timeboxing-tool:v1:view-options"
export { DAY_WIDTH_ZOOM_STEP, MAX_DAY_WIDTH_ZOOM, MAX_ZOOM, MIN_DAY_WIDTH_ZOOM, MIN_ZOOM, ZOOM_STEP }
const BASE_DAY_COLUMN_WIDTH = 112

export function useViewOptions() {
    const [startHour, setStartHour] = useState(6)
    const [zoom, setZoom] = useState(100)
    const [dayWidthZoom, setDayWidthZoom] = useState(100)
    const [centerDateKey, setCenterDateKey] = useState<string>(getTodayDateKey)
    const [loaded, setLoaded] = useState(false)

    const pxPerMin = 0.96 * (zoom / 100)
    const dayColumnMinWidth = Math.round(BASE_DAY_COLUMN_WIDTH * (dayWidthZoom / 100))
    const viewStartMin = startHour * 60
    const viewEndMin = 24 * 60

    const visibleDateKeys = useMemo(() => {
        return Array.from({ length: VISIBLE_DAY_COUNT }, (_, index) => addDays(centerDateKey, index))
    }, [centerDateKey])

    useEffect(() => {
        const saved = parseStoredViewOptions(localStorage.getItem(VIEW_OPTIONS_STORAGE_KEY))
        if (saved) {
            // Restore persisted client-only preferences after hydration.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (saved.startHour !== undefined) setStartHour(saved.startHour)
            if (saved.zoom !== undefined) setZoom(saved.zoom)
            if (saved.dayWidthZoom !== undefined) setDayWidthZoom(saved.dayWidthZoom)
            if (saved.centerDateKey !== undefined) setCenterDateKey(saved.centerDateKey)
        }
        setLoaded(true)
    }, [])

    useEffect(() => {
        if (!loaded) return
        localStorage.setItem(
            VIEW_OPTIONS_STORAGE_KEY,
            JSON.stringify({
                startHour,
                zoom,
                dayWidthZoom,
                centerDateKey,
            })
        )
    }, [centerDateKey, dayWidthZoom, loaded, startHour, zoom])

    const shiftCenter = (delta: number) => {
        setCenterDateKey((current) => addDays(current, delta))
    }

    const updateStartHour = (next: number) => {
        setStartHour(clamp(next, MIN_START_HOUR, MAX_START_HOUR))
    }
    const updateZoom = (next: number | ((current: number) => number)) => {
        setZoom((current) => {
            const value = typeof next === "function" ? next(current) : next
            return clamp(value, MIN_ZOOM, MAX_ZOOM)
        })
    }
    const updateDayWidthZoom = (next: number | ((current: number) => number)) => {
        setDayWidthZoom((current) => {
            const value = typeof next === "function" ? next(current) : next
            return clamp(value, MIN_DAY_WIDTH_ZOOM, MAX_DAY_WIDTH_ZOOM)
        })
    }

    return {
        startHour,
        setStartHour: updateStartHour,
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

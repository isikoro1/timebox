"use client"

import { useEffect, useMemo, useState } from "react"
import { addDays, getTodayDateKey, isDateKey } from "../lib/date"

const VISIBLE_DAY_COUNT = 31
const VIEW_OPTIONS_STORAGE_KEY = "timeboxing-tool:v1:view-options"
const MIN_START_HOUR = 0
const MAX_START_HOUR = 12
export const MIN_ZOOM = 75
export const MAX_ZOOM = 200
export const ZOOM_STEP = 5
export const MIN_DAY_WIDTH_ZOOM = 70
export const MAX_DAY_WIDTH_ZOOM = 180
export const DAY_WIDTH_ZOOM_STEP = 10
const BASE_DAY_COLUMN_WIDTH = 112

type StoredViewOptions = {
    startHour?: unknown
    zoom?: unknown
    dayWidthZoom?: unknown
    centerDateKey?: unknown
}

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

function parseStoredViewOptions(raw: string | null) {
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as StoredViewOptions
        if (!parsed || typeof parsed !== "object") return null

        return {
            startHour:
                typeof parsed.startHour === "number" && Number.isFinite(parsed.startHour)
                    ? clamp(parsed.startHour, MIN_START_HOUR, MAX_START_HOUR)
                    : undefined,
            zoom:
                typeof parsed.zoom === "number" && Number.isFinite(parsed.zoom)
                    ? clamp(parsed.zoom, MIN_ZOOM, MAX_ZOOM)
                    : undefined,
            dayWidthZoom:
                typeof parsed.dayWidthZoom === "number" && Number.isFinite(parsed.dayWidthZoom)
                    ? clamp(parsed.dayWidthZoom, MIN_DAY_WIDTH_ZOOM, MAX_DAY_WIDTH_ZOOM)
                    : undefined,
            centerDateKey: isDateKey(parsed.centerDateKey) ? parsed.centerDateKey : undefined,
        }
    } catch {
        return null
    }
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

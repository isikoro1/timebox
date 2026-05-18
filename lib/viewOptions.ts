import { isDateKey } from "./date"

export const MIN_START_HOUR = 0
export const MAX_START_HOUR = 12
export const MIN_ZOOM = 75
export const MAX_ZOOM = 200
export const ZOOM_STEP = 5
export const MIN_DAY_WIDTH_ZOOM = 70
export const MAX_DAY_WIDTH_ZOOM = 180
export const DAY_WIDTH_ZOOM_STEP = 10

type StoredViewOptions = {
    startHour?: unknown
    zoom?: unknown
    dayWidthZoom?: unknown
    centerDateKey?: unknown
}

export function parseStoredViewOptions(raw: string | null) {
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as StoredViewOptions
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null

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

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

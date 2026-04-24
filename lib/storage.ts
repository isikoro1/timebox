import type { EventItem } from "../components/WeekGrid"

type UnknownRecord = Record<string, unknown>

export function safeParse<T>(raw: string | null): T | null {
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null
}

function parseStringArray(value: unknown): string[] | undefined {
    if (value === undefined) return undefined
    if (!Array.isArray(value)) return undefined
    return value.filter((entry): entry is string => typeof entry === "string")
}

export function isValidEventItem(value: unknown): value is EventItem {
    if (!isRecord(value)) return false

    const { id, dayIndex, startMin, endMin } = value

    if (typeof id !== "string" || !id.trim()) return false
    if (typeof dayIndex !== "number" || !Number.isFinite(dayIndex)) return false
    if (typeof startMin !== "number" || !Number.isFinite(startMin)) return false
    if (typeof endMin !== "number" || !Number.isFinite(endMin)) return false

    if (dayIndex < 0 || dayIndex > 6) return false
    if (startMin < 0 || startMin >= 1440) return false
    if (endMin <= startMin || endMin > 1440) return false

    return true
}

export function sanitizeEventItem(value: unknown): EventItem | null {
    if (!isValidEventItem(value)) return null

    const record = value as UnknownRecord

    return {
        id: record.id as string,
        dayIndex: record.dayIndex as number,
        startMin: record.startMin as number,
        endMin: record.endMin as number,
        label: typeof record.label === "string" ? record.label : "",
        description: typeof record.description === "string" ? record.description : "",
        urls: parseStringArray(record.urls) ?? [],
    }
}

export function parseEventItems(raw: string | null): EventItem[] | null {
    const parsed = safeParse<unknown>(raw)
    if (!Array.isArray(parsed)) return null

    const items = parsed
        .map((entry) => sanitizeEventItem(entry))
        .filter((entry): entry is EventItem => entry !== null)

    return items.length === parsed.length ? items : null
}

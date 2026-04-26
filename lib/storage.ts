import type { EventItem } from "../components/WeekGrid"
import { getDateKeyForLegacyDayIndex, isDateKey } from "./date"

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

    const { id, dateKey, startMin, endMin } = value

    if (typeof id !== "string" || !id.trim()) return false
    if (!isDateKey(dateKey)) return false
    if (typeof startMin !== "number" || !Number.isFinite(startMin)) return false
    if (typeof endMin !== "number" || !Number.isFinite(endMin)) return false

    if (startMin < 0 || startMin >= 1440) return false
    if (endMin <= startMin || endMin > 1440) return false

    return true
}

function getMigratedDateKey(record: UnknownRecord): string | null {
    if (isDateKey(record.dateKey)) {
        return record.dateKey
    }

    if (typeof record.dayIndex !== "number" || !Number.isFinite(record.dayIndex)) return null
    if (record.dayIndex < 0 || record.dayIndex > 6) return null

    return getDateKeyForLegacyDayIndex(record.dayIndex)
}

export function sanitizeEventItem(value: unknown): EventItem | null {
    if (!isRecord(value)) return null
    const record = value as UnknownRecord
    const dateKey = getMigratedDateKey(record)

    if (!dateKey) return null

    const candidate = {
        ...record,
        dateKey,
    }

    if (!isValidEventItem(candidate)) return null

    return {
        id: record.id as string,
        dateKey,
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

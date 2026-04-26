const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

export function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number)
    return new Date(year, month - 1, day)
}

export function isDateKey(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const date = parseDateKey(value)
    return toDateKey(date) === value
}

export function addDays(dateKey: string, delta: number): string {
    const date = parseDateKey(dateKey)
    date.setDate(date.getDate() + delta)
    return toDateKey(date)
}

export function getTodayDateKey(): string {
    return toDateKey(new Date())
}

export function getWeekStartDateKey(dateKey: string): string {
    const date = parseDateKey(dateKey)
    const mondayOffset = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - mondayOffset)
    return toDateKey(date)
}

export function getDateKeyForLegacyDayIndex(dayIndex: number, baseDate = new Date()): string {
    const monday = parseDateKey(getWeekStartDateKey(toDateKey(baseDate)))
    monday.setDate(monday.getDate() + dayIndex)
    return toDateKey(monday)
}

export function getDayName(dateKey: string): string {
    const date = parseDateKey(dateKey)
    return DAY_NAMES[(date.getDay() + 6) % 7]
}

export function formatDateHeader(dateKey: string): string {
    const date = parseDateKey(dateKey)
    return `${getDayName(dateKey)} ${date.getMonth() + 1}/${date.getDate()}`
}

function pad(value: number): string {
    return String(value).padStart(2, "0")
}

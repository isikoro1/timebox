import { parseDateKey } from "./date"

const ERA_STARTS = [
    { name: "令和", start: new Date(2019, 4, 1) },
    { name: "平成", start: new Date(1989, 0, 8) },
    { name: "昭和", start: new Date(1926, 11, 25) },
] as const

const FIXED_HOLIDAYS: Record<string, string> = {
    "01-01": "元日",
    "02-11": "建国記念の日",
    "02-23": "天皇誕生日",
    "04-29": "昭和の日",
    "05-03": "憲法記念日",
    "05-04": "みどりの日",
    "05-05": "こどもの日",
    "08-11": "山の日",
    "11-03": "文化の日",
    "11-23": "勤労感謝の日",
} as const

export function formatJapaneseEraYear(dateKey: string): string {
    const date = parseDateKey(dateKey)
    const era = ERA_STARTS.find((candidate) => date >= candidate.start)

    if (!era) return `${date.getFullYear()}年`

    const year = date.getFullYear() - era.start.getFullYear() + 1
    return `${era.name}${year === 1 ? "元" : year}年`
}

export function getJapaneseHolidayName(dateKey: string): string | null {
    const holidays = getJapaneseHolidaysForYear(parseDateKey(dateKey).getFullYear())
    return holidays.get(dateKey) ?? null
}

function getJapaneseHolidaysForYear(year: number): Map<string, string> {
    const holidays = new Map<string, string>()

    for (const [monthDay, name] of Object.entries(FIXED_HOLIDAYS)) {
        addHoliday(holidays, `${year}-${monthDay}`, name)
    }

    addHoliday(holidays, nthMonday(year, 1, 2), "成人の日")
    addHoliday(holidays, nthMonday(year, 7, 3), "海の日")
    addHoliday(holidays, nthMonday(year, 9, 3), "敬老の日")
    addHoliday(holidays, nthMonday(year, 10, 2), "スポーツの日")
    addHoliday(holidays, `${year}-${pad(3)}-${pad(vernalEquinoxDay(year))}`, "春分の日")
    addHoliday(holidays, `${year}-${pad(9)}-${pad(autumnalEquinoxDay(year))}`, "秋分の日")

    addSubstituteHolidays(holidays, year)
    addCitizenHolidays(holidays, year)

    return holidays
}

function addHoliday(holidays: Map<string, string>, dateKey: string, name: string) {
    holidays.set(dateKey, name)
}

function addSubstituteHolidays(holidays: Map<string, string>, year: number) {
    const holidayKeys = [...holidays.keys()].sort()

    for (const dateKey of holidayKeys) {
        if (parseDateKey(dateKey).getDay() !== 0) continue

        let substitute = addDaysDateKey(dateKey, 1)
        while (holidays.has(substitute)) {
            substitute = addDaysDateKey(substitute, 1)
        }

        if (parseDateKey(substitute).getFullYear() === year) {
            holidays.set(substitute, "振替休日")
        }
    }
}

function addCitizenHolidays(holidays: Map<string, string>, year: number) {
    const start = new Date(year, 0, 2)
    const end = new Date(year, 11, 30)

    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateKey = toLocalDateKey(date)
        if (holidays.has(dateKey)) continue

        const previous = addDaysDateKey(dateKey, -1)
        const next = addDaysDateKey(dateKey, 1)
        if (holidays.has(previous) && holidays.has(next)) {
            holidays.set(dateKey, "国民の休日")
        }
    }
}

function nthMonday(year: number, month: number, nth: number): string {
    const date = new Date(year, month - 1, 1)
    const offset = (8 - date.getDay()) % 7
    date.setDate(1 + offset + (nth - 1) * 7)
    return toLocalDateKey(date)
}

function vernalEquinoxDay(year: number): number {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

function autumnalEquinoxDay(year: number): number {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

function addDaysDateKey(dateKey: string, delta: number): string {
    const date = parseDateKey(dateKey)
    date.setDate(date.getDate() + delta)
    return toLocalDateKey(date)
}

function toLocalDateKey(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function pad(value: number): string {
    return String(value).padStart(2, "0")
}

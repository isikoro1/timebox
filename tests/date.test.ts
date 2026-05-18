import test from "node:test"
import assert from "node:assert/strict"
import {
    addDays,
    formatDateHeader,
    getDateKeyForLegacyDayIndex,
    getDayName,
    getWeekStartDateKey,
    isDateKey,
    parseDateKey,
    toDateKey,
} from "../lib/date"

test("date keys round-trip with local calendar dates", () => {
    const date = new Date(2026, 4, 19)

    assert.equal(toDateKey(date), "2026-05-19")
    assert.equal(toDateKey(parseDateKey("2026-05-19")), "2026-05-19")
})

test("date key validation rejects impossible dates", () => {
    assert.equal(isDateKey("2026-02-28"), true)
    assert.equal(isDateKey("2026-02-30"), false)
    assert.equal(isDateKey("2026-2-3"), false)
    assert.equal(isDateKey("not-a-date"), false)
})

test("week helpers use Monday as the first day", () => {
    assert.equal(getWeekStartDateKey("2026-05-24"), "2026-05-18")
    assert.equal(getDateKeyForLegacyDayIndex(2, new Date(2026, 4, 24)), "2026-05-20")
})

test("day and header formatting are stable", () => {
    assert.equal(addDays("2026-05-31", 1), "2026-06-01")
    assert.equal(getDayName("2026-05-19"), "Tue")
    assert.equal(formatDateHeader("2026-05-19"), "Tue 5/19")
})

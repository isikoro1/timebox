import test from "node:test"
import assert from "node:assert/strict"
import { getTodaySchedule, type AlarmEvent } from "../lib/alarmSchedule"

test("today schedule includes only today's alarms ordered by target time", () => {
    const nowMs = new Date(2026, 4, 19, 8, 0).getTime()
    const schedule = getTodaySchedule(
        [
            event("later", "2026-05-19", 10 * 60),
            event("other-day", "2026-05-20", 9 * 60),
            event("earlier", "2026-05-19", 9 * 60),
        ],
        10,
        nowMs
    )

    assert.deepEqual(
        schedule.map((ev) => ev.id),
        ["earlier", "later"]
    )
    assert.equal(schedule[0].alarmMin, 8 * 60 + 50)
    assert.equal(schedule[0].fireKey, "2026-05-19:earlier:530:540:570")
})

test("alarm lead time does not schedule before the start of day", () => {
    const nowMs = new Date(2026, 4, 19, 0, 0).getTime()
    const schedule = getTodaySchedule([event("early", "2026-05-19", 5)], 10, nowMs)

    assert.equal(schedule[0].alarmMin, 0)
    assert.equal(schedule[0].targetMs, new Date(2026, 4, 19, 0, 0).getTime())
})

function event(id: string, dateKey: string, startMin: number): AlarmEvent {
    return {
        id,
        dateKey,
        startMin,
        endMin: startMin + 30,
        label: id,
    }
}

import test from "node:test"
import assert from "node:assert/strict"
import { parseStoredViewOptions } from "../lib/viewOptions"

test("stored view options are restored when valid", () => {
    assert.deepEqual(
        parseStoredViewOptions(
            JSON.stringify({
                startHour: 8,
                zoom: 125,
                dayWidthZoom: 120,
                centerDateKey: "2026-05-19",
            })
        ),
        {
            startHour: 8,
            zoom: 125,
            dayWidthZoom: 120,
            centerDateKey: "2026-05-19",
        }
    )
})

test("stored view options clamp numeric values and ignore invalid dates", () => {
    assert.deepEqual(
        parseStoredViewOptions(
            JSON.stringify({
                startHour: 99,
                zoom: 10,
                dayWidthZoom: 999,
                centerDateKey: "2026-02-30",
            })
        ),
        {
            startHour: 12,
            zoom: 75,
            dayWidthZoom: 180,
            centerDateKey: undefined,
        }
    )
})

test("stored view options ignore invalid payloads", () => {
    assert.equal(parseStoredViewOptions(null), null)
    assert.equal(parseStoredViewOptions("broken json"), null)
    assert.equal(parseStoredViewOptions("[]"), null)
})

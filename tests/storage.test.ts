import test from "node:test"
import assert from "node:assert/strict"
import { getDateKeyForLegacyDayIndex } from "../lib/date"
import { isValidEventItem, parseEventItems, safeParse, sanitizeEventItem } from "../lib/storage"

test("safeParse returns parsed JSON or null", () => {
    assert.deepEqual(safeParse<{ ok: boolean }>('{"ok":true}'), { ok: true })
    assert.equal(safeParse("broken"), null)
    assert.equal(safeParse(null), null)
})

test("isValidEventItem accepts bounded same-day events", () => {
    assert.equal(
        isValidEventItem({
            id: "event-1",
            dateKey: "2026-05-19",
            startMin: 9 * 60,
            endMin: 10 * 60,
            label: "Focus",
        }),
        true
    )
})

test("isValidEventItem rejects invalid dates and time ranges", () => {
    const base = {
        id: "event-1",
        dateKey: "2026-05-19",
        startMin: 9 * 60,
        endMin: 10 * 60,
    }

    assert.equal(isValidEventItem({ ...base, id: "" }), false)
    assert.equal(isValidEventItem({ ...base, dateKey: "2026-02-30" }), false)
    assert.equal(isValidEventItem({ ...base, startMin: -1 }), false)
    assert.equal(isValidEventItem({ ...base, startMin: 10 * 60, endMin: 9 * 60 }), false)
    assert.equal(isValidEventItem({ ...base, endMin: 24 * 60 + 1 }), false)
})

test("sanitizeEventItem normalizes optional text and URL fields", () => {
    assert.deepEqual(
        sanitizeEventItem({
            id: "event-1",
            dateKey: "2026-05-19",
            startMin: 9 * 60,
            endMin: 10 * 60,
            label: 123,
            description: null,
            urls: ["https://example.com", 42, "not validated here"],
        }),
        {
            id: "event-1",
            dateKey: "2026-05-19",
            startMin: 9 * 60,
            endMin: 10 * 60,
            label: "",
            description: "",
            urls: ["https://example.com", "not validated here"],
        }
    )
})

test("sanitizeEventItem migrates legacy dayIndex records", () => {
    assert.deepEqual(
        sanitizeEventItem({
            id: "legacy-1",
            dayIndex: 2,
            startMin: 8 * 60,
            endMin: 9 * 60,
            label: "Legacy",
        }),
        {
            id: "legacy-1",
            dateKey: getDateKeyForLegacyDayIndex(2),
            startMin: 8 * 60,
            endMin: 9 * 60,
            label: "Legacy",
            description: "",
            urls: [],
        }
    )
})

test("parseEventItems accepts fully valid arrays", () => {
    const raw = JSON.stringify([
        {
            id: "event-1",
            dateKey: "2026-05-19",
            startMin: 9 * 60,
            endMin: 10 * 60,
            label: "Focus",
        },
        {
            id: "legacy-1",
            dayIndex: 0,
            startMin: 11 * 60,
            endMin: 12 * 60,
        },
    ])

    assert.deepEqual(parseEventItems(raw), [
        {
            id: "event-1",
            dateKey: "2026-05-19",
            startMin: 9 * 60,
            endMin: 10 * 60,
            label: "Focus",
            description: "",
            urls: [],
        },
        {
            id: "legacy-1",
            dateKey: getDateKeyForLegacyDayIndex(0),
            startMin: 11 * 60,
            endMin: 12 * 60,
            label: "",
            description: "",
            urls: [],
        },
    ])
})

test("parseEventItems rejects invalid payloads and partially invalid arrays", () => {
    assert.equal(parseEventItems(null), null)
    assert.equal(parseEventItems("broken"), null)
    assert.equal(parseEventItems("{}"), null)
    assert.equal(
        parseEventItems(
            JSON.stringify([
                {
                    id: "event-1",
                    dateKey: "2026-05-19",
                    startMin: 9 * 60,
                    endMin: 10 * 60,
                },
                {
                    id: "bad",
                    dateKey: "2026-05-19",
                    startMin: 10 * 60,
                    endMin: 9 * 60,
                },
            ])
        ),
        null
    )
})

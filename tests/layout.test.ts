import test from "node:test"
import assert from "node:assert/strict"
import { computeOverlapLayout } from "../components/week/layout"

test("non-overlapping events share one lane", () => {
    const layout = computeOverlapLayout([
        event("a", 9 * 60, 10 * 60),
        event("b", 10 * 60, 11 * 60),
    ])

    assert.deepEqual(layout.get("a"), { lane: 0, lanesCount: 1 })
    assert.deepEqual(layout.get("b"), { lane: 0, lanesCount: 1 })
})

test("overlapping events are assigned stable lanes for the whole overlap group", () => {
    const layout = computeOverlapLayout([
        event("a", 9 * 60, 11 * 60),
        event("b", 9 * 60 + 30, 10 * 60),
        event("c", 10 * 60, 12 * 60),
    ])

    assert.deepEqual(layout.get("a"), { lane: 0, lanesCount: 2 })
    assert.deepEqual(layout.get("b"), { lane: 1, lanesCount: 2 })
    assert.deepEqual(layout.get("c"), { lane: 1, lanesCount: 2 })
})

test("separate overlap groups keep independent lane counts", () => {
    const layout = computeOverlapLayout([
        event("a", 8 * 60, 9 * 60),
        event("b", 8 * 60 + 15, 8 * 60 + 45),
        event("c", 10 * 60, 11 * 60),
    ])

    assert.equal(layout.get("a")?.lanesCount, 2)
    assert.equal(layout.get("b")?.lanesCount, 2)
    assert.deepEqual(layout.get("c"), { lane: 0, lanesCount: 1 })
})

function event(id: string, startMin: number, endMin: number) {
    return {
        id,
        dateKey: "2026-05-19",
        startMin,
        endMin,
        label: id,
        color: "#2563eb",
    }
}

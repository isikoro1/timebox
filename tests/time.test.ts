import test from "node:test"
import assert from "node:assert/strict"
import { clamp, minToHHMM, pad2, snap } from "../lib/time"

test("pad2 formats single digit numbers", () => {
    assert.equal(pad2(0), "00")
    assert.equal(pad2(7), "07")
    assert.equal(pad2(12), "12")
})

test("minToHHMM formats minutes and wraps outside one day", () => {
    assert.equal(minToHHMM(0), "0:00")
    assert.equal(minToHHMM(9 * 60 + 5), "9:05")
    assert.equal(minToHHMM(24 * 60), "0:00")
    assert.equal(minToHHMM(-15), "23:45")
})

test("clamp keeps values inside inclusive bounds", () => {
    assert.equal(clamp(5, 0, 10), 5)
    assert.equal(clamp(-1, 0, 10), 0)
    assert.equal(clamp(11, 0, 10), 10)
})

test("snap rounds minutes to the nearest grid size", () => {
    assert.equal(snap(7, 15), 0)
    assert.equal(snap(8, 15), 15)
    assert.equal(snap(37, 15), 30)
    assert.equal(snap(38, 15), 45)
})

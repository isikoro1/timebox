"use client"

import { useMemo, useState } from "react"

function getTodayMonBasedIndex(): number {
    const js = new Date().getDay() // 0=Sun..6=Sat
    return (js + 6) % 7 // Mon=0..Sun=6
}

export function useViewOptions() {
    const [compact, setCompact] = useState(true)
    const [startAtMidnight, setStartAtMidnight] = useState(false)
    const [viewMode, setViewMode] = useState<"week" | "3days">("week")
    const [centerDay, setCenterDay] = useState<number>(getTodayMonBasedIndex)

    const pxPerMin = compact ? 0.96 : 1.2
    const viewStartMin = startAtMidnight ? 0 : 6 * 60
    const viewEndMin = 24 * 60

    const visibleDays = useMemo(() => {
        if (viewMode === "week") return [0, 1, 2, 3, 4, 5, 6]
        const c = centerDay
        if (c <= 1) return [0, 1, 2]
        if (c >= 5) return [4, 5, 6]
        return [c - 1, c, c + 1]
    }, [viewMode, centerDay])

    const shiftCenter = (delta: number) => {
        setCenterDay((cur) => Math.max(0, Math.min(6, cur + delta)))
    }

    const goToday = () => setCenterDay(getTodayMonBasedIndex())

    return {
        compact,
        setCompact,
        startAtMidnight,
        setStartAtMidnight,
        viewMode,
        setViewMode,
        centerDay,
        setCenterDay,
        shiftCenter,
        goToday,
        pxPerMin,
        viewStartMin,
        viewEndMin,
        visibleDays,
    }
}
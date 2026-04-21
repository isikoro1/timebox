"use client"

import { useEffect, useState } from "react"

export function useNowMin(intervalMs: number = 15000) {
    const [nowMin, setNowMin] = useState<number | null>(null)

    useEffect(() => {
        const tick = () => {
            const d = new Date()
            setNowMin(d.getHours() * 60 + d.getMinutes())
        }
        tick()
        const id = setInterval(tick, intervalMs)
        return () => clearInterval(id)
    }, [intervalMs])

    return nowMin
}

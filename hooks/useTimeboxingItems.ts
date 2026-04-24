"use client"

import { useEffect, useState } from "react"
import { parseEventItems } from "../lib/storage"
import type { EventItem } from "../components/WeekGrid"

export function useTimeboxingItems(storageKey: string) {
    const [items, setItems] = useState<EventItem[]>([])
    const [loaded, setLoaded] = useState(false)

    // load once (client only)
    useEffect(() => {
        const saved = parseEventItems(localStorage.getItem(storageKey))
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved) setItems(saved)
        setLoaded(true)
    }, [storageKey])

    // save
    useEffect(() => {
        if (!loaded) return
        localStorage.setItem(storageKey, JSON.stringify(items))
    }, [items, loaded, storageKey])

    return { items, setItems, loaded }
}

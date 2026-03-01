// items の読み込み/保存（localStorage）
//CRUD（add/update/delete）"use client"

import { useEffect, useState } from "react"
import { safeParse } from "../lib/storage"
import type { EventItem } from "../components/WeekGrid"

export function useTimeboxingItems(storageKey: string) {
    const [items, setItems] = useState<EventItem[]>([])
    const [loaded, setLoaded] = useState(false)

    // load once
    useEffect(() => {
        const saved = safeParse<EventItem[]>(localStorage.getItem(storageKey))
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
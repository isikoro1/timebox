"use client"

import { useMemo, useState } from "react"
import type { EventItem } from "../components/WeekGrid"

export function useSelection(items: EventItem[]) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [selectedAnchor, setSelectedAnchor] = useState<DOMRect | null>(null)

    const selectedItem = useMemo(
        () => items.find((x) => x.id === selectedId) ?? null,
        [items, selectedId]
    )

    const open = (id: string, rect: DOMRect) => {
        setSelectedId(id)
        setSelectedAnchor(rect)
    }

    const close = () => {
        setSelectedId(null)
        setSelectedAnchor(null)
    }

    return {
        selectedId,
        setSelectedId,
        selectedAnchor,
        setSelectedAnchor,
        selectedItem,
        open,
        close,
    }
}
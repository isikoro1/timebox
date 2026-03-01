import type { EventItem } from "@/components/WeekGrid"

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

export type LayoutInfo = { lane: 0 | 1; lanesCount: 1 | 2 }

/**
 * 2件重複までを左右分割で表示するための簡易レイアウト。
 * - 3件以上重複は lanesCount=2 に押し込む（次に「3件以上は警告」へ拡張できる）
 */
export function computeTwoLaneLayout(items: EventItem[]): Map<string, LayoutInfo> {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    const res = new Map<string, LayoutInfo>()

    let laneEnd0 = -1
    let laneEnd1 = -1

    for (const it of sorted) {
        const overlaps0 = it.startMin < laneEnd0
        const overlaps1 = it.startMin < laneEnd1

        if (!overlaps0) {
            const needTwo = overlaps1
            res.set(it.id, { lane: 0, lanesCount: needTwo ? 2 : 1 })
            laneEnd0 = it.endMin
            continue
        }

        if (!overlaps1) {
            res.set(it.id, { lane: 1, lanesCount: 2 })
            laneEnd1 = it.endMin
            continue
        }

        // 3+ overlap (not fully supported)
        res.set(it.id, { lane: 1, lanesCount: 2 })
        laneEnd1 = Math.max(laneEnd1, it.endMin)
    }

    // Fix lanesCount: if any overlap in different lanes, mark both as 2
    for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            const a = sorted[i]
            const b = sorted[j]
            const overlap = a.startMin < b.endMin && b.startMin < a.endMin
            if (!overlap) continue
            const la = res.get(a.id)
            const lb = res.get(b.id)
            if (!la || !lb) continue
            if (la.lane !== lb.lane) {
                res.set(a.id, { ...la, lanesCount: 2 })
                res.set(b.id, { ...lb, lanesCount: 2 })
            }
        }
    }

    return res
}
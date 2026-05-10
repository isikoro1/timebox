import type { EventItem } from "@/components/WeekGrid"

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

export type LayoutInfo = { lane: number; lanesCount: number }

export function computeOverlapLayout(items: EventItem[]): Map<string, LayoutInfo> {
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    const result = new Map<string, LayoutInfo>()
    let groupIds: string[] = []
    let laneEnds: number[] = []
    let groupEnd = -1

    const finishGroup = () => {
        const lanesCount = Math.max(1, laneEnds.length)
        for (const id of groupIds) {
            const layout = result.get(id)
            if (layout) result.set(id, { ...layout, lanesCount })
        }
        groupIds = []
        laneEnds = []
        groupEnd = -1
    }

    for (const item of sorted) {
        if (groupIds.length > 0 && item.startMin >= groupEnd) {
            finishGroup()
        }

        let lane = laneEnds.findIndex((endMin) => item.startMin >= endMin)
        if (lane === -1) {
            lane = laneEnds.length
            laneEnds.push(item.endMin)
        } else {
            laneEnds[lane] = item.endMin
        }

        groupIds.push(item.id)
        groupEnd = Math.max(groupEnd, item.endMin)
        result.set(item.id, { lane, lanesCount: 1 })
    }

    if (groupIds.length > 0) finishGroup()

    return result
}

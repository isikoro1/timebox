import { toDateKey } from "./date"

export type AlarmEvent = {
    id: string
    dateKey: string
    startMin: number
    endMin: number
    label: string
}

export type ScheduledAlarmEvent = AlarmEvent & {
    alarmMin: number
    targetMs: number
    fireKey: string
}

export function getTodaySchedule(items: AlarmEvent[], leadMin: number, nowMs: number): ScheduledAlarmEvent[] {
    const now = new Date(nowMs)
    const todayKey = toDateKey(now)
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return items
        .filter((x) => x.dateKey === todayKey)
        .map((x) => {
            const alarmMin = Math.max(0, x.startMin - leadMin)
            return {
                ...x,
                alarmMin,
                targetMs: startOfToday.getTime() + alarmMin * 60_000,
                fireKey: `${todayKey}:${x.id}:${alarmMin}:${x.startMin}:${x.endMin}`,
            }
        })
        .filter((x) => x.alarmMin >= 0 && x.alarmMin <= 1440)
        .sort((a, b) => a.targetMs - b.targetMs)
}

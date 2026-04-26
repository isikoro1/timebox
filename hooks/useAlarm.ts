"use client"

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import { toDateKey } from "../lib/date"

export type AlarmEvent = {
    id: string
    dateKey: string
    startMin: number
    endMin: number
    label: string
}

type Options = {
    items: AlarmEvent[]
    enabled: boolean
    leadMin: number // 0 means fire at the event start time.
}

type ScheduledAlarmEvent = AlarmEvent & {
    alarmMin: number
    targetMs: number
    fireKey: string
}

const CHECK_INTERVAL_MS = 15_000
const DUE_GRACE_MS = 90_000

export function useAlarm({ items, enabled, leadMin }: Options) {
    const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(
        typeof Notification !== "undefined" && Notification.permission === "granted"
    )
    const [nowMs, setNowMs] = useState(() => Date.now())

    const firedRef = useRef<Set<string>>(new Set())
    const timeoutRef = useRef<number | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)

    const nextToday = useMemo(() => {
        return getTodaySchedule(items, leadMin, nowMs).find((ev) => ev.targetMs >= nowMs) ?? null
    }, [items, leadMin, nowMs])

    const requestNotificationPermission = async () => {
        if (typeof Notification === "undefined") return false
        if (Notification.permission === "granted") {
            setHasNotificationPermission(true)
            return true
        }
        if (Notification.permission === "denied") {
            setHasNotificationPermission(false)
            return false
        }
        const res = await Notification.requestPermission()
        const ok = res === "granted"
        setHasNotificationPermission(ok)
        return ok
    }

    const primeAudio = async () => {
        const ctx = getAudioContext(audioCtxRef)
        if (!ctx) return false
        if (ctx.state === "suspended") {
            await ctx.resume()
        }
        return ctx.state === "running"
    }

    const playBeep = async () => {
        try {
            const ctx = getAudioContext(audioCtxRef)
            if (!ctx) return
            if (ctx.state === "suspended") {
                await ctx.resume()
            }

            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sine"
            osc.frequency.value = 880
            gain.gain.value = 0.06
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start()

            window.setTimeout(() => gain.gain.setValueAtTime(0, ctx.currentTime), 200)
            window.setTimeout(() => gain.gain.setValueAtTime(0.06, ctx.currentTime), 350)
            window.setTimeout(() => gain.gain.setValueAtTime(0, ctx.currentTime), 550)
            window.setTimeout(() => gain.gain.setValueAtTime(0.06, ctx.currentTime), 700)
            window.setTimeout(() => gain.gain.setValueAtTime(0, ctx.currentTime), 900)
            window.setTimeout(() => {
                osc.stop()
                osc.disconnect()
                gain.disconnect()
            }, 1000)
        } catch {
            // Browser autoplay policies can still reject audio in some contexts.
        }
    }

    const notify = (title: string, body: string) => {
        if (typeof Notification === "undefined") return
        if (Notification.permission !== "granted") return
        try {
            new Notification(title, { body })
        } catch {
            // no-op
        }
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            void audioCtxRef.current?.close()
            audioCtxRef.current = null
        }
    }, [])

    useEffect(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        if (!enabled) return

        const checkAndFire = () => {
            const currentMs = Date.now()
            setNowMs(currentMs)

            const dueEvents = getTodaySchedule(items, leadMin, currentMs).filter(
                (ev) => currentMs >= ev.targetMs && currentMs <= ev.targetMs + DUE_GRACE_MS
            )

            for (const ev of dueEvents) {
                if (firedRef.current.has(ev.fireKey)) continue
                firedRef.current.add(ev.fireKey)
                void playBeep()
                notify("Timebox", `${ev.label} (${pad(ev.startMin)}-${pad(ev.endMin)})`)
            }
        }

        const scheduleNextTimeout = () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            const currentMs = Date.now()
            const next = getTodaySchedule(items, leadMin, currentMs).find((ev) => ev.targetMs > currentMs)
            if (!next) return

            timeoutRef.current = window.setTimeout(() => {
                checkAndFire()
                scheduleNextTimeout()
            }, Math.max(0, next.targetMs - currentMs))
        }

        checkAndFire()
        scheduleNextTimeout()

        const interval = window.setInterval(() => {
            checkAndFire()
            scheduleNextTimeout()
        }, CHECK_INTERVAL_MS)

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            window.clearInterval(interval)
        }
    }, [enabled, items, leadMin])

    return {
        nextToday,
        hasNotificationPermission,
        requestNotificationPermission,
        primeAudio,
        testBeep: playBeep,
    }
}

function getAudioContext(audioCtxRef: MutableRefObject<AudioContext | null>) {
    if (typeof window === "undefined") return null
    if (audioCtxRef.current) return audioCtxRef.current

    const AudioCtx = (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
        | typeof AudioContext
        | undefined

    if (!AudioCtx) return null
    audioCtxRef.current = new AudioCtx()
    return audioCtxRef.current
}

function getTodaySchedule(items: AlarmEvent[], leadMin: number, nowMs: number): ScheduledAlarmEvent[] {
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

function pad(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

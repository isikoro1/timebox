"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export type AlarmEvent = {
    id: string
    dayIndex: number // 0..6 (Mon..Sun)
    startMin: number
    endMin: number
    label: string
}

type Options = {
    items: AlarmEvent[]
    enabled: boolean
    leadMin: number // 0なら開始時刻ぴったり。5なら5分前通知
}

/**
 * 前提：
 * - タブは開いている
 * - 非アクティブでも鳴らしたい（= 通知 + 音）
 * 方針：
 * - 「次に来る今日のイベント」だけを監視（まず勝ち筋を作る）
 * - setTimeoutでスケジュール + 15秒ポーリングで取りこぼし防止
 */
export function useAlarm({ items, enabled, leadMin }: Options) {
    const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(
        typeof Notification !== "undefined" && Notification.permission === "granted"
    )

    const firedRef = useRef<Map<string, number>>(new Map()) // id -> lastFiredAt(epoch ms)
    const timeoutRef = useRef<number | null>(null)

    const todayIndex = useMemo(() => {
        // JS: 0=Sun..6=Sat → Mon=0..Sun=6 に変換
        const js = new Date().getDay()
        return (js + 6) % 7
    }, [])

    const nowMin = useMemo(() => {
        const d = new Date()
        return d.getHours() * 60 + d.getMinutes()
    }, [])

    const nextToday = useMemo(() => {
        const target = items
            .filter((x) => x.dayIndex === todayIndex)
            .map((x) => ({
                ...x,
                alarmMin: Math.max(0, x.startMin - leadMin),
            }))
            .filter((x) => x.alarmMin >= 0 && x.alarmMin <= 1440)
            .filter((x) => x.alarmMin >= nowMin) // 未来だけ
            .sort((a, b) => a.alarmMin - b.alarmMin)[0]

        return target ?? null
    }, [items, todayIndex, leadMin, nowMin])

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

    const playBeep = () => {
        try {
            const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
                | typeof AudioContext
                | undefined
            if (!AudioCtx) return
            const ctx = new AudioCtx()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sine"
            osc.frequency.value = 880
            gain.gain.value = 0.06
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start()
            // 200ms * 3回（簡易）
            setTimeout(() => gain.gain.setValueAtTime(0.0, ctx.currentTime), 200)
            setTimeout(() => {
                gain.gain.setValueAtTime(0.06, ctx.currentTime)
            }, 350)
            setTimeout(() => gain.gain.setValueAtTime(0.0, ctx.currentTime), 550)
            setTimeout(() => {
                gain.gain.setValueAtTime(0.06, ctx.currentTime)
            }, 700)
            setTimeout(() => gain.gain.setValueAtTime(0.0, ctx.currentTime), 900)
            setTimeout(() => {
                osc.stop()
                ctx.close()
            }, 1000)
        } catch {
            // no-op
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

    const shouldFire = (ev: { id: string }, atEpoch: number) => {
        const last = firedRef.current.get(ev.id)
        // 同じIDの連続発火を防ぐ（60秒以内は抑止）
        if (last && atEpoch - last < 60_000) return false
        firedRef.current.set(ev.id, atEpoch)
        return true
    }

    const checkAndFire = () => {
        if (!enabled) return
        const ev = nextToday
        if (!ev) return

        const d = new Date()
        const curMin = d.getHours() * 60 + d.getMinutes()

        // “今がアラーム分” か、タイマー遅延で “過ぎた直後” を拾う
        if (curMin < ev.alarmMin) return
        if (curMin > ev.alarmMin + 1) {
            // 1分以上遅れている場合は一旦スキップ（過去の通知を乱発しない）
            return
        }

        const now = Date.now()
        if (!shouldFire(ev, now)) return

        playBeep()
        notify("Timebox", `${ev.label} (${pad(ev.startMin)}–${pad(ev.endMin)})`)
    }

    // スケジュール + ポーリング
    useEffect(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        if (!enabled) return
        if (!nextToday) return

        const d = new Date()
        const curMin = d.getHours() * 60 + d.getMinutes()
        const msToTarget = Math.max(0, (nextToday.alarmMin - curMin) * 60_000)

        timeoutRef.current = window.setTimeout(() => {
            checkAndFire()
        }, msToTarget)

        const interval = window.setInterval(() => {
            checkAndFire()
        }, 15_000)

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            window.clearInterval(interval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, nextToday?.id, nextToday?.alarmMin, leadMin])

    return {
        nextToday, // UIに「次に鳴る予定」を出すのに便利
        hasNotificationPermission,
        requestNotificationPermission,
        testBeep: playBeep,
    }
}

function pad(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
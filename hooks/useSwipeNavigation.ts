"use client"

import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import {
    DAY_WIDTH_ZOOM_STEP,
    MAX_DAY_WIDTH_ZOOM,
    MAX_ZOOM,
    MIN_DAY_WIDTH_ZOOM,
    MIN_ZOOM,
    ZOOM_STEP,
} from "./useViewOptions"

const SWIPE_MIN_X = 64
const SWIPE_MAX_TAP_MS = 700
const SWIPE_VERTICAL_CANCEL_Y = 32
const SWIPE_HORIZONTAL_RATIO = 1.4
const SWIPE_EXCLUDED_TARGETS = 'button, input, textarea, select, a, [data-eventblock="1"]'
const PINCH_MIN_DISTANCE = 40

type SwipeStart = {
    pointerId: number
    pointerType: string
    x: number
    y: number
    time: number
    cancelled: boolean
}

type TouchPoint = {
    x: number
    y: number
}

type PinchStart = {
    distance: number
    zoom: number
    dayWidthZoom: number
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function snapToStep(value: number, step: number) {
    return Math.round(value / step) * step
}

function getPinchDistance(points: TouchPoint[]) {
    if (points.length < 2) return 0
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
}

export function useSwipeNavigation({
    zoom,
    dayWidthZoom,
    setZoom,
    setDayWidthZoom,
    onMoveDate,
}: {
    zoom: number
    dayWidthZoom: number
    setZoom: (next: number) => void
    setDayWidthZoom: (next: number) => void
    onMoveDate: (direction: -1 | 1) => void
}) {
    const swipeStartRef = useRef<SwipeStart | null>(null)
    const activeTouchPointsRef = useRef<Map<number, TouchPoint>>(new Map())
    const pinchStartRef = useRef<PinchStart | null>(null)

    const beginPinch = () => {
        const distance = getPinchDistance([...activeTouchPointsRef.current.values()])
        if (distance < PINCH_MIN_DISTANCE) return

        pinchStartRef.current = {
            distance,
            zoom,
            dayWidthZoom,
        }
    }

    const updatePinch = () => {
        const pinchStart = pinchStartRef.current
        if (!pinchStart) return

        const distance = getPinchDistance([...activeTouchPointsRef.current.values()])
        if (distance < PINCH_MIN_DISTANCE) return

        const scale = distance / pinchStart.distance
        setZoom(clamp(snapToStep(pinchStart.zoom * scale, ZOOM_STEP), MIN_ZOOM, MAX_ZOOM))
        setDayWidthZoom(
            clamp(
                snapToStep(pinchStart.dayWidthZoom * scale, DAY_WIDTH_ZOOM_STEP),
                MIN_DAY_WIDTH_ZOOM,
                MAX_DAY_WIDTH_ZOOM
            )
        )
    }

    const startSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch") {
            activeTouchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
            if (activeTouchPointsRef.current.size >= 2) {
                swipeStartRef.current = null
                beginPinch()
                return
            }
        }

        if (event.pointerType === "mouse" && event.button !== 0) return
        if (event.pointerType !== "touch" && event.pointerType !== "mouse") return

        const target = event.target as HTMLElement | null
        if (target?.closest(SWIPE_EXCLUDED_TARGETS)) return

        swipeStartRef.current = {
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            x: event.clientX,
            y: event.clientY,
            time: performance.now(),
            cancelled: false,
        }
    }

    const trackSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" && activeTouchPointsRef.current.has(event.pointerId)) {
            activeTouchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
            if (pinchStartRef.current) {
                updatePinch()
                return
            }
        }

        const start = swipeStartRef.current
        if (!start || event.pointerId !== start.pointerId || event.pointerType !== start.pointerType) return
        if (event.pointerType === "mouse" && event.buttons !== 1) return

        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        const horizontalIntent = Math.abs(dx) >= Math.abs(dy) * SWIPE_HORIZONTAL_RATIO
        const verticalIntent = Math.abs(dy) > SWIPE_VERTICAL_CANCEL_Y && !horizontalIntent
        if (verticalIntent) start.cancelled = true
    }

    const finishSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch") {
            activeTouchPointsRef.current.delete(event.pointerId)
            if (pinchStartRef.current) {
                if (activeTouchPointsRef.current.size < 2) pinchStartRef.current = null
                swipeStartRef.current = null
                return
            }
        }

        const start = swipeStartRef.current
        swipeStartRef.current = null
        if (!start || start.cancelled || event.pointerId !== start.pointerId || event.pointerType !== start.pointerType) return

        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        const elapsed = performance.now() - start.time
        if (elapsed > SWIPE_MAX_TAP_MS) return
        if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO) return

        onMoveDate(dx < 0 ? 1 : -1)
    }

    const cancelSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
        activeTouchPointsRef.current.delete(event.pointerId)
        if (activeTouchPointsRef.current.size < 2) pinchStartRef.current = null
        swipeStartRef.current = null
    }

    return {
        startSwipe,
        trackSwipe,
        finishSwipe,
        cancelSwipe,
    }
}

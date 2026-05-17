"use client"

import type { ReactNode } from "react"
import {
    MAX_DAY_WIDTH_ZOOM,
    MAX_ZOOM,
    MIN_DAY_WIDTH_ZOOM,
    MIN_ZOOM,
} from "../hooks/useViewOptions"

export function FloatingControls({
    visibleMonthLabel,
    dayWidthZoom,
    zoom,
    onMoveDate,
    onOpenSettings,
    onZoomDayWidth,
    onZoomTimeline,
}: {
    visibleMonthLabel: string
    dayWidthZoom: number
    zoom: number
    onMoveDate: (direction: -1 | 1) => void
    onOpenSettings: () => void
    onZoomDayWidth: (direction: -1 | 1) => void
    onZoomTimeline: (direction: -1 | 1) => void
}) {
    return (
        <>
            <div className="fixed left-3 top-3 z-40 rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-sm font-semibold text-gray-800 shadow-lg shadow-gray-900/10 backdrop-blur sm:left-4 sm:top-4">
                {visibleMonthLabel}
            </div>

            <div className="fixed bottom-3 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg shadow-gray-900/10 backdrop-blur sm:bottom-4 sm:flex">
                <IconButton ariaLabel="Previous dates" onClick={() => onMoveDate(-1)}>
                    <ChevronLeftIcon />
                </IconButton>
                <IconButton ariaLabel="Next dates" onClick={() => onMoveDate(1)}>
                    <ChevronRightIcon />
                </IconButton>
            </div>

            <button
                className="fixed right-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:bg-white sm:right-4 sm:top-4"
                type="button"
                aria-label="Open settings"
                onClick={onOpenSettings}
            >
                <SettingsIcon />
            </button>

            <div className="fixed right-16 top-3 z-40 flex h-11 items-center gap-1 rounded-full border border-gray-200 bg-white/95 p-1 text-gray-700 shadow-lg shadow-gray-900/10 backdrop-blur sm:right-[4.25rem] sm:top-4">
                <span className="pl-2 text-xs font-semibold text-gray-500" aria-hidden="true">
                    H
                </span>
                <ZoomButton
                    ariaLabel="Compress day width"
                    disabled={dayWidthZoom <= MIN_DAY_WIDTH_ZOOM}
                    onClick={() => onZoomDayWidth(-1)}
                >
                    -
                </ZoomButton>
                <ZoomButton
                    ariaLabel="Expand day width"
                    disabled={dayWidthZoom >= MAX_DAY_WIDTH_ZOOM}
                    onClick={() => onZoomDayWidth(1)}
                >
                    +
                </ZoomButton>
                <div className="mx-0.5 h-6 w-px bg-gray-200" aria-hidden="true" />
                <span className="text-xs font-semibold text-gray-500" aria-hidden="true">
                    V
                </span>
                <ZoomButton
                    ariaLabel="Compress timeline height"
                    disabled={zoom <= MIN_ZOOM}
                    onClick={() => onZoomTimeline(-1)}
                >
                    -
                </ZoomButton>
                <ZoomButton
                    ariaLabel="Expand timeline height"
                    disabled={zoom >= MAX_ZOOM}
                    onClick={() => onZoomTimeline(1)}
                >
                    +
                </ZoomButton>
            </div>
        </>
    )
}

function IconButton({
    ariaLabel,
    children,
    onClick,
}: {
    ariaLabel: string
    children: ReactNode
    onClick: () => void
}) {
    return (
        <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
            type="button"
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

function ZoomButton({
    ariaLabel,
    children,
    disabled,
    onClick,
}: {
    ariaLabel: string
    children: ReactNode
    disabled: boolean
    onClick: () => void
}) {
    return (
        <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

function ChevronLeftIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m15 18-6-6 6-6" />
        </svg>
    )
}

function ChevronRightIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}

function SettingsIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7.1 4.3l.1.1A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
        </svg>
    )
}

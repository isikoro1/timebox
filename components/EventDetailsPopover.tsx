"use client"

import { useEffect, useMemo, useRef } from "react"
import { minToHHMM } from "../lib/time"
import type { EventItem } from "./WeekGrid"

type Props = {
    item: EventItem
    anchorRect: DOMRect
    onClose: () => void
    onChange: (patch: Partial<EventItem>) => void
    onDelete: () => void
}

function safeHttpUrl(raw: string): string | null {
    try {
        const u = new URL(raw.trim())
        if (u.protocol !== "http:" && u.protocol !== "https:") return null
        return u.toString()
    } catch {
        return null
    }
}

export function EventDetailsPopover({ item, anchorRect, onClose, onChange, onDelete }: Props) {
    const ref = useRef<HTMLDivElement | null>(null)

    // 右側に出して、画面外に出たらクランプ
    const style = useMemo(() => {
        const margin = 8
        const w = 360
        const h = 360

        const vw = typeof window !== "undefined" ? window.innerWidth : 1200
        const vh = typeof window !== "undefined" ? window.innerHeight : 800

        let left = anchorRect.right + margin
        let top = anchorRect.top

        if (left + w > vw - margin) left = Math.max(margin, anchorRect.left - w - margin)
        if (top + h > vh - margin) top = Math.max(margin, vh - h - margin)

        return { left, top, width: w }
    }, [anchorRect])

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            const el = ref.current
            if (!el) return
            if (e.target instanceof Node && el.contains(e.target)) return
            onClose()
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        document.addEventListener("mousedown", onDocMouseDown)
        window.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown)
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [onClose])

    const timeLabel = `${minToHHMM(item.startMin)}–${minToHHMM(item.endMin)}`

    return (
        <div
            ref={ref}
            className="fixed z-50 rounded-xl border bg-white shadow-lg"
            style={style}
            role="dialog"
            aria-label="Event details"
        >
            <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="text-sm font-semibold text-gray-900">詳細</div>
                <button className="rounded px-2 py-1 text-sm hover:bg-gray-100" onClick={onClose}>
                    ×
                </button>
            </div>

            <div className="space-y-3 px-3 py-3">
                <div className="text-xs text-gray-700">{timeLabel}</div>

                <div>
                    <div className="text-xs font-medium text-gray-700">ラベル</div>
                    <input
                        className="mt-1 w-full rounded border px-2 py-1 text-sm"
                        value={item.label}
                        onChange={(e) => onChange({ label: e.target.value })}
                    />
                </div>

                <div>
                    <div className="text-xs font-medium text-gray-700">メモ</div>
                    <textarea
                        className="mt-1 h-24 w-full resize-none rounded border px-2 py-1 text-sm"
                        value={item.description ?? ""}
                        onChange={(e) => onChange({ description: e.target.value })}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-700">URL</div>
                        <button
                            className="rounded border bg-white px-2 py-1 text-xs hover:bg-gray-50"
                            onClick={() => onChange({ urls: [...(item.urls ?? []), ""] })}
                        >
                            + 追加
                        </button>
                    </div>

                    {(item.urls ?? []).length === 0 ? (
                        <div className="mt-2 text-xs text-gray-500">リンクなし</div>
                    ) : (
                        <div className="mt-2 space-y-2">
                            {(item.urls ?? []).map((u: string, idx: number) => {
                                const valid = safeHttpUrl(u)
                                return (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            className="flex-1 rounded border px-2 py-1 text-sm"
                                            value={u}
                                            placeholder="https://..."
                                            onChange={(e) => {
                                                const next = [...(item.urls ?? [])]
                                                next[idx] = e.target.value
                                                onChange({ urls: next })
                                            }}
                                        />
                                        <button
                                            className="rounded border bg-white px-2 py-1 text-sm hover:bg-gray-50"
                                            onClick={() => {
                                                const next = [...(item.urls ?? [])]
                                                next.splice(idx, 1)
                                                onChange({ urls: next })
                                            }}
                                            aria-label="remove url"
                                        >
                                            −
                                        </button>
                                        <a
                                            className={`rounded border bg-white px-2 py-1 text-sm hover:bg-gray-50 ${valid ? "" : "pointer-events-none opacity-50"
                                                }`}
                                            href={valid ?? "#"}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                        >
                                            open
                                        </a>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-1">
                    <button
                        className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={onDelete}
                    >
                        削除
                    </button>
                    <div className="text-xs text-gray-500">
                        Escで閉じる / 外側クリックで閉じる
                    </div>
                </div>
            </div>
        </div>
    )
}
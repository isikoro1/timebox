"use client"

import { minToHHMM } from "@/lib/time"
import { formatDateHeader } from "@/lib/date"
import type { EventItem } from "@/components/WeekGrid"

export function EventDetailsPanel({
    item,
    onClose,
    onChange,
    onDelete,
}: {
    item: EventItem
    onClose: () => void
    onChange: (next: EventItem) => void
    onDelete: (id: string) => void
}) {
    return (
        <aside className="w-full lg:w-[360px] rounded border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="font-medium">詳細</div>
                <button
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="text-sm text-gray-700">
                    <div className="font-medium text-gray-900">
                        {formatDateHeader(item.dateKey)} {minToHHMM(item.startMin)}-{minToHHMM(item.endMin)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        ※ ブロックはドラッグで移動（リサイズは後で追加）
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-600">ラベル</label>
                    <input
                        className="w-full rounded border px-3 py-2 text-sm text-black"
                        value={item.label}
                        onChange={(e) => onChange({ ...item, label: e.target.value })}
                        placeholder="例：API設計"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-600">自由記入（メモ）</label>
                    <textarea
                        className="w-full rounded border px-3 py-2 text-sm text-black"
                        rows={8}
                        value={item.description ?? ""}
                        onChange={(e) => onChange({ ...item, description: e.target.value })}
                        placeholder="やること、注意点、リンクなど"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => onDelete(item.id)}
                    >
                        削除
                    </button>
                    <div className="text-xs text-gray-500">自動保存されます</div>
                </div>
            </div>
        </aside>
    )
}

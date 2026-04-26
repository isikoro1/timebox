"use client"

import { formatDateHeader } from "@/lib/date"
import { minToHHMM } from "@/lib/time"

export type QuickAddState = {
    dateKey: string
    startMin: number
    endMin: number
    label: string
}

export function QuickAddModal({
    value,
    onChange,
    onCancel,
    onConfirm,
}: {
    value: QuickAddState
    onChange: (next: QuickAddState) => void
    onCancel: () => void
    onConfirm: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
            <div className="w-[360px] rounded-lg bg-white p-4 shadow">
                <div className="mb-2 text-sm text-gray-600">
                    {formatDateHeader(value.dateKey)} {minToHHMM(value.startMin)}-
                    {minToHHMM(value.endMin)}
                </div>

                <input
                    autoFocus
                    className="w-full rounded border px-3 py-2 text-sm text-black placeholder-gray-400"
                    value={value.label}
                    onChange={(e) => onChange({ ...value, label: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onConfirm()
                        if (e.key === "Escape") onCancel()
                    }}
                    placeholder="Label"
                />

                <div className="mt-3 flex justify-end gap-2">
                    <button
                        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={onConfirm}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    )
}

"use client"

export type TransferState = "success" | "error" | null

export function TransferToast({ message, state }: { message: string | null; state: TransferState }) {
    if (!message) return null

    return (
        <div
            className={`fixed left-3 right-16 top-3 z-30 rounded-lg px-3 py-2 text-sm shadow-lg sm:left-auto sm:right-20 sm:top-4 sm:w-96 ${
                state === "error"
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
        >
            {message}
        </div>
    )
}

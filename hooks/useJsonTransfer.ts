"use client"

import { type ChangeEvent, type Dispatch, type SetStateAction, useRef, useState } from "react"
import type { EventItem } from "../components/WeekGrid"
import { parseEventItems } from "../lib/storage"
import type { TransferState } from "../components/TransferToast"

function buildExportFilename() {
    const stamp = new Date().toISOString().slice(0, 10)
    return `timebox-events-${stamp}.json`
}

function downloadJson(items: EventItem[]) {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
        type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = buildExportFilename()
    anchor.click()
    URL.revokeObjectURL(url)
}

export function useJsonTransfer({
    items,
    setItems,
    onImportSuccess,
}: {
    items: EventItem[]
    setItems: Dispatch<SetStateAction<EventItem[]>>
    onImportSuccess: () => void
}) {
    const importInputRef = useRef<HTMLInputElement | null>(null)
    const [transferMessage, setTransferMessage] = useState<string | null>(null)
    const [transferState, setTransferState] = useState<TransferState>(null)

    const exportJson = () => {
        downloadJson(items)
        setTransferMessage(`Exported ${items.length} event${items.length === 1 ? "" : "s"} to JSON.`)
        setTransferState("success")
    }

    const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const raw = await file.text()
            const parsed = parseEventItems(raw)

            if (!parsed) {
                setTransferMessage("Import failed. The JSON file is invalid or missing required fields.")
                setTransferState("error")
                return
            }

            setItems(parsed)
            onImportSuccess()
            setTransferMessage(`Imported ${parsed.length} event${parsed.length === 1 ? "" : "s"} from ${file.name}.`)
            setTransferState("success")
        } catch {
            setTransferMessage("Import failed. The file could not be read.")
            setTransferState("error")
        } finally {
            event.target.value = ""
        }
    }

    const openImportPicker = () => importInputRef.current?.click()

    return {
        importInputRef,
        transferMessage,
        transferState,
        exportJson,
        importJson,
        openImportPicker,
    }
}

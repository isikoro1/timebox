"use client"

import { useEffect, useRef, useState } from "react"
import { useAlarm } from "../hooks/useAlarm"
import { QuickAddModal, type QuickAddState } from "../components/QuickAddModal"
import { EventDetailsPopover } from "../components/EventDetailsPopover"
import { type EventItem, WeekGrid } from "../components/WeekGrid"
import { useTimeboxingItems } from "../hooks/useTimeboxingItems"
import { useNowMin } from "../hooks/useNowMin"
import { useViewOptions } from "../hooks/useViewOptions"
import { useSelection } from "../hooks/useSelection"

const STORAGE_KEY = "timeboxing-tool:v1:week-items"
const GRID_MIN = 15
const DEFAULT_DURATION = 30

export default function Home() {
  const { items, setItems } = useTimeboxingItems(STORAGE_KEY)
  const nowMin = useNowMin(15000)
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [alarmLeadMin, setAlarmLeadMin] = useState(0) // 0=開始ぴったり

  const {
    compact,
    setCompact,
    startAtMidnight,
    setStartAtMidnight,
    viewMode,
    setViewMode,
    visibleDays,
    shiftCenter,
    goToday,
    pxPerMin,
    viewStartMin,
    viewEndMin,
  } = useViewOptions()

  const { selectedId, selectedAnchor, selectedItem, open, close } = useSelection(items)

  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)



  const alarm = useAlarm({
    items: items.map((x) => ({
      id: x.id,
      dayIndex: x.dayIndex,
      startMin: x.startMin,
      endMin: x.endMin,
      label: x.label,
    })),
    enabled: alarmEnabled,
    leadMin: alarmLeadMin,
  })

  // Ctrl+C / Ctrl+V（A案：同じ曜日で開始を GRID_MIN ずらして複製）
  const clipboardRef = useRef<EventItem | null>(null)

  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return false
      const tag = el.tagName?.toLowerCase()
      return tag === "input" || tag === "textarea" || (el as any).isContentEditable
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return
      if (isTyping()) return

      const key = e.key.toLowerCase()

      if (key === "c") {
        if (!selectedItem) return
        clipboardRef.current = selectedItem
        e.preventDefault()
      }

      if (key === "v") {
        const src = clipboardRef.current
        if (!src) return

        const duration = src.endMin - src.startMin
        const startMin = Math.min(1440 - duration, src.startMin + GRID_MIN)

        const next: EventItem = {
          ...src,
          id: crypto.randomUUID(),
          startMin,
          endMin: startMin + duration,
        }

        setItems((prev: EventItem[]) => [...prev, next])
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedItem, setItems])

  const updateSelected = (next: EventItem) => {
    setItems((prev: EventItem[]) => prev.map((x) => (x.id === next.id ? next : x)))
  }

  const deleteItem = (id: string) => {
    setItems((prev: EventItem[]) => prev.filter((x) => x.id !== id))
    close()
  }

  const onAddQuick = (dayIndex: number, startMin: number, endMin: number) => {
    setQuickAdd({
      dayIndex,
      startMin,
      endMin,
      label: "",
    })
  }

  const confirmQuickAdd = () => {
    if (!quickAdd) return
    const label = quickAdd.label.trim()
    if (!label) return

    const item: EventItem = {
      id: crypto.randomUUID(),
      dayIndex: quickAdd.dayIndex,
      startMin: quickAdd.startMin,
      endMin: quickAdd.endMin,
      label,
      description: "",
      urls: [],
    }

    setItems((prev: EventItem[]) => [...prev, item])
    setQuickAdd(null)
  }

  const gridMin = GRID_MIN
  const defaultDurationMin = DEFAULT_DURATION

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="text-lg font-semibold">Timebox</div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setViewMode(viewMode === "week" ? "3days" : "week")}
            >
              {viewMode === "week" ? "3 days" : "Week"}
            </button>

            <button
              className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setCompact(!compact)}
            >
              {compact ? "Normal height" : "Compact"}
            </button>

            <button
              className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setStartAtMidnight(!startAtMidnight)}
            >
              {startAtMidnight ? "Start 6:00" : "Start 0:00"}
            </button>

            <label className="ml-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={alarmEnabled}
                onChange={(e) => setAlarmEnabled(e.target.checked)}
              />
              アラーム
            </label>

            <label className="flex items-center gap-2 text-sm">
              何分前
              <input
                type="number"
                min={0}
                max={120}
                value={alarmLeadMin}
                onChange={(e) => setAlarmLeadMin(Number(e.target.value || 0))}
                className="w-16 rounded border px-2 py-1"
              />
            </label>

            <button
              className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => alarm.requestNotificationPermission()}
            >
              通知許可
            </button>

            <button
              className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => alarm.testBeep()}
            >
              テスト音
            </button>

            {viewMode === "3days" ? (
              <div className="flex items-center gap-2">
                <button
                  className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => shiftCenter(-1)}
                >
                  ◀
                </button>
                <button
                  className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={goToday}
                >
                  今日
                </button>
                <button
                  className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => shiftCenter(1)}
                >
                  ▶
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative rounded-xl border bg-white">
          <WeekGrid
            items={items}
            visibleDays={visibleDays}
            gridMin={gridMin}
            defaultDurationMin={defaultDurationMin}
            pxPerMin={pxPerMin}
            viewStartMin={viewStartMin}
            viewEndMin={viewEndMin}
            nowMin={nowMin}
            onAddQuick={onAddQuick}
            onMoveEvent={(id, next) => {
              setItems((prev: EventItem[]) =>
                prev.map((x) => (x.id === id ? { ...x, ...next } : x))
              )
            }}
            onSelectEvent={(id, rect) => open(id, rect)}
            onDeselect={close}
            selectedId={selectedId}
            compact={compact}
          />

          {quickAdd ? (
            <QuickAddModal
              value={quickAdd}
              onChange={(next) => setQuickAdd(next)}
              onCancel={() => setQuickAdd(null)}
              onConfirm={confirmQuickAdd}
            />
          ) : null}

          {selectedItem && selectedAnchor ? (
            <EventDetailsPopover
              item={selectedItem}
              anchorRect={selectedAnchor}
              onClose={close}
              onChange={(patch) => updateSelected({ ...selectedItem, ...patch })}
              onDelete={() => deleteItem(selectedItem.id)}
            />
          ) : null}
        </div>

        <div className="mt-3 text-xs text-gray-600">
          保存先：このブラウザの localStorage（端末内） / バックアップ推奨
        </div>
      </div>
    </main>
  )
}
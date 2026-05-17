"use client"

import { minToHHMM } from "../lib/time"
import type { UseAlarmResult } from "../hooks/useAlarm"

const BUTTON_CLASS =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
const SETTINGS_SECTION_CLASS = "space-y-3 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"

export function SettingsDialog({
    open,
    loaded,
    focusLabel,
    startHour,
    alarmEnabled,
    alarmLeadMin,
    alarm,
    onClose,
    onStartHourChange,
    onExport,
    onImport,
    onAlarmEnabledChange,
    onAlarmLeadMinChange,
}: {
    open: boolean
    loaded: boolean
    focusLabel: string
    startHour: number
    alarmEnabled: boolean
    alarmLeadMin: number
    alarm: UseAlarmResult
    onClose: () => void
    onStartHourChange: (hour: number) => void
    onExport: () => void
    onImport: () => void
    onAlarmEnabledChange: (enabled: boolean) => void
    onAlarmLeadMinChange: (leadMin: number) => void
}) {
    if (!open) return null

    const alarmStatusText = alarmEnabled ? "Enabled" : "Disabled"
    const notificationPermissionText =
        alarm.notificationPermission === "unsupported" ? "unsupported" : alarm.notificationPermission
    const nextAlarmText = alarm.nextToday
        ? `${alarm.nextToday.label || "(untitled)"} at ${minToHHMM(alarm.nextToday.alarmMin)}`
        : "No upcoming alarm today"

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/35 px-3 py-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={onClose}
        >
            <div
                className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
                    <h2 id="settings-title" className="text-base font-semibold text-gray-900">
                        Settings
                    </h2>
                    <button
                        className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        type="button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div className="space-y-5 overflow-y-auto px-4 py-4">
                    <section className={SETTINGS_SECTION_CLASS}>
                        <h3 className="text-sm font-semibold text-gray-900">View</h3>
                        <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
                            Focus: {focusLabel}
                        </div>
                    </section>

                    <section className={SETTINGS_SECTION_CLASS}>
                        <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
                        <label className="block text-sm text-gray-700">
                            <div className="mb-2">Start hour</div>
                            <select
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                                value={startHour}
                                onChange={(event) => onStartHourChange(Number(event.target.value))}
                            >
                                {Array.from({ length: 13 }, (_, hour) => (
                                    <option key={hour} value={hour}>
                                        {hour}:00
                                    </option>
                                ))}
                            </select>
                        </label>
                    </section>

                    <section className={SETTINGS_SECTION_CLASS}>
                        <h3 className="text-sm font-semibold text-gray-900">Backup</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button className={BUTTON_CLASS} type="button" onClick={onExport} disabled={!loaded}>
                                Export JSON
                            </button>
                            <button className={BUTTON_CLASS} type="button" onClick={onImport} disabled={!loaded}>
                                Import JSON
                            </button>
                        </div>
                    </section>

                    <section className={SETTINGS_SECTION_CLASS}>
                        <h3 className="text-sm font-semibold text-gray-900">Alarm</h3>
                        <div className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-600">Status</span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        alarmEnabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"
                                    }`}
                                >
                                    {alarmStatusText}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-600">Notification</span>
                                <span className="font-medium text-gray-900">{notificationPermissionText}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-gray-600">Next</span>
                                <span className="text-right font-medium text-gray-900">{nextAlarmText}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={alarmEnabled}
                                    onChange={(event) => {
                                        const checked = event.target.checked
                                        onAlarmEnabledChange(checked)
                                        if (checked) void alarm.primeAudio()
                                    }}
                                />
                                Alarm
                            </label>

                            <label className="ml-auto flex items-center gap-2">
                                Lead min
                                <input
                                    type="number"
                                    min={0}
                                    max={120}
                                    value={alarmLeadMin}
                                    onChange={(event) => onAlarmLeadMinChange(Number(event.target.value || 0))}
                                    className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                                />
                            </label>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                className={BUTTON_CLASS}
                                type="button"
                                onClick={() => alarm.requestNotificationPermission()}
                                disabled={alarm.notificationPermission === "unsupported"}
                            >
                                Request notification
                            </button>
                            <button
                                className={BUTTON_CLASS}
                                type="button"
                                onClick={() => {
                                    void alarm.testBeep()
                                }}
                            >
                                Test sound
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

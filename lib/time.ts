export function pad2(n: number) {
    return String(n).padStart(2, "0")
}

export function minToHHMM(min: number) {
    const m = ((min % 1440) + 1440) % 1440
    const hh = Math.floor(m / 60)
    const mm = m % 60
    return `${hh}:${pad2(mm)}`
}

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

export function snap(min: number, grid: number) {
    return Math.round(min / grid) * grid
}
# Issue #8: Current Time Line Layering

- Date: 2026-04-22
- Issue: [#8](https://github.com/isikoro1/timebox/issues/8)

## Symptom

- When the current time line overlaps an event block, the red line can disappear behind the event.
- That makes it harder to understand the current time at a glance.

## Cause

- The current time line and event blocks are rendered in the same stacking context.
- Event blocks are rendered later in the DOM, so they can paint over the line when no higher layer is assigned to the indicator.

## Fix

- Render the current time line after the event blocks inside `components/week/DayColumn.tsx`.
- Give the line a higher `z-index` so it stays above event blocks.
- Mark the line as `pointer-events-none` because it is a visual indicator and should not interfere with event interactions.

## Verification

- `cmd /c npm run lint`
- `cmd /c npm run build`

## Notes

- This fix is intentionally scoped to issue #8 only.
- It does not change event sizing, dragging, or resize behavior.

---

# Issue #8: 現在時刻ラインのレイヤー順

- 日付: 2026-04-22
- Issue: [#8](https://github.com/isikoro1/timebox/issues/8)

## 症状

- 現在時刻ラインがイベントブロックと重なったときに、赤いラインがイベントの背面に隠れることがある。
- その結果、現在時刻をひと目で把握しづらくなる。

## 原因

- 現在時刻ラインとイベントブロックが同じ stacking context に描画されていた。
- さらにイベントブロックのほうが後ろの DOM 順で描画されるため、インジケーターに上位レイヤーを与えないとラインが上書きされる状態だった。

## 修正方法

- `components/week/DayColumn.tsx` で、現在時刻ラインをイベントブロックの後に描画するようにした。
- ラインに高い `z-index` を付けて、イベントより前面に表示されるようにした。
- このラインは表示専用なので、イベント操作を邪魔しないよう `pointer-events-none` を付けた。

## 検証

- `cmd /c npm run lint`
- `cmd /c npm run build`

## 補足

- 今回の修正範囲は issue #8 に限定している。
- イベントのサイズ変更やドラッグ挙動そのものには影響しない。

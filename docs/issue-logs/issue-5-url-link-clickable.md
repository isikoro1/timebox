# Issue #5: URL Link Icon Not Clickable in 15-Minute Blocks

## Symptom

When an event was resized to the minimum 15-minute height, the URL link control became hard or impossible to click.

## Root Cause

The top and bottom resize handles covered the middle content area in very short blocks. The link control did not have enough stacking priority, so pointer events could be intercepted by the resize handles before the anchor received the click.

## Fix

- Moved valid URL detection before rendering so layout decisions can account for the link control.
- Reserved the right-side link area by shortening the top and bottom resize hit areas when a URL is present.
- Gave the link anchor a higher z-index than the resize handles.
- Replaced garbled fallback text and the tooltip range in `EventBlock`.

## Verification

- `cmd /c npx tsc --noEmit`
- `cmd /c npm run lint`
- `cmd /c npm run build`

## Japanese

### 症状

イベントを最小の15分サイズにすると、URLリンク操作がクリックしにくい、またはクリックできない状態でした。

### 原因

短いイベントブロックでは上下のリサイズハンドルがコンテンツ領域と重なり、リンクより先にポインターイベントを受け取っていました。

### 修正

- URL の有無を描画前に判定し、リンク領域を考慮したレイアウトに変更しました。
- URL がある場合、上下リサイズハンドルの右端を短くしてリンク領域を避けました。
- リンクアンカーの z-index をリサイズハンドルより高くしました。
- `EventBlock` の文字化けしたフォールバック文言と tooltip の時刻範囲も修正しました。

### 検証

- `cmd /c npx tsc --noEmit`
- `cmd /c npm run lint`
- `cmd /c npm run build`

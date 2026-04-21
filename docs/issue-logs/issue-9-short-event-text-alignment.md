# Issue #9: Short Event Text Alignment

- Date: 2026-04-22
- Issue: [#9](https://github.com/isikoro1/timebox/issues/9)
- PR: [#11](https://github.com/isikoro1/timebox/pull/11)

## Symptom

- When an event block is resized to the minimum 15-minute height, the label appears visually lower than expected.
- The short block looks harder to scan than taller event blocks.

## Cause

- `EventBlock` used the same vertical padding and top-aligned content layout for every block height.
- At the minimum rendered height, the fixed top/bottom chrome plus `py-1` left too little space for the text area.
- Because the content row stayed `items-start`, the label sat near the top edge of the remaining content box instead of appearing optically centered inside the small event block.

## Fix

- Detect very short rendered event blocks in `components/week/EventBlock.tsx`.
- Switch those blocks to a compact layout that uses the full available height and vertically centers the content row.
- Reduce the short-block text line height so the label fits cleanly without pushing downward.
- Keep taller blocks on the existing top-aligned layout to avoid regressions in the normal case.
- Add `data-eventblock="1"` to the block root so the grid's deselect logic can keep recognizing event clicks consistently.

## Verification

- `cmd /c npm run lint`
- `cmd /c npm run build`

## Notes

- This fix is intentionally scoped to issue #9 only.
- Related interaction issues around very small blocks, such as resize and link hit areas, should continue to be tracked separately.

---

# Issue #9: 15分イベントのテキスト位置ずれ

- 日付: 2026-04-22
- Issue: [#9](https://github.com/isikoro1/timebox/issues/9)
- PR: [#11](https://github.com/isikoro1/timebox/pull/11)

## 症状

- イベントブロックを最小の 15 分サイズまで縮めると、ラベルが想定より下に見える。
- 通常サイズのイベントに比べて、短いブロックの視認性が下がる。

## 原因

- `EventBlock` が、ブロックの高さに関係なく同じ縦方向パディングと上寄せレイアウトを使っていた。
- 最小高さでは、上下の固定 UI と `py-1` によって、テキスト領域として使える縦方向スペースが足りなくなっていた。
- さらにコンテンツ行が `items-start` のままだったため、ラベルが短いブロック内で見た目上センターに来ず、下寄りに見えていた。

## 修正方法

- `components/week/EventBlock.tsx` で、描画後の高さが短いイベントブロックを判定するようにした。
- 短いブロックだけ、利用可能な高さいっぱいを使うコンパクトレイアウトに切り替え、コンテンツを縦中央揃えにした。
- 短いブロックではラベルの line-height を詰めて、テキストが下に押し出されないようにした。
- 通常サイズのブロックは従来の上寄せレイアウトのままにして、既存表示への影響を避けた。
- 併せて、ブロック root に `data-eventblock="1"` を付けて、グリッド側の選択解除ロジックがイベントクリックを安定して判別できるようにした。

## 検証

- `cmd /c npm run lint`
- `cmd /c npm run build`

## 補足

- 今回の修正範囲は issue #9 に限定している。
- 短いイベントに関連する別の操作系課題、たとえばリサイズやリンクのクリック領域は、別 issue として引き続き扱う。

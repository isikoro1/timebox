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

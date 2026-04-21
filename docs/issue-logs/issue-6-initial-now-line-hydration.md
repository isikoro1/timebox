# Issue #6: Initial Current Time Line Hydration

- Date: 2026-04-22
- Issue: [#6](https://github.com/isikoro1/timebox/issues/6)

## Symptom

- On initial load, the current time line can appear at the wrong position.
- After the client updates time state, the red line moves to the correct position.

## Cause

- The current time value was computed during the initial render.
- In a statically rendered Next.js page, that initial render can happen in an environment with a different clock or timezone than the browser.
- As a result, the first painted line could reflect server-side time while later updates reflect client-side local time.

## Fix

- Initialize `useNowMin` with `null` instead of computing time during the first render.
- After mount, compute the browser-local time inside `useEffect` and keep updating it on the existing interval.
- Render the current time line only when the client-side time is available.

## Verification

- `cmd /c npm run lint`
- `cmd /c npm run build`

## Notes

- This fix is intentionally scoped to issue #6 only.
- It prefers a correct first client render over showing a potentially incorrect pre-hydration line.

---

# Issue #6: 初回表示時の現在時刻ラインと hydration

- 日付: 2026-04-22
- Issue: [#6](https://github.com/isikoro1/timebox/issues/6)

## 症状

- 初回読み込み時に、現在時刻ラインが誤った位置に表示されることがある。
- その後クライアント側で時刻状態が更新されると、赤いラインは正しい位置に戻る。

## 原因

- 現在時刻の値を初回レンダー中に計算していた。
- 静的生成された Next.js ページでは、その初回レンダーがブラウザとは異なる時計やタイムゾーンの環境で行われることがある。
- そのため、最初に描画されたラインだけサーバー側の時刻を反映し、以後の更新ではブラウザのローカル時刻を反映する、という不一致が起きていた可能性が高い。

## 修正方法

- `useNowMin` の初期値を、初回レンダーで時刻を計算する形ではなく `null` に変更した。
- マウント後に `useEffect` の中でブラウザのローカル時刻を計算し、既存の interval で更新を継続するようにした。
- クライアント側の時刻が利用可能になるまで、現在時刻ライン自体を描画しないようにした。

## 検証

- `cmd /c npm run lint`
- `cmd /c npm run build`

## 補足

- 今回の修正範囲は issue #6 に限定している。
- 誤った初期ラインを一瞬でも見せるより、クライアント時刻が確定してから正しいラインを表示する方を優先している。

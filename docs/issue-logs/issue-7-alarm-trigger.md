# Issue #7: Alarm Sound Does Not Trigger at Scheduled Time

## Symptom

The test sound worked, but the normal scheduled alarm could fail to play when an event start time was reached.

## Root Cause

The alarm hook derived the current day and current minute once during render and reused those values. The scheduled check also depended on minute-level comparisons, which made it fragile around the exact trigger boundary. In addition, browsers can block scheduled audio playback unless the audio context has been unlocked by a user gesture.

## Fix

- Reworked alarm checks to compute due events from the current wall-clock time on every check.
- Added a due grace window and a per-day fire key to prevent both missed exact-minute triggers and duplicate firing.
- Added an exact timeout for the next alarm plus a 15-second polling fallback.
- Reused a persistent `AudioContext` and exposed `primeAudio`, which is called when the user enables alarms.
- Kept notification permission handling and the test beep behavior intact.

## Verification

- `cmd /c npx tsc --noEmit`
- `cmd /c npm run lint`
- `cmd /c npm run build`

## Japanese

### 症状

テスト音は鳴る一方で、通常の時間経過で予定時刻に到達してもアラーム音が鳴らないことがありました。

### 原因

アラームフックが現在曜日と現在分を初回 render 時に固定しており、通常チェックも分単位の境界に依存していました。また、スケジュール実行時の音声再生はブラウザの autoplay 制限により失敗する可能性がありました。

### 修正

- チェックごとに現在の実時刻から due イベントを再計算するようにしました。
- 猶予時間と日付単位の fire key を追加し、境界の取り逃しと重複発火を防ぎました。
- 次回アラームへの正確な timeout と 15秒 polling の両方を使うようにしました。
- `AudioContext` を再利用し、アラーム有効化時のユーザー操作で `primeAudio` を呼ぶようにしました。
- 通知権限処理とテスト音の挙動は維持しました。

### 検証

- `cmd /c npx tsc --noEmit`
- `cmd /c npm run lint`
- `cmd /c npm run build`

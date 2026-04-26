# Issue #23: Date navigation and calendar controls

## Symptom

The timeline needed faster date navigation, clearer current-day context, and a way to jump directly to a selected calendar date. The week view also required horizontal scrolling on narrow screens.

## Root cause

The visible date range was anchored to the start of the week or centered around the selected date, and the timeline columns had a fixed minimum width. There was no month calendar picker outside the settings modal.

## Fix

- Added fixed previous, today, and next date controls above the timeline.
- Added a calendar icon below the settings icon that opens a monthly date picker.
- Changed date selection so the chosen date becomes the leftmost visible timeline column.
- Changed previous and next controls to move by one day in every view mode.
- Removed fixed day-column minimum width so the timeline fits within the viewport without horizontal scrolling.
- Highlighted today in both the timeline header and the day column.
- Added a visible year/month label in the upper-left corner.
- Moved the date navigation controls to the lower center of the screen.
- Closed the calendar popover when clicking outside the calendar control.
- Extended the current-time line across every visible day, using a darker line for non-today columns and a stronger red segment for today.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Reloaded the app in the in-app browser and confirmed one-day navigation, today jump, calendar date jump, and no horizontal scrolling in the visible week timeline.
- Confirmed the upper-left year/month label, lower date controls, outside-click calendar close behavior, and full-width current-time line.

## 日本語

### 症状

タイムラインで日付を素早く移動する操作、当日が分かりやすい表示、月カレンダーから任意の日付へジャンプする操作が必要でした。また、狭い画面では週表示に横スクロールが必要でした。

### 原因

表示範囲が週の開始日または選択日の前後に固定されており、タイムライン列には固定の最小幅が設定されていました。設定モーダルの外から使える月カレンダーもありませんでした。

### 修正

- タイムライン上部に前日、今日、翌日の固定ナビゲーションを追加しました。
- 設定アイコンの下にカレンダーアイコンを追加し、月カレンダーを開けるようにしました。
- 日付選択時に、選択した日がタイムラインの一番左に来るようにしました。
- 前後移動ボタンは、すべての表示モードで1日ずつ移動するようにしました。
- 日付列の固定最小幅をなくし、横スクロールなしで画面内に収まるようにしました。
- タイムラインのヘッダーと当日列で、今日の日付をハイライトしました。
- 画面左上に年月表示を追加しました。
- 日付移動コントロールを画面下部中央へ移動しました。
- カレンダー以外をクリックしたとき、カレンダー表示を閉じてアイコン状態に戻るようにしました。
- 現在時刻ラインを表示中のすべての日付列に横一直線で表示し、当日部分だけ赤く強調しました。

### 検証

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- in-app browser でアプリを再読み込みし、1日ずつの日付移動、今日へのジャンプ、カレンダー日付選択、週表示で横スクロールが出ないことを確認しました。
- 左上の年月表示、下部の日付移動コントロール、カレンダー外クリックで閉じる挙動、現在時刻ラインの横一直線表示を確認しました。

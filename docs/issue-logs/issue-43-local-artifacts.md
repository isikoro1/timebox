# Issue #43: ローカル生成物の扱い整理

## 症状

`dev-server.log` や `docs/learning/` のようなローカルファイルが未追跡のまま作業ツリーに残り、PR 作成時にローカル生成物を誤って混入させやすい状態だった。

## 原因

一時的なローカル出力と、リポジトリで管理すべきドキュメントの区別が明確になっていなかった。`dev-server.log` は ignore されておらず、`docs/learning/` には管理対象である理由を示す README もなかった。

## 修正

- ローカル開発ログとして `/dev-server.log` を `.gitignore` に追加した。
- `docs/learning/` はリポジトリ管理対象の学習用ドキュメントとして扱う方針にした。
- `docs/learning/README.md` を追加し、このディレクトリに置く内容を説明した。
- 判断の経緯が issue log の索引から追えるように、この実装ログを追加した。

## 検証

- `npm run lint`

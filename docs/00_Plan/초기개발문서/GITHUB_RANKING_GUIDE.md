# GitHubランキング機能 実装ガイド

## 概要
本ドキュメントは、ClickBook拡張機能に追加された「GitHubランキング」機能の設計方針、実装ガイド、運用上の注意点をまとめたものです。

---

## 1. 機能概要
- GitHubの人気リポジトリをランキング形式で表示
- カスタム検索（キーワード指定）に対応
- APIレスポンスのキャッシュ機能（chrome.storage.local）
- サイドバーからワンクリックでアクセス
- APIリミット警告表示

---

## 2. 技術方針
- **API取得**: GitHub REST API（/search/repositories）を利用
- **キャッシュ**: chrome.storage.localにランキングデータを保存し、APIリミット対策
- **型定義**: `GitHubRepo`, `GitHubRankingCache`型を`src/shared/types.ts`に定義
- **ストレージ操作**: `src/shared/storage.ts`にget/set関数を実装
- **APIラッパー**: `src/shared/githubApi.ts`でAPI取得・キャッシュ管理・検索処理を一元化
- **UI**: `src/pages/GitHubRanking.tsx`でランキング表示・検索・警告UIを実装
- **ナビゲーション**: `src/components/Sidebar.tsx`にボタン追加、`src/newtab/App.tsx`で状態管理

---

## 3. 実装手順
1. 型定義の追加（types.ts）
2. ストレージ操作関数の実装（storage.ts）
3. GitHub APIラッパーの作成（githubApi.ts）
4. ランキングページUIの作成（GitHubRanking.tsx）
5. サイドバーへのボタン追加（Sidebar.tsx）
6. App.tsxでの状態管理・ページ統合
7. 動作確認・APIリミット対応

---

## 4. 運用・注意点
- GitHub APIは未認証で1時間60回制限。キャッシュ必須。
- キャッシュは1時間有効。期限切れ時のみAPI再取得。
- APIリミット到達時は警告を表示。
- カスタム検索はAPIリミット消費に注意。
- UI/UXは既存デザインに準拠。

---

## 5. 参考
- [GitHub REST API ドキュメント](https://docs.github.com/ja/rest/search?apiVersion=2022-11-28)
- `src/shared/types.ts`, `src/shared/storage.ts`, `src/shared/githubApi.ts`, `src/pages/GitHubRanking.tsx`, `src/components/Sidebar.tsx`, `src/newtab/App.tsx`

---

## 6. 今後の拡張案
- 認証トークン対応によるAPIリミット緩和
- ランキング条件のカスタマイズ（スター数、言語等）
- ユーザーごとの履歴保存

---

最終更新: 2026-05-20

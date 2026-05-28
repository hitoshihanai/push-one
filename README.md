# Push One — Everyday Push-up

> 1回だけでいい。

腕立て伏せを毎日1回だけ続けるための、習慣化PWAアプリ。  
「ゼロ回の日を防ぐ」ための、小さな意思決定支援ツール。

---

## スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | Astro (Static) |
| データ保存 | localStorage |
| ホスティング | Cloudflare Pages |
| PWA | Service Worker + Web App Manifest |

---

## セットアップ

```bash
# 依存インストール
npm install

# 開発サーバー起動（LAN内のスマホからもアクセス可能）
npm run dev

# ビルド
npm run build

# ビルド確認
npm run preview
```

---

## デプロイ手順

**GitHubリポジトリを作成してCloudflare Pagesと連携してください。**

```bash
# GitHubにpush
git init
git add .
git commit -m "init: Push One PWA"
git remote add origin https://github.com/<your-account>/push-one.git
git push -u origin main
```

Cloudflare Pages の設定:
- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `dist`
- Node.js バージョン: 18 以上

以降は `git push` だけで自動デプロイ。

---

## PWAとしてインストール

### iPhone (iOS 16.4+)
1. Safari でアプリURLを開く
2. 共有ボタン → 「ホーム画面に追加」
3. ホーム画面のアイコンからアプリとして起動

### Android
1. Chrome でアプリURLを開く
2. アドレスバーのインストールアイコン、または「ホーム画面に追加」
3. ネイティブアプリ同様に起動可能

---

## 通知について

### 現在の実装（フロントエンドのみ）
- Service Worker による通知スケジュール（`setTimeout` ベース）
- アプリがバックグラウンドにある間は動作するが、OS がSWを終了させると止まる
- Android Chrome での動作は比較的安定している
- **iOSでの確実なバックグラウンド通知は PWA を「ホーム画面に追加」した場合のみ**

### 本番運用で確実な通知が必要な場合
Web Push Protocol (VAPID) を使ったプッシュサーバーが必要。  
Cloudflare Workers で実装可能（将来拡張ポイント）。

---

## アイコンについて

`public/icons/icon.svg` がメインのアイコンです。  
iOS のホーム画面に高品質なアイコンを表示したい場合：

1. `icon.svg` を [Squoosh](https://squoosh.app/) や [Figma](https://figma.com) で
   `192x192` / `512x512` / `180x180` の PNG に変換
2. `public/icons/` に配置
3. `manifest.json` の `type` を `"image/png"` に変更

---

## ファイル構成

```
push-one/
├── public/
│   ├── icons/
│   │   ├── icon.svg           # メインアイコン（全サイズ共通・SVG）
│   │   ├── icon-192.svg
│   │   ├── icon-512.svg
│   │   └── apple-touch-icon.svg
│   ├── manifest.json          # PWAマニフェスト
│   └── sw.js                  # Service Worker
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # ベースレイアウト（head meta等）
│   └── pages/
│       └── index.astro        # アプリ本体（CSS + HTML + JS）
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## データ構造 (localStorage)

```json
{
  "completedDates": ["2026-05-28", "2026-05-27"],
  "notificationEnabled": true,
  "notificationTime": "21:00",
  "notificationStyle": "gentle"
}
```

---

## 将来拡張候補

- Web Push サーバー（Cloudflare Workers + VAPID）
- スクワット / 腹筋版
- ヒートマップ表示
- Apple Watch 対応
- Widget 対応

---

*Push One. 1回だけでいい。*

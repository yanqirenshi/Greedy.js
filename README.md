# Greedy (物慾マトリクス)

Greedy は、欲しいもの（物慾）を「重要度」と「緊急度」のマトリクスで可視化・管理するための Web アプリケーションです。

## 機能

- **マトリクス表示**: D3.js を使用して、アイテムを 重要度×緊急度 の4象限にマッピングして表示します。
- **CRUD 操作**: アイテムの追加、編集、削除が可能です。
- **データ永続化**: PostgreSQL データベースを使用してデータを保存します。
- **エクスポート**: マトリクスを SVG 画像としてダウンロードしたり、データを JSON 形式でエクスポートできます。
- **レスポンシブデザイン**: 様々なデバイスで見やすいデザインを採用しています。

## 技術スタック

### フロントエンド
- **Vite**: 高速なビルドツール・開発サーバー
- **TypeScript**: 型安全性を提供する JavaScript のスーパーセット
- **D3.js**: データ可視化ライブラリ

### バックエンド
- **Rust**: 高速でメモリ安全なシステムプログラミング言語
- **Actix-web**: Rust 用の強力な Web フレームワーク
- **Tokio**: 非同期ランタイム
- **PostgreSQL**: リレーショナルデータベース

## セットアップ

### 必要条件
- Node.js
- Rust (Cargo)
- PostgreSQL

### インストールと起動

1. **リポジトリのクローン**
   ```bash
   git clone git@github.com:yanqirenshi/Greedy.js.git
   cd Greedy.js
   ```

2. **データベースの設定**
   PostgreSQL データベースを用意し、`server/.env` ファイルを作成して接続情報を記述してください。
   
   `server/.env` の例:
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=greedy_db
   PGUSER=postgres
   PGPASSWORD=password
   PORT=3001
   ```

3. **バックエンドの起動**
   
   サーバー起動時に自動的にデータベースのマイグレーション（テーブル作成など）が実行されます。
   
   ```bash
   cd server
   cargo run
   ```

4. **フロントエンドの起動**
   別のターミナルで実行してください。
   ```bash
   npm install
   npm run dev
   ```

## ライセンス

このプロジェクトはプライベート目的で開発されています。

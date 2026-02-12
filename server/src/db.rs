use deadpool_postgres::{Config, Pool, Runtime};
use tokio_postgres::NoTls;

/// PostgreSQL 接続プールを作成
pub fn create_pool() -> Pool {
    let mut cfg = Config::new();
    cfg.host = Some(
        std::env::var("PGHOST").unwrap_or_else(|_| "localhost".to_string()),
    );
    cfg.port = Some(
        std::env::var("PGPORT")
            .unwrap_or_else(|_| "5432".to_string())
            .parse()
            .unwrap_or(5432),
    );
    cfg.dbname = Some(
        std::env::var("PGDATABASE").unwrap_or_else(|_| "greedy".to_string()),
    );
    cfg.user = Some(
        std::env::var("PGUSER").unwrap_or_else(|_| "postgres".to_string()),
    );
    cfg.password = Some(
        std::env::var("PGPASSWORD").unwrap_or_else(|_| "postgres".to_string()),
    );

    cfg.create_pool(Some(Runtime::Tokio1), NoTls)
        .expect("PostgreSQL 接続プールの作成に失敗しました")
}

/// マイグレーション: desires テーブルを作成
pub async fn run_migration(pool: &Pool) {
    let client = pool.get().await.expect("DB接続の取得に失敗しました");

    client
        .execute(
            "CREATE TABLE IF NOT EXISTS desires (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(500) NOT NULL,
                importance VARCHAR(10) NOT NULL CHECK (importance IN ('low', 'high')),
                urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'high')),
                image_url TEXT,
                web_url TEXT,
                note TEXT,
                x DOUBLE PRECISION,
                y DOUBLE PRECISION,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )",
            &[],
        )
        .await
        .expect("マイグレーションに失敗しました");

    println!("マイグレーション完了: desires テーブル");
}

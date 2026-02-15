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

mod embedded {
    use refinery::embed_migrations;
    embed_migrations!("migrations");
}

/// マイグレーションを実行
pub async fn run_migration(pool: &Pool) {
    let mut client = pool.get().await.expect("DB接続の取得に失敗しました");

    let migration_report = embedded::migrations::runner()
        .run_async(&mut **client)
        .await
        .expect("マイグレーションに失敗しました");

    for migration in migration_report.applied_migrations() {
        println!(
            "マイグレーション適用: V{}__{}",
            migration.version(),
            migration.name()
        );
    }
    
    println!("マイグレーション完了");
}

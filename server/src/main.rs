mod db;
mod handlers;
mod models;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // .env ファイルを読み込み
    dotenv::dotenv().ok();

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .unwrap_or(3001);

    // DB 接続プールを作成
    let pool = db::create_pool();

    // マイグレーションを実行
    db::run_migration(&pool).await;

    println!("サーバーが起動しました: http://localhost:{}", port);

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .app_data(web::Data::new(pool.clone()))
            .route("/api/desires", web::get().to(handlers::get_desires))
            .route("/api/desires", web::post().to(handlers::create_desire))
            .route("/api/desires/{id}", web::put().to(handlers::update_desire))
            .route(
                "/api/desires/{id}",
                web::delete().to(handlers::delete_desire),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}

use actix_web::{web, HttpResponse};
use deadpool_postgres::Pool;
use uuid::Uuid;

use crate::models::{CreateDesire, Desire, UpdateDesire};

/// GET /api/desires - 全物慾を取得
pub async fn get_desires(pool: web::Data<Pool>) -> HttpResponse {
    let client = match pool.get().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("DB接続エラー: {}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "DB接続に失敗しました"}));
        }
    };

    match client
        .query("SELECT * FROM desires ORDER BY created_at ASC", &[])
        .await
    {
        Ok(rows) => {
            let desires: Vec<Desire> = rows.iter().map(Desire::from_row).collect();
            HttpResponse::Ok().json(desires)
        }
        Err(e) => {
            eprintln!("物慾の取得に失敗: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "物慾の取得に失敗しました"}))
        }
    }
}

/// POST /api/desires - 新しい物慾を追加
pub async fn create_desire(
    pool: web::Data<Pool>,
    body: web::Json<CreateDesire>,
) -> HttpResponse {
    let client = match pool.get().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("DB接続エラー: {}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "DB接続に失敗しました"}));
        }
    };

    if body.name.is_empty() {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "name は必須です"}));
    }

    match client
        .query_one(
            "INSERT INTO desires (name, importance, urgency, image_url, web_url, note, x, y, fulfilled_date, occurred_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, CURRENT_TIMESTAMP))
             RETURNING *",
            &[
                &body.name,
                &body.importance,
                &body.urgency,
                &body.image_url,
                &body.web_url,
                &body.note,
                &body.x,
                &body.y,
                &body.fulfilled_date,
                &body.occurred_date,
            ],
        )
        .await
    {
        Ok(row) => HttpResponse::Created().json(Desire::from_row(&row)),
        Err(e) => {
            eprintln!("物慾の追加に失敗: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "物慾の追加に失敗しました"}))
        }
    }
}

/// PUT /api/desires/{id} - 物慾を更新
pub async fn update_desire(
    pool: web::Data<Pool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateDesire>,
) -> HttpResponse {
    let id = path.into_inner();
    let client = match pool.get().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("DB接続エラー: {}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "DB接続に失敗しました"}));
        }
    };

    match client
        .query_opt(
            "UPDATE desires
             SET name = COALESCE($1, name),
                 importance = COALESCE($2, importance),
                 urgency = COALESCE($3, urgency),
                 image_url = COALESCE($4, image_url),
                 web_url = COALESCE($5, web_url),
                 note = COALESCE($6, note),
                 x = COALESCE($7, x),
                 y = COALESCE($8, y),
                 fulfilled_date = COALESCE($9, fulfilled_date),
                 occurred_date = COALESCE($10, occurred_date)
             WHERE id = $11
             RETURNING *",
            &[
                &body.name,
                &body.importance,
                &body.urgency,
                &body.image_url,
                &body.web_url,
                &body.note,
                &body.x,
                &body.y,
                &body.fulfilled_date,
                &body.occurred_date,
                &id,
            ],
        )
        .await
    {
        Ok(Some(row)) => HttpResponse::Ok().json(Desire::from_row(&row)),
        Ok(None) => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "物慾が見つかりません"})),
        Err(e) => {
            eprintln!("物慾の更新に失敗: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "物慾の更新に失敗しました"}))
        }
    }
}

/// DELETE /api/desires/{id} - 物慾を削除
pub async fn delete_desire(
    pool: web::Data<Pool>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let id = path.into_inner();
    let client = match pool.get().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("DB接続エラー: {}", e);
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "DB接続に失敗しました"}));
        }
    };

    match client
        .query_opt(
            "DELETE FROM desires WHERE id = $1 RETURNING id",
            &[&id],
        )
        .await
    {
        Ok(Some(_)) => {
            HttpResponse::Ok().json(serde_json::json!({"message": "削除しました"}))
        }
        Ok(None) => HttpResponse::NotFound()
            .json(serde_json::json!({"error": "物慾が見つかりません"})),
        Err(e) => {
            eprintln!("物慾の削除に失敗: {}", e);
            HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "物慾の削除に失敗しました"}))
        }
    }
}

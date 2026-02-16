use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// 物慾データの構造体
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Desire {
    pub id: Uuid,
    pub name: String,
    pub importance: String,
    pub urgency: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub web_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<f64>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fulfilled_date: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub occurred_date: Option<DateTime<Utc>>,
}

/// 新規作成用の入力構造体
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDesire {
    pub name: String,
    pub importance: String,
    pub urgency: String,
    pub image_url: Option<String>,
    pub web_url: Option<String>,
    pub note: Option<String>,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub fulfilled_date: Option<DateTime<Utc>>,
    pub occurred_date: Option<DateTime<Utc>>,
}

/// 更新用の入力構造体
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDesire {
    pub name: Option<String>,
    pub importance: Option<String>,
    pub urgency: Option<String>,
    pub image_url: Option<String>,
    pub web_url: Option<String>,
    pub note: Option<String>,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub fulfilled_date: Option<DateTime<Utc>>,
    pub occurred_date: Option<DateTime<Utc>>,
}

impl Desire {
    /// tokio-postgres の Row から Desire を構築
    pub fn from_row(row: &tokio_postgres::Row) -> Self {
        Desire {
            id: row.get("id"),
            name: row.get("name"),
            importance: row.get("importance"),
            urgency: row.get("urgency"),
            image_url: row.get("image_url"),
            web_url: row.get("web_url"),
            note: row.get("note"),
            x: row.get("x"),
            y: row.get("y"),
            created_at: row.get("created_at"),
            fulfilled_date: row.try_get("fulfilled_date").ok(),
            occurred_date: row.try_get("occurred_date").ok(),
        }
    }
}

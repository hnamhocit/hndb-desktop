use super::{mssql, DbClient};
use sqlx::postgres::PgConnectOptions;
use std::str::FromStr;

impl DbClient {
    pub async fn connect(driver: &str, url: &str) -> Result<Self, String> {
        match driver {
            "postgres" => {
                let options = PgConnectOptions::from_str(url)
                    .map_err(|e| e.to_string())?
                    .statement_cache_capacity(0); // Fix Supabase PgBouncer "prepared statement already exists"

                sqlx::postgres::PgPoolOptions::new()
                    .test_before_acquire(false) // Prevent spamming background queries if connection drops
                    .connect_with(options)
                    .await
                    .map(DbClient::Postgres)
                    .map_err(|e| e.to_string())
            }
            "mysql" | "mariadb" => sqlx::MySqlPool::connect(url)
                .await
                .map(DbClient::Mysql)
                .map_err(|e| e.to_string()),
            "sqlite" => sqlx::SqlitePool::connect(url)
                .await
                .map(DbClient::Sqlite)
                .map_err(|e| e.to_string()),
            "mssql" => {
                mssql::validate_connection(url).await?;
                Ok(DbClient::Mssql(url.to_string()))
            }
            _ => Err(format!("Driver chưa được hỗ trợ: {}", driver)),
        }
    }

    // 3. Đóng kết nối
    pub async fn close(&self) {
        match self {
            DbClient::Postgres(pool) => pool.close().await,
            DbClient::Mysql(pool) => pool.close().await,
            DbClient::Sqlite(pool) => pool.close().await,
            DbClient::Mssql(_) => {}
        }
    }
}

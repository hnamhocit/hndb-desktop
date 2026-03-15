use super::DbClient;

impl DbClient {
    pub async fn connect(driver: &str, url: &str) -> Result<Self, String> {
        match driver {
            "postgres" => sqlx::PgPool::connect(url)
                .await
                .map(DbClient::Postgres)
                .map_err(|e| e.to_string()),
            "mysql" | "mariadb" => sqlx::MySqlPool::connect(url)
                .await
                .map(DbClient::Mysql)
                .map_err(|e| e.to_string()),
            "sqlite" => sqlx::SqlitePool::connect(url)
                .await
                .map(DbClient::Sqlite)
                .map_err(|e| e.to_string()),
            "mssql" => Err(
                "HNDB hiện đang nâng cấp kiến trúc cho SQL Server. Sẽ sớm hỗ trợ lại!".to_string(),
            ),
            _ => Err(format!("Driver chưa được hỗ trợ: {}", driver)),
        }
    }

    // 3. Đóng kết nối
    pub async fn close(&self) {
        match self {
            DbClient::Postgres(pool) => pool.close().await,
            DbClient::Mysql(pool) => pool.close().await,
            DbClient::Sqlite(pool) => pool.close().await,
        }
    }
}

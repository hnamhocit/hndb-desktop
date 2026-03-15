use super::DbClient;

impl DbClient {
    pub async fn fetch_server_version(&self) -> String {
        match self {
            DbClient::Postgres(pool) => Self::query_pg_version(pool).await,
            DbClient::Mysql(pool) => Self::query_mysql_version(pool).await,
            DbClient::Sqlite(pool) => Self::query_sqlite_version(pool).await,
        }
    }

    async fn query_pg_version(pool: &sqlx::PgPool) -> String {
        sqlx::query_scalar::<_, String>("SELECT version()")
            .fetch_one(pool)
            .await
            .unwrap_or_else(|_| "Unknown".to_string())
    }

    async fn query_mysql_version(pool: &sqlx::MySqlPool) -> String {
        sqlx::query_scalar::<_, String>("SELECT version()")
            .fetch_one(pool)
            .await
            .unwrap_or_else(|_| "Unknown".to_string())
    }

    async fn query_sqlite_version(pool: &sqlx::SqlitePool) -> String {
        sqlx::query_scalar::<_, String>("SELECT sqlite_version()")
            .fetch_one(pool)
            .await
            .map(|v| format!("SQLite {}", v))
            .unwrap_or_else(|_| "SQLite (unknown version)".to_string())
    }
}

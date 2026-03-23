use super::DbClient;

impl DbClient {
    pub async fn fetch_server_version(&self) -> String {
        match self {
            DbClient::Postgres(pool) => Self::query_pg_version(pool).await,
            DbClient::Mysql(pool) => Self::query_mysql_version(pool).await,
            DbClient::Sqlite(pool) => Self::query_sqlite_version(pool).await,
            DbClient::Mssql(connection_string) => {
                Self::query_mssql_version(connection_string).await
            }
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

    async fn query_mssql_version(connection_string: &str) -> String {
        let rows = match super::mssql::query_json_rows(
            connection_string,
            "SELECT CAST(@@VERSION AS NVARCHAR(MAX)) AS version",
        )
        .await
        {
            Ok(rows) => rows,
            Err(_) => return "Unknown".to_string(),
        };

        rows.first()
            .and_then(|row| super::mssql::get_case_insensitive(row, "version"))
            .and_then(super::mssql::json_value_to_string)
            .unwrap_or_else(|| "Unknown".to_string())
    }
}

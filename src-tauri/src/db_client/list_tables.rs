use super::DbClient;
use sqlx::Row;

fn decode_mysql_text_column(row: &sqlx::mysql::MySqlRow, index: usize) -> Result<String, String> {
    row.try_get::<String, _>(index)
        .or_else(|_| {
            row.try_get::<Vec<u8>, _>(index)
                .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
        })
        .map_err(|e| e.to_string())
}

impl DbClient {
    pub async fn list_tables(&self) -> Result<Vec<String>, String> {
        match self {
            DbClient::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY tablename",
                )
                .fetch_all(pool)
                .await
                .map_err(|e| e.to_string())?;

                rows.into_iter()
                    .map(|row| {
                        row.try_get::<String, _>("tablename")
                            .map_err(|e| e.to_string())
                    })
                    .collect()
            }
            DbClient::Mysql(pool) => {
                let rows = sqlx::query(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name",
                )
                .fetch_all(pool)
                .await
                .map_err(|e| e.to_string())?;

                rows.into_iter()
                    .map(|row| decode_mysql_text_column(&row, 0))
                    .collect()
            }
            DbClient::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
                )
                .fetch_all(pool)
                .await
                .map_err(|e| e.to_string())?;

                rows.into_iter()
                    .map(|row| row.try_get::<String, _>("name").map_err(|e| e.to_string()))
                    .collect()
            }
        }
    }
}

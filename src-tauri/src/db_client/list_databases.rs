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
    pub async fn list_databases(&self) -> Result<Vec<String>, String> {
        match self {
            DbClient::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname",
                )
                .fetch_all(pool)
                .await
                .map_err(|e| e.to_string())?;

                rows.into_iter()
                    .map(|row| {
                        row.try_get::<String, _>("datname")
                            .map_err(|e| e.to_string())
                    })
                    .collect()
            }
            DbClient::Mysql(pool) => {
                let rows = sqlx::query("SHOW DATABASES")
                    .fetch_all(pool)
                    .await
                    .map_err(|e| e.to_string())?;

                rows.into_iter()
                    .map(|row| decode_mysql_text_column(&row, 0))
                    .collect()
            }
            DbClient::Sqlite(pool) => {
                let rows = sqlx::query("PRAGMA database_list")
                    .fetch_all(pool)
                    .await
                    .map_err(|e| e.to_string())?;

                rows.into_iter()
                    .map(|row| row.try_get::<String, _>("name").map_err(|e| e.to_string()))
                    .collect()
            }
            DbClient::Mssql(connection_string) => {
                let rows = super::mssql::query_json_rows(
                    connection_string,
                    "SELECT name FROM sys.databases ORDER BY name",
                )
                .await?;

                Ok(super::mssql::extract_string_column(rows, "name"))
            }
        }
    }
}

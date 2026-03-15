use super::DbClient;
use serde_json::{json, Map, Value as JsonValue};
use sqlx::{Column, Row, TypeInfo};

impl DbClient {
    pub async fn run_sql(&self, sql: &str) -> Result<String, String> {
        match self {
            DbClient::Postgres(pool) => Self::run_pg_query(pool, sql).await,
            DbClient::Mysql(pool) => Self::run_mysql_query(pool, sql).await,
            DbClient::Sqlite(pool) => Self::run_sqlite_query(pool, sql).await,
        }
    }

    async fn run_sqlite_query(pool: &sqlx::SqlitePool, sql: &str) -> Result<String, String> {
        // 1. Chạy câu SQL
        let rows = sqlx::query(sql)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;

        let mut result_array = Vec::new();

        // 2. Duyệt qua từng dòng dữ liệu (Row)
        for row in rows {
            let mut row_map = Map::new();

            // 3. Duyệt qua từng cột trong dòng đó
            for (i, column) in row.columns().iter().enumerate() {
                let col_name = column.name().to_string();
                let type_name = column.type_info().name(); // Lấy tên kiểu dữ liệu: INTEGER, TEXT, REAL...

                // 4. Ép kiểu động dựa vào type_name và nhét vào JSON
                let json_val = match type_name {
                    "INTEGER" | "INT" => row
                        .try_get::<i64, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    "REAL" | "FLOAT" | "DOUBLE" => row
                        .try_get::<f64, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    "BOOLEAN" | "BOOL" => row
                        .try_get::<bool, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    // Mặc định ép về String cho an toàn (TEXT, VARCHAR, DATE...)
                    _ => row
                        .try_get::<String, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                };

                row_map.insert(col_name, json_val);
            }
            result_array.push(JsonValue::Object(row_map));
        }

        // 5. Chuyển nguyên mảng JSON thành chuỗi String trả về cho Frontend
        Ok(serde_json::to_string(&result_array).unwrap_or_else(|_| "[]".to_string()))
    }

    async fn run_pg_query(pool: &sqlx::PgPool, sql: &str) -> Result<String, String> {
        let rows = sqlx::query(sql)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;
        let mut result_array = Vec::new();

        for row in rows {
            let mut row_map = Map::new();
            for (i, column) in row.columns().iter().enumerate() {
                let col_name = column.name().to_string();
                let type_name = column.type_info().name(); // VD: INT4, VARCHAR, BOOL...

                let json_val = match type_name {
                    "INT2" | "INT4" | "INT8" => row
                        .try_get::<i64, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    "FLOAT4" | "FLOAT8" | "NUMERIC" => row
                        .try_get::<f64, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    "BOOL" => row
                        .try_get::<bool, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    _ => row
                        .try_get::<String, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                };
                row_map.insert(col_name, json_val);
            }
            result_array.push(JsonValue::Object(row_map));
        }
        Ok(serde_json::to_string(&result_array).unwrap_or_else(|_| "[]".to_string()))
    }

    async fn run_mysql_query(pool: &sqlx::MySqlPool, sql: &str) -> Result<String, String> {
        let rows = sqlx::query(sql)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;
        let mut result_array = Vec::new();

        for row in rows {
            let mut row_map = Map::new();
            for (i, column) in row.columns().iter().enumerate() {
                let col_name = column.name().to_string();
                let type_name = column.type_info().name();

                let json_val = match type_name {
                    "TINYINT" | "SMALLINT" | "INT" | "BIGINT" => row
                        .try_get::<i64, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    "FLOAT" | "DOUBLE" | "DECIMAL" => row
                        .try_get::<f64, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    // Thường TinyInt(1) ở MySQL được dùng làm boolean
                    "BOOLEAN" => row
                        .try_get::<bool, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                    _ => row
                        .try_get::<String, _>(i)
                        .map(|v| json!(v))
                        .unwrap_or(JsonValue::Null),
                };
                row_map.insert(col_name, json_val);
            }
            result_array.push(JsonValue::Object(row_map));
        }
        Ok(serde_json::to_string(&result_array).unwrap_or_else(|_| "[]".to_string()))
    }
}

use super::DbClient;
use chrono::{DateTime, FixedOffset, NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde_json::{json, Map, Value as JsonValue};
use sqlx::{Column, Row, TypeInfo};

fn normalize_type_name(type_name: &str) -> String {
    type_name
        .trim()
        .to_lowercase()
        .replace(" unsigned", "")
        .replace(" zerofill", "")
}

fn decode_mysql_text_value(row: &sqlx::mysql::MySqlRow, index: usize) -> Option<JsonValue> {
    row.try_get::<String, _>(index)
        .map(|v| json!(v))
        .or_else(|_| {
            row.try_get::<Vec<u8>, _>(index)
                .map(|v| match String::from_utf8(v.clone()) {
                    Ok(text) => json!(text),
                    Err(_) => json!(format!("<{} bytes>", v.len())),
                })
        })
        .ok()
}

fn decode_mysql_json_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<sqlx::types::Json<serde_json::Value>, _>(index)
        .map(|v| v.0)
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_date_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<NaiveDate, _>(index)
        .map(|v| json!(v.format("%Y-%m-%d").to_string()))
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_time_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<NaiveTime, _>(index)
        .map(|v| json!(v.format("%H:%M:%S").to_string()))
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_datetime_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<NaiveDateTime, _>(index)
        .map(|v| json!(v.format("%Y-%m-%d %H:%M:%S").to_string()))
        .or_else(|_| {
            row.try_get::<DateTime<Utc>, _>(index)
                .map(|v| json!(v.to_rfc3339()))
        })
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_pg_bytea_value(row: &sqlx::postgres::PgRow, index: usize) -> JsonValue {
    row.try_get::<Vec<u8>, _>(index)
        .map(|v| match String::from_utf8(v.clone()) {
            Ok(text) => json!(text),
            Err(_) => json!(format!("<{} bytes>", v.len())),
        })
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_pg_json_value(row: &sqlx::postgres::PgRow, index: usize) -> JsonValue {
    row.try_get::<sqlx::types::Json<serde_json::Value>, _>(index)
        .map(|v| v.0)
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_pg_date_value(row: &sqlx::postgres::PgRow, index: usize) -> JsonValue {
    row.try_get::<NaiveDate, _>(index)
        .map(|v| json!(v.format("%Y-%m-%d").to_string()))
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_pg_time_value(row: &sqlx::postgres::PgRow, index: usize) -> JsonValue {
    row.try_get::<NaiveTime, _>(index)
        .map(|v| json!(v.format("%H:%M:%S").to_string()))
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_pg_datetime_value(row: &sqlx::postgres::PgRow, index: usize) -> JsonValue {
    row.try_get::<NaiveDateTime, _>(index)
        .map(|v| json!(v.format("%Y-%m-%d %H:%M:%S").to_string()))
        .or_else(|_| {
            row.try_get::<DateTime<FixedOffset>, _>(index)
                .map(|v| json!(v.to_rfc3339()))
        })
        .or_else(|_| {
            row.try_get::<DateTime<Utc>, _>(index)
                .map(|v| json!(v.to_rfc3339()))
        })
        .or_else(|_| row.try_get::<String, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_integer_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<i8, _>(index)
        .map(|v| json!(v))
        .or_else(|_| row.try_get::<u8, _>(index).map(|v| json!(v)))
        .or_else(|_| row.try_get::<i16, _>(index).map(|v| json!(v)))
        .or_else(|_| row.try_get::<u16, _>(index).map(|v| json!(v)))
        .or_else(|_| row.try_get::<i32, _>(index).map(|v| json!(v)))
        .or_else(|_| row.try_get::<u32, _>(index).map(|v| json!(v)))
        .or_else(|_| row.try_get::<i64, _>(index).map(|v| json!(v)))
        .or_else(|_| row.try_get::<u64, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_float_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<f32, _>(index)
        .map(|v| json!(v))
        .or_else(|_| row.try_get::<f64, _>(index).map(|v| json!(v)))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_decimal_value(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    row.try_get::<String, _>(index)
        .map(|v| json!(v))
        .or_else(|_| row.try_get::<f64, _>(index).map(|v| json!(v.to_string())))
        .or_else(|_| row.try_get::<i64, _>(index).map(|v| json!(v.to_string())))
        .or_else(|_| row.try_get::<u64, _>(index).map(|v| json!(v.to_string())))
        .unwrap_or(JsonValue::Null)
}

fn decode_mysql_fallback(row: &sqlx::mysql::MySqlRow, index: usize) -> JsonValue {
    decode_mysql_text_value(row, index)
        .or_else(|| row.try_get::<bool, _>(index).map(|v| json!(v)).ok())
        .or_else(|| row.try_get::<i64, _>(index).map(|v| json!(v)).ok())
        .or_else(|| row.try_get::<u64, _>(index).map(|v| json!(v)).ok())
        .or_else(|| row.try_get::<f64, _>(index).map(|v| json!(v)).ok())
        .unwrap_or(JsonValue::Null)
}

fn decode_sqlite_value(row: &sqlx::sqlite::SqliteRow, index: usize, type_name: &str) -> JsonValue {
    match type_name {
        "INTEGER" | "INT" => row
            .try_get::<i64, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "REAL" | "FLOAT" | "DOUBLE" => row
            .try_get::<f64, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "BOOLEAN" | "BOOL" => row
            .try_get::<bool, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        _ => row
            .try_get::<String, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
    }
}

fn decode_pg_value(row: &sqlx::postgres::PgRow, index: usize, type_name: &str) -> JsonValue {
    match type_name {
        "INT2" => row
            .try_get::<i16, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "INT4" => row
            .try_get::<i32, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "INT8" => row
            .try_get::<i64, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "FLOAT4" => row
            .try_get::<f32, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "FLOAT8" => row
            .try_get::<f64, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "NUMERIC" => row
            .try_get::<String, _>(index)
            .or_else(|_| row.try_get::<f64, _>(index).map(|v| v.to_string()))
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "BOOL" => row
            .try_get::<bool, _>(index)
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
        "DATE" => decode_pg_date_value(row, index),
        "TIME" | "TIMETZ" => decode_pg_time_value(row, index),
        "TIMESTAMP" | "TIMESTAMPTZ" => decode_pg_datetime_value(row, index),
        "JSON" | "JSONB" => decode_pg_json_value(row, index),
        "BYTEA" => decode_pg_bytea_value(row, index),
        _ => row
            .try_get::<String, _>(index)
            .or_else(|_| {
                row.try_get::<Vec<u8>, _>(index)
                    .map(|v| String::from_utf8_lossy(&v).into_owned())
            })
            .map(|v| json!(v))
            .unwrap_or(JsonValue::Null),
    }
}

fn decode_mysql_value(row: &sqlx::mysql::MySqlRow, index: usize, type_name: &str) -> JsonValue {
    let normalized = normalize_type_name(type_name);

    match normalized.as_str() {
        "tinyint" | "tiny" | "smallint" | "short" | "mediumint" | "int24" | "int" | "integer"
        | "long" | "bigint" | "longlong" | "year" => decode_mysql_integer_value(row, index),
        "float" | "double" | "double precision" => decode_mysql_float_value(row, index),
        "decimal" | "newdecimal" | "numeric" => decode_mysql_decimal_value(row, index),
        "bool" | "boolean" => row
            .try_get::<bool, _>(index)
            .map(|v| json!(v))
            .or_else(|_| row.try_get::<i8, _>(index).map(|v| json!(v)))
            .unwrap_or(JsonValue::Null),
        "date" => decode_mysql_date_value(row, index),
        "time" => decode_mysql_time_value(row, index),
        "datetime" | "timestamp" => decode_mysql_datetime_value(row, index),
        "json" => decode_mysql_json_value(row, index),
        _ => decode_mysql_fallback(row, index),
    }
}

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
                let json_val = decode_sqlite_value(&row, i, type_name);

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
                let json_val = decode_pg_value(&row, i, type_name);
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
                let json_val = decode_mysql_value(&row, i, type_name);
                row_map.insert(col_name, json_val);
            }
            result_array.push(JsonValue::Object(row_map));
        }
        Ok(serde_json::to_string(&result_array).unwrap_or_else(|_| "[]".to_string()))
    }
}

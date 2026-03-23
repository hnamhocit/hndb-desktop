use super::DbClient;
use crate::types::DbSetting;
use sqlx::Row;

impl DbClient {
    pub async fn fetch_advanced_settings(&self) -> Vec<DbSetting> {
        match self {
            DbClient::Postgres(pool) => Self::fetch_pg_settings(pool).await,
            DbClient::Mysql(pool) => Self::fetch_mysql_settings(pool).await,
            DbClient::Sqlite(pool) => Self::fetch_sqlite_settings(pool).await,
            DbClient::Mssql(connection_string) => {
                Self::fetch_mssql_settings(connection_string).await
            }
        }
    }

    async fn fetch_pg_settings(pool: &sqlx::PgPool) -> Vec<DbSetting> {
        let rows = sqlx::query(
            r#"
        SELECT name, setting, category, short_desc, vartype, enumvals, min_val, max_val, context
        FROM pg_settings
        ORDER BY category, name
        "#,
        )
        .fetch_all(pool)
        .await;

        match rows {
            Ok(rows) => rows
                .iter()
                .map(|r| {
                    let context: Option<String> = r.try_get("context").ok();
                    let is_editable =
                        matches!(context.as_deref(), Some("user") | Some("superuser"));

                    DbSetting {
                        name: r.try_get("name").unwrap_or_default(),
                        value: r.try_get("setting").unwrap_or_default(),
                        category: r.try_get("category").ok(),
                        description: r.try_get("short_desc").ok(),
                        setting_type: r
                            .try_get("vartype")
                            .unwrap_or_else(|_| "string".to_string()),
                        enum_values: r.try_get("enumvals").ok(),
                        min_val: r.try_get("min_val").ok(),
                        max_val: r.try_get("max_val").ok(),
                        is_editable,
                    }
                })
                .collect(),
            Err(_) => vec![],
        }
    }

    pub(crate) async fn fetch_mysql_settings(pool: &sqlx::MySqlPool) -> Vec<DbSetting> {
        // KHÔNG dùng dấu !
        let rows = sqlx::query("SHOW SESSION VARIABLES").fetch_all(pool).await;

        match rows {
            Ok(rows) => rows
                .iter()
                .map(|r| DbSetting {
                    name: r.try_get("Variable_name").unwrap_or_default(),
                    value: r.try_get("Value").unwrap_or_default(),
                    category: None,
                    description: None,
                    setting_type: "string".to_string(),
                    enum_values: None,
                    min_val: None,
                    max_val: None,
                    is_editable: true,
                })
                .collect(),
            Err(_) => vec![],
        }
    }

    pub(crate) async fn fetch_sqlite_settings(pool: &sqlx::SqlitePool) -> Vec<DbSetting> {
        // Đoạn SQLite của bạn vốn đã viết quá chuẩn (dùng sqlx::query không có macro)
        let pragmas = vec![
            (
                "journal_mode",
                "Logging",
                "WAL mode giúp tăng performance đọc concurrent",
                "enum",
                Some(vec![
                    "DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF",
                ]),
            ),
            (
                "synchronous",
                "Logging",
                "Mức độ fsync khi ghi",
                "enum",
                Some(vec!["OFF", "NORMAL", "FULL", "EXTRA"]),
            ),
            (
                "cache_size",
                "Memory",
                "Số trang cache trong bộ nhớ (âm = KB)",
                "integer",
                None,
            ),
            (
                "page_size",
                "Storage",
                "Kích thước trang (bytes), chỉ set khi tạo DB",
                "integer",
                None,
            ),
            (
                "foreign_keys",
                "Behavior",
                "Bật/tắt foreign key constraint",
                "bool",
                None,
            ),
            (
                "busy_timeout",
                "Behavior",
                "Thời gian chờ (ms) khi DB bị lock",
                "integer",
                None,
            ),
            (
                "auto_vacuum",
                "Storage",
                "Chế độ tự dọn không gian trống",
                "enum",
                Some(vec!["NONE", "FULL", "INCREMENTAL"]),
            ),
            (
                "encoding",
                "Storage",
                "Encoding của file DB",
                "enum",
                Some(vec!["UTF-8", "UTF-16", "UTF-16le", "UTF-16be"]),
            ),
            (
                "mmap_size",
                "Memory",
                "Kích thước memory-mapped I/O (bytes)",
                "integer",
                None,
            ),
            (
                "temp_store",
                "Memory",
                "Nơi lưu bảng tạm",
                "enum",
                Some(vec!["DEFAULT", "FILE", "MEMORY"]),
            ),
        ];

        let mut settings = Vec::new();

        for (pragma_name, category, desc, setting_type, enum_values) in pragmas {
            let query = format!("PRAGMA {}", pragma_name);
            let result = sqlx::query(&query).fetch_one(pool).await;

            let value = match result {
                Ok(row) => row
                    .try_get::<String, _>(0)
                    .or_else(|_| row.try_get::<i64, _>(0).map(|v| v.to_string()))
                    .unwrap_or_default(),
                Err(_) => String::new(),
            };

            settings.push(DbSetting {
                name: pragma_name.to_string(),
                value,
                category: Some(category.to_string()),
                description: Some(desc.to_string()),
                setting_type: setting_type.to_string(),
                enum_values: enum_values.map(|v| v.iter().map(|s| s.to_string()).collect()),
                min_val: None,
                max_val: None,
                is_editable: pragma_name != "page_size" && pragma_name != "encoding",
            });
        }

        settings
    }

    pub(crate) async fn fetch_mssql_settings(connection_string: &str) -> Vec<DbSetting> {
        let rows = match super::mssql::query_json_rows(
            connection_string,
            "SELECT name, CAST(value_in_use AS NVARCHAR(4000)) AS value FROM sys.configurations ORDER BY name",
        )
        .await
        {
            Ok(rows) => rows,
            Err(_) => return vec![],
        };

        rows.into_iter()
            .map(|row| DbSetting {
                name: super::mssql::get_case_insensitive(&row, "name")
                    .and_then(super::mssql::json_value_to_string)
                    .unwrap_or_default(),
                value: super::mssql::get_case_insensitive(&row, "value")
                    .and_then(super::mssql::json_value_to_string)
                    .unwrap_or_default(),
                category: Some("server".to_string()),
                description: None,
                setting_type: "string".to_string(),
                enum_values: None,
                min_val: None,
                max_val: None,
                is_editable: true,
            })
            .collect()
    }
}

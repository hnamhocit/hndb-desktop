use crate::db_client::DbClient;
use crate::helpers::{
    check_and_disconnect_if_fatal, ensure_connection_is_connected,
    get_config_by_id, get_or_create_database_connection,
};
use crate::state::AppState;
use crate::types::TableColumn;
use serde_json::Value;
use std::collections::{HashMap, HashSet};

fn json_string(value: Option<&Value>) -> Option<String> {
    match value {
        Some(Value::String(text)) => Some(text.clone()),
        Some(Value::Number(number)) => Some(number.to_string()),
        Some(Value::Bool(boolean)) => Some(boolean.to_string()),
        Some(Value::Null) | None => None,
        Some(other) => Some(other.to_string()),
    }
}

fn json_bool(value: Option<&Value>) -> bool {
    match value {
        Some(Value::Bool(boolean)) => *boolean,
        Some(Value::Number(number)) => number.as_i64().unwrap_or_default() != 0,
        Some(Value::String(text)) => matches!(
            text.trim().to_lowercase().as_str(),
            "1" | "true" | "t" | "yes"
        ),
        _ => false,
    }
}

fn json_u64(value: Option<&Value>) -> u64 {
    match value {
        Some(Value::Number(number)) => number.as_u64().unwrap_or_default(),
        Some(Value::String(text)) => text.parse::<u64>().unwrap_or_default(),
        _ => 0,
    }
}

fn parse_json_rows(raw: &str) -> Result<Vec<HashMap<String, Value>>, String> {
    serde_json::from_str::<Vec<HashMap<String, Value>>>(raw).map_err(|e| e.to_string())
}

fn row_value<'a>(row: &'a HashMap<String, Value>, key: &str) -> Option<&'a Value> {
    row.get(key).or_else(|| {
        row.iter()
            .find(|(candidate, _)| candidate.eq_ignore_ascii_case(key))
            .map(|(_, value)| value)
    })
}

fn build_postgres_schema_query() -> &'static str {
    r#"
        SELECT
            cols.table_name AS table_name,
            cols.column_name AS column_name,
            cols.data_type AS data_type,
            (cols.is_nullable = 'YES') AS is_nullable,
            cols.column_default AS column_default,
            EXISTS (
                SELECT 1
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                    AND tc.table_name = kcu.table_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND tc.table_schema = cols.table_schema
                    AND tc.table_name = cols.table_name
                    AND kcu.column_name = cols.column_name
            ) AS is_primary,
            EXISTS (
                SELECT 1
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                    AND tc.table_name = kcu.table_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = cols.table_schema
                    AND tc.table_name = cols.table_name
                    AND kcu.column_name = cols.column_name
            ) AS is_foreign_key,
            EXISTS (
                SELECT 1
                FROM pg_class t
                JOIN pg_namespace n ON n.oid = t.relnamespace
                JOIN pg_index i ON i.indrelid = t.oid
                JOIN pg_attribute a
                    ON a.attrelid = t.oid
                    AND a.attnum = ANY(i.indkey)
                WHERE n.nspname = cols.table_schema
                    AND t.relname = cols.table_name
                    AND a.attname = cols.column_name
                    AND i.indisunique
            ) AS is_unique,
            EXISTS (
                SELECT 1
                FROM pg_class t
                JOIN pg_namespace n ON n.oid = t.relnamespace
                JOIN pg_index i ON i.indrelid = t.oid
                JOIN pg_attribute a
                    ON a.attrelid = t.oid
                    AND a.attnum = ANY(i.indkey)
                WHERE n.nspname = cols.table_schema
                    AND t.relname = cols.table_name
                    AND a.attname = cols.column_name
            ) AS is_indexed,
            (
                SELECT ccu.table_name || '.' || ccu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                    AND tc.table_name = kcu.table_name
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.constraint_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = cols.table_schema
                    AND tc.table_name = cols.table_name
                    AND kcu.column_name = cols.column_name
                LIMIT 1
            ) AS foreign_key_target
        FROM information_schema.columns cols
        WHERE cols.table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY cols.table_name, cols.ordinal_position
    "#
}

fn build_mysql_schema_query() -> &'static str {
    r#"
        SELECT
            c.table_name AS table_name,
            c.column_name AS column_name,
            c.data_type AS data_type,
            (c.is_nullable = 'YES') AS is_nullable,
            c.column_default AS column_default,
            EXISTS (
                SELECT 1
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_schema = kcu.constraint_schema
                    AND tc.table_name = kcu.table_name
                    AND tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND tc.table_schema = c.table_schema
                    AND tc.table_name = c.table_name
                    AND kcu.column_name = c.column_name
            ) AS is_primary,
            EXISTS (
                SELECT 1
                FROM information_schema.key_column_usage kcu
                WHERE kcu.table_schema = c.table_schema
                    AND kcu.table_name = c.table_name
                    AND kcu.column_name = c.column_name
                    AND kcu.referenced_table_name IS NOT NULL
            ) AS is_foreign_key,
            EXISTS (
                SELECT 1
                FROM information_schema.statistics s
                WHERE s.table_schema = c.table_schema
                    AND s.table_name = c.table_name
                    AND s.column_name = c.column_name
                    AND s.non_unique = 0
            ) AS is_unique,
            EXISTS (
                SELECT 1
                FROM information_schema.statistics s
                WHERE s.table_schema = c.table_schema
                    AND s.table_name = c.table_name
                    AND s.column_name = c.column_name
            ) AS is_indexed,
            (
                SELECT CONCAT(kcu.referenced_table_name, '.', kcu.referenced_column_name)
                FROM information_schema.key_column_usage kcu
                WHERE kcu.table_schema = c.table_schema
                    AND kcu.table_name = c.table_name
                    AND kcu.column_name = c.column_name
                    AND kcu.referenced_table_name IS NOT NULL
                LIMIT 1
            ) AS foreign_key_target
        FROM information_schema.columns c
        WHERE c.table_schema = DATABASE()
        ORDER BY c.table_name, c.ordinal_position
    "#
}

fn build_mssql_schema_query() -> &'static str {
    r#"
        SELECT
            t.name AS table_name,
            c.name AS column_name,
            ty.name AS data_type,
            CAST(c.is_nullable AS bit) AS is_nullable,
            dc.definition AS column_default,
            CAST(CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS bit) AS is_primary,
            CAST(CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS bit) AS is_foreign_key,
            CAST(CASE WHEN uq.column_id IS NOT NULL THEN 1 ELSE 0 END AS bit) AS is_unique,
            CAST(CASE WHEN ix.column_id IS NOT NULL THEN 1 ELSE 0 END AS bit) AS is_indexed,
            CASE
                WHEN fk.parent_column_id IS NOT NULL THEN CONCAT(rt.name, '.', rc.name)
                ELSE NULL
            END AS foreign_key_target
        FROM sys.tables t
        JOIN sys.columns c ON c.object_id = t.object_id
        JOIN sys.types ty ON ty.user_type_id = c.user_type_id
        LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
        LEFT JOIN (
            SELECT ic.object_id, ic.column_id
            FROM sys.indexes i
            JOIN sys.index_columns ic
                ON i.object_id = ic.object_id
                AND i.index_id = ic.index_id
            WHERE i.is_primary_key = 1
        ) pk ON pk.object_id = c.object_id AND pk.column_id = c.column_id
        LEFT JOIN (
            SELECT ic.object_id, ic.column_id
            FROM sys.indexes i
            JOIN sys.index_columns ic
                ON i.object_id = ic.object_id
                AND i.index_id = ic.index_id
            WHERE i.is_unique = 1
        ) uq ON uq.object_id = c.object_id AND uq.column_id = c.column_id
        LEFT JOIN (
            SELECT ic.object_id, ic.column_id
            FROM sys.indexes i
            JOIN sys.index_columns ic
                ON i.object_id = ic.object_id
                AND i.index_id = ic.index_id
            GROUP BY ic.object_id, ic.column_id
        ) ix ON ix.object_id = c.object_id AND ix.column_id = c.column_id
        LEFT JOIN sys.foreign_key_columns fk
            ON fk.parent_object_id = c.object_id
            AND fk.parent_column_id = c.column_id
        LEFT JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
        LEFT JOIN sys.columns rc
            ON rc.object_id = fk.referenced_object_id
            AND rc.column_id = fk.referenced_column_id
        WHERE t.is_ms_shipped = 0
        ORDER BY t.name, c.column_id
    "#
}

fn quote_sqlite_identifier(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

fn rows_to_schema(rows: Vec<HashMap<String, Value>>) -> HashMap<String, Vec<TableColumn>> {
    let mut schema = HashMap::<String, Vec<TableColumn>>::new();

    for row in rows {
        let table_name = json_string(row_value(&row, "table_name")).unwrap_or_default();
        if table_name.is_empty() {
            continue;
        }

        schema.entry(table_name).or_default().push(TableColumn {
            column_name: json_string(row_value(&row, "column_name")).unwrap_or_default(),
            data_type: json_string(row_value(&row, "data_type"))
                .unwrap_or_else(|| "unknown".to_string()),
            is_nullable: json_bool(row_value(&row, "is_nullable")),
            column_default: json_string(row_value(&row, "column_default")),
            is_primary: json_bool(row_value(&row, "is_primary")),
            is_foreign_key: json_bool(row_value(&row, "is_foreign_key")),
            is_unique: json_bool(row_value(&row, "is_unique")),
            is_indexed: json_bool(row_value(&row, "is_indexed")),
            foreign_key_target: json_string(row_value(&row, "foreign_key_target")),
        });
    }

    schema
}

async fn fetch_sqlite_schema(
    client: &DbClient,
    database: &str,
) -> Result<HashMap<String, Vec<TableColumn>>, String> {
    let database_name = if database.trim().is_empty() {
        "main"
    } else {
        database
    };

    let tables = client.list_tables().await?;
    let mut schema = HashMap::new();

    for table_name in tables {
        let quoted_db = quote_sqlite_identifier(database_name);
        let quoted_table = quote_sqlite_identifier(&table_name);

        let column_rows = parse_json_rows(
            &client
                .run_sql(&format!(
                    "PRAGMA {}.table_info({})",
                    quoted_db, quoted_table
                ))
                .await?,
        )?;
        let foreign_key_rows = parse_json_rows(
            &client
                .run_sql(&format!(
                    "PRAGMA {}.foreign_key_list({})",
                    quoted_db, quoted_table
                ))
                .await?,
        )?;
        let index_rows = parse_json_rows(
            &client
                .run_sql(&format!(
                    "PRAGMA {}.index_list({})",
                    quoted_db, quoted_table
                ))
                .await?,
        )?;

        let mut foreign_keys = HashMap::new();
        for row in foreign_key_rows {
            if let Some(from_column) = json_string(row.get("from")) {
                let target = match (json_string(row.get("table")), json_string(row.get("to"))) {
                    (Some(table), Some(column)) => Some(format!("{}.{}", table, column)),
                    _ => None,
                };
                foreign_keys.insert(from_column, target);
            }
        }

        let mut indexed_columns = HashSet::new();
        let mut unique_columns = HashSet::new();

        for row in index_rows {
            let Some(index_name) = json_string(row.get("name")) else {
                continue;
            };
            let is_unique_index = json_bool(row.get("unique"));
            let quoted_index = quote_sqlite_identifier(&index_name);
            let index_info_rows = parse_json_rows(
                &client
                    .run_sql(&format!(
                        "PRAGMA {}.index_info({})",
                        quoted_db, quoted_index
                    ))
                    .await?,
            )?;

            for index_info in index_info_rows {
                if let Some(column_name) = json_string(index_info.get("name")) {
                    indexed_columns.insert(column_name.clone());
                    if is_unique_index {
                        unique_columns.insert(column_name);
                    }
                }
            }
        }

        let columns = column_rows
            .into_iter()
            .map(|row| {
                let column_name = json_string(row.get("name")).unwrap_or_default();
                let is_primary = json_u64(row.get("pk")) > 0;
                let is_foreign_key = foreign_keys.contains_key(&column_name);

                TableColumn {
                    column_name: column_name.clone(),
                    data_type: json_string(row.get("type")).unwrap_or_else(|| "TEXT".to_string()),
                    is_nullable: !json_bool(row.get("notnull")),
                    column_default: json_string(row.get("dflt_value")),
                    is_primary,
                    is_foreign_key,
                    is_unique: is_primary || unique_columns.contains(&column_name),
                    is_indexed: is_primary || indexed_columns.contains(&column_name),
                    foreign_key_target: foreign_keys.get(&column_name).cloned().flatten(),
                }
            })
            .collect::<Vec<_>>();

        schema.insert(table_name, columns);
    }

    Ok(schema)
}

#[tauri::command]
pub async fn get_table_schema(
    id: String,
    database: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<HashMap<String, Vec<TableColumn>>, String> {
    ensure_connection_is_connected(&id, &state).await?;

    let config = get_config_by_id(&app, id.as_str())?;
    let client = match get_or_create_database_connection(id.as_str(), database.as_str(), &app, &state).await {
        Ok(c) => c,
        Err(e) => {
            check_and_disconnect_if_fatal(&id, &state, &e).await;
            return Err(e);
        }
    };

    let schema_result = match config.driver.as_str() {
        "postgres" => {
            match client.run_sql(build_postgres_schema_query()).await {
                Ok(raw) => Ok(rows_to_schema(parse_json_rows(&raw)?)),
                Err(e) => Err(e),
            }
        }
        "mysql" | "mariadb" => {
            match client.run_sql(build_mysql_schema_query()).await {
                Ok(raw) => Ok(rows_to_schema(parse_json_rows(&raw)?)),
                Err(e) => Err(e),
            }
        }
        "mssql" => {
            match client.run_sql(build_mssql_schema_query()).await {
                Ok(raw) => Ok(rows_to_schema(parse_json_rows(&raw)?)),
                Err(e) => Err(e),
            }
        }
        "sqlite" => fetch_sqlite_schema(&client, &database).await,
        driver => {
            return Err(format!(
                "Schema inspection is not supported for driver: {}",
                driver
            ));
        }
    };

    match schema_result {
        Ok(schema) => Ok(schema),
        Err(e) => {
            check_and_disconnect_if_fatal(&id, &state, &e).await;
            Err(e)
        }
    }
}

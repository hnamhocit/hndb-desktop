use crate::db_client::DbClient;
use crate::helpers::{
    build_conn_str, ensure_connection_is_connected, get_config_by_id, override_database,
};
use crate::state::AppState;
use crate::types::TablePreviewResult;
use serde_json::Value;
use std::collections::HashMap;
use std::time::Instant;

fn quote_identifier(driver: &str, value: &str) -> String {
    match driver {
        "mysql" | "mariadb" => format!("`{}`", value.replace('`', "``")),
        _ => format!("\"{}\"", value.replace('"', "\"\"")),
    }
}

fn build_preview_query(driver: &str, database: &str, table: &str, page: u64, limit: u64) -> String {
    let offset = page.saturating_sub(1).saturating_mul(limit);

    let table_ref = if driver == "sqlite" && !database.trim().is_empty() {
        format!(
            "{}.{}",
            quote_identifier(driver, database),
            quote_identifier(driver, table)
        )
    } else {
        quote_identifier(driver, table)
    };

    format!(
        "SELECT * FROM {} LIMIT {} OFFSET {}",
        table_ref, limit, offset
    )
}

#[tauri::command]
pub async fn get_table_preview(
    id: String,
    database: String,
    table: String,
    page: u64,
    limit: u64,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<TablePreviewResult, String> {
    ensure_connection_is_connected(&id, &state).await?;

    let config = get_config_by_id(&app, id.as_str())?;
    let effective_config = override_database(&config, Some(database.as_str()))?;
    let conn_str = build_conn_str(&effective_config)?;
    let client = DbClient::connect(&effective_config.driver, &conn_str).await?;

    let query = build_preview_query(&effective_config.driver, &database, &table, page, limit);
    let started_at = Instant::now();
    let raw = client.run_sql(&query).await?;
    client.close().await;

    let rows =
        serde_json::from_str::<Vec<HashMap<String, Value>>>(&raw).map_err(|e| e.to_string())?;
    let is_limited = rows.len() as u64 >= limit;

    Ok(TablePreviewResult {
        rows,
        duration_ms: started_at.elapsed().as_millis(),
        is_limited,
        affected_rows: None,
        command: Some("SELECT".to_string()),
        size_bytes: raw.as_bytes().len(),
    })
}

use crate::db_client::DbClient;
use crate::helpers::{build_conn_str, ensure_connection_is_connected, get_config_by_id};
use crate::state::AppState;

#[tauri::command]
pub async fn list_databases(
    id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    ensure_connection_is_connected(&id, &state).await?;

    let config = get_config_by_id(&app, id.as_str())?;
    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    let result = client.list_databases().await;
    client.close().await;

    result
}

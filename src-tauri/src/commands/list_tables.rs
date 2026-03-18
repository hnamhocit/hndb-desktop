use crate::db_client::DbClient;
use crate::helpers::{
    build_conn_str, ensure_connection_is_connected, get_config_by_id, override_database,
};
use crate::state::AppState;

#[tauri::command]
pub async fn list_tables(
    id: String,
    database: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    ensure_connection_is_connected(&id, &state).await?;

    let config = get_config_by_id(&app, id.as_str())?;
    let effective_config = override_database(&config, Some(database.as_str()))?;
    let conn_str = build_conn_str(&effective_config)?;
    let client = DbClient::connect(&effective_config.driver, &conn_str).await?;

    let result = client.list_tables().await;
    client.close().await;

    result
}

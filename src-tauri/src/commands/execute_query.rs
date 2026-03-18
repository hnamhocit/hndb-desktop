use crate::db_client::DbClient;
use crate::helpers::{
    build_conn_str, ensure_connection_is_connected, get_config_by_id, override_database,
};
use crate::state::AppState;

#[tauri::command]
pub async fn execute_query(
    id: String,
    database: Option<String>,
    query: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    ensure_connection_is_connected(&id, &state).await?;

    if let Some(target_database) = database.as_deref() {
        let config = get_config_by_id(&app, id.as_str())?;
        let effective_config = override_database(&config, Some(target_database))?;
        let conn_str = build_conn_str(&effective_config)?;
        let client = DbClient::connect(&effective_config.driver, &conn_str).await?;

        let result = client.run_sql(&query).await;
        client.close().await;

        return result;
    }

    let connections_map = state.active_connections.lock().await;

    if let Some(client) = connections_map.get(&id) {
        let result_json = client.run_sql(&query).await?;

        Ok(result_json)
    } else {
        let config = get_config_by_id(&app, id.as_str())?;
        let conn_str = build_conn_str(&config)?;
        let client = DbClient::connect(&config.driver, &conn_str).await?;

        let result = client.run_sql(&query).await;
        client.close().await;

        result
    }
}

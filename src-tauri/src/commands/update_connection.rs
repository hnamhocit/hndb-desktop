use std::collections::HashMap;

use crate::db_client::DbClient;
use crate::helpers::{build_conn_str, get_saved_connection, save_saved_connection};
use crate::state::AppState;
use crate::types::ConnectionConfig;

#[tauri::command]
pub async fn update_connection(
    connection_id: String,
    connection_name: String,
    config: ConnectionConfig,
    overrides: HashMap<String, String>,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut connection = get_saved_connection(&app, &connection_id)?;

    connection.name = connection_name;
    connection.config = config.clone();
    connection.setting_overrides = overrides;

    save_saved_connection(&app, &connection)?;

    {
        let mut connections_map = state.active_connections.lock().await;
        if let Some(client) = connections_map.remove(&connection_id) {
            client.close().await;
        }
    }

    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(connection_id.clone(), client);
    drop(connections_map);

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&connection_id);

    Ok(())
}

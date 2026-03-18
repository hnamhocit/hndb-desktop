use crate::db_client::DbClient;
use crate::helpers::build_conn_str;
use crate::helpers::get_config_by_id;
use crate::state::AppState;

#[tauri::command]
pub async fn connect_session(
    id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let config = get_config_by_id(&app, id.as_str())?;

    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(id.clone(), client);
    drop(connections_map);

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&id);

    Ok(())
}

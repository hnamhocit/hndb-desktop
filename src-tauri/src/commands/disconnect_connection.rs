use crate::AppState;

#[tauri::command]
pub async fn disconnect_connection(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut connections_map = state.active_connections.lock().await;

    if let Some(client) = connections_map.remove(&id) {
        client.close().await;
    }

    Ok(())
}

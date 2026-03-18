use crate::state::AppState;

pub async fn ensure_connection_is_connected(
    id: &str,
    state: &tauri::State<'_, AppState>,
) -> Result<(), String> {
    let manually_disconnected = state.manually_disconnected_connections.lock().await;

    if manually_disconnected.contains(id) {
        return Err("Connection is disconnected. Please connect again.".to_string());
    }

    Ok(())
}

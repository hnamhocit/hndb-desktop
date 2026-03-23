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

pub async fn disconnect_due_to_error(id: &str, state: &tauri::State<'_, AppState>) {
    let mut connections_map = state.active_connections.lock().await;
    if let Some(client) = connections_map.remove(id) {
        client.close().await;
    }
    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.insert(id.to_string());
}

pub async fn check_and_disconnect_if_fatal(
    id: &str,
    state: &tauri::State<'_, AppState>,
    error_msg: &str,
) {
    let msg = error_msg.to_lowercase();
    if msg.contains("prepared statement")
        || msg.contains("connection refused")
        || msg.contains("password authentication failed")
        || msg.contains("timeout")
        || msg.contains("server closed the connection")
        || msg.contains("terminating connection")
        || msg.contains("ssl error")
        || msg.contains("broken pipe")
    {
        disconnect_due_to_error(id, state).await;
    }
}


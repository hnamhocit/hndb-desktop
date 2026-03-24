use crate::helpers::remove_connection_family;
use crate::AppState;

#[tauri::command]
pub async fn disconnect_connection(
    id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let clients = remove_connection_family(&id, &state).await;
    for client in clients {
        client.close().await;
    }

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.insert(id);

    Ok(())
}

use crate::db_client::DbClient;
use crate::state::AppState;

#[tauri::command]
pub async fn reset_connection_sessions(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let clients = {
        let mut connections_map = state.active_connections.lock().await;
        connections_map
            .drain()
            .map(|(_, client)| client)
            .collect::<Vec<DbClient>>()
    };

    for client in clients {
        client.close().await;
    }

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.clear();

    Ok(())
}

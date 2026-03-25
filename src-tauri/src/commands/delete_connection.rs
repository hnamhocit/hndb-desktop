use crate::helpers::{delete_saved_connection, remove_connection_family};
use crate::state::AppState;

#[tauri::command]
pub async fn delete_connection(
    connection_id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let clients = remove_connection_family(&connection_id, &state).await;
    for client in clients {
        client.close().await;
    }

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&connection_id);
    drop(manually_disconnected);

    let mut session_passwords = state.session_connection_passwords.lock().await;
    session_passwords.remove(&connection_id);
    drop(session_passwords);

    // --- BƯỚC 2: XÓA KHỎI STRONGHOLD ---
    delete_saved_connection(&app, &connection_id)?;

    Ok(())
}

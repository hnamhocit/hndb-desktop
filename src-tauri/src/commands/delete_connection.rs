use crate::helpers::delete_saved_connection;
use crate::state::AppState;

#[tauri::command]
pub async fn delete_connection(
    connection_id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // --- BƯỚC 1: DỌN DẸP RAM VÀ CẮT KẾT NỐI TCP ---
    {
        // Vẫn dùng block {} để nhả Mutex sớm cho an toàn
        let mut connections_map = state.active_connections.lock().await;

        if let Some(client) = connections_map.remove(&connection_id) {
            client.close().await;
        }
    }

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&connection_id);
    drop(manually_disconnected);

    // --- BƯỚC 2: XÓA KHỎI STRONGHOLD ---
    delete_saved_connection(&app, &connection_id)?;

    Ok(())
}

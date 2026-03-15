use crate::state::AppState;
use tauri_plugin_store::StoreExt;

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

    // --- BƯỚC 2: XÓA SỔ KHỎI Ổ CỨNG (connections.json) ---
    let store = app
        .store("connections.json")
        .map_err(|e| format!("Không mở được store: {}", e))?;

    store.delete(&connection_id); // Truyền tham chiếu &
    store.save().map_err(|e| format!("Không lưu được: {}", e))?;

    Ok(())
}

use tauri_plugin_store::StoreExt;

use crate::types::SavedConnection;

#[tauri::command]
pub async fn list_connections(app: tauri::AppHandle) -> Result<Vec<SavedConnection>, String> {
    let store = app
        .store("connections.json")
        .map_err(|e| format!("Không mở được store: {}", e))?;
    let mut connections = Vec::new();

    for key in store.keys() {
        if let Some(val) = store.get(&key) {
            if let Ok(conn) = serde_json::from_value::<SavedConnection>(val) {
                connections.push(conn);
            }
        }
    }
    connections.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(connections)
}

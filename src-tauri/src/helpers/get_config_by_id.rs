use crate::types::ConnectionConfig;
use crate::types::SavedConnection;
use tauri_plugin_store::StoreExt;

pub fn get_config_by_id(app: &tauri::AppHandle, id: &str) -> Result<ConnectionConfig, String> {
    let store = app.store("connections.json").map_err(|e| e.to_string())?;
    let saved_val = store.get(id).ok_or("Không tìm thấy!")?;
    let saved_conn: SavedConnection =
        serde_json::from_value(saved_val).map_err(|e| e.to_string())?;

    Ok(saved_conn.config)
}

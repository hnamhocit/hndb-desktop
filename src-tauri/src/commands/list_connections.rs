use crate::helpers::list_saved_connections;
use crate::types::SavedConnection;

#[tauri::command]
pub async fn list_connections(app: tauri::AppHandle) -> Result<Vec<SavedConnection>, String> {
    list_saved_connections(&app)
}

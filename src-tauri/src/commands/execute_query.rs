use crate::state::AppState;

#[tauri::command]
pub async fn execute_query(
    id: String,
    query: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let connections_map = state.active_connections.lock().await;

    if let Some(client) = connections_map.get(&id) {
        let result_json = client.run_sql(&query).await?;

        Ok(result_json)
    } else {
        Err("Lỗi: Kết nối này chưa được mở (Không tìm thấy trong RAM)!".to_string())
    }
}
